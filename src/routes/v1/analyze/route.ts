import { createHash, randomUUID } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { appConfig, plans } from "@/lib/shared/config";
import { authenticateApiKey, type ApiPrincipal } from "@/lib/server/api-auth";
import { ApiError, errorResponse } from "@/lib/shared/errors";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { analyzeWebsite } from "@/lib/server/business-analysis";
import { normalizeUserUrl } from "@/lib/server/url-safety";

function monthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

async function readLimitedJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length") ?? 0) > 4096 || !request.body) {
    throw new ApiError("INVALID_URL", "The request body is missing or too large.");
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 4096) {
      await reader.cancel();
      throw new ApiError("INVALID_URL", "The request body is too large.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new ApiError("INVALID_URL", "The request body must be valid JSON.");
  }
}

async function reserveRequest(userId: string, apiKeyId: string, plan: keyof typeof plans) {
  const db = getAdminDb();
  const month = monthKey();
  const minute = Math.floor(Date.now() / 60_000);
  const monthlyReference = db.collection("monthlyUsage").doc(`${userId}_${month}`);
  const keyMonthlyReference = db.collection("monthlyKeyUsage").doc(`${userId}_${apiKeyId}_${month}`);
  const rateReference = db.collection("rateLimitBuckets").doc(`${apiKeyId}_${minute}`);
  await db.runTransaction(async (transaction) => {
    const [monthlySnapshot, keyMonthlySnapshot, rateSnapshot] = await Promise.all([
      transaction.get(monthlyReference),
      transaction.get(keyMonthlyReference),
      transaction.get(rateReference),
    ]);
    const monthlyRequests = Number(monthlySnapshot.get("requests") ?? 0);
    const minuteRequests = Number(rateSnapshot.get("requests") ?? 0);
    if (monthlyRequests >= plans[plan].monthlyRequests) throw new ApiError("QUOTA_EXCEEDED", "The monthly plan quota has been reached.");
    if (minuteRequests >= plans[plan].requestsPerMinute) throw new ApiError("RATE_LIMITED", "The per-minute request limit for this plan has been reached.");
    transaction.set(monthlyReference, {
      userId, month, requests: monthlyRequests + 1, updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(keyMonthlyReference, {
      userId,
      apiKeyId,
      month,
      requests: Number(keyMonthlySnapshot.get("requests") ?? 0) + 1,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(rateReference, {
      userId,
      apiKeyId,
      minute,
      requests: minuteRequests + 1,
      expiresAt: Timestamp.fromMillis((minute + 3) * 60_000),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });
}

async function recordUsage(input: {
  principal: ApiPrincipal;
  url: string | null;
  processingTimeMs: number;
  success: boolean;
  statusCode: number;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
  cacheHit?: boolean;
  model?: string;
}) {
  const db = getAdminDb();
  const month = monthKey();
  const aggregateData = {
    userId: input.principal.userId,
    apiKeyId: input.principal.apiKeyId,
    month,
    successfulRequests: FieldValue.increment(input.success ? 1 : 0),
    failedRequests: FieldValue.increment(input.success ? 0 : 1),
    inputTokens: FieldValue.increment(input.inputTokens ?? 0),
    outputTokens: FieldValue.increment(input.outputTokens ?? 0),
    estimatedAiCostUsd: FieldValue.increment(input.estimatedCostUsd ?? 0),
    totalProcessingTimeMs: FieldValue.increment(input.processingTimeMs),
    completedRequests: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  };
  const batch = db.batch();
  batch.set(db.collection("monthlyUsage").doc(`${input.principal.userId}_${month}`), aggregateData, { merge: true });
  batch.set(
    db.collection("monthlyKeyUsage").doc(`${input.principal.userId}_${input.principal.apiKeyId}_${month}`),
    aggregateData,
    { merge: true },
  );
  batch.set(db.collection("usageEvents").doc(), {
    userId: input.principal.userId,
    apiKeyId: input.principal.apiKeyId,
    endpoint: "/api/v1/analyze",
    url: input.url,
    processingTimeMs: input.processingTimeMs,
    success: input.success,
    statusCode: input.statusCode,
    inputTokens: input.inputTokens ?? 0,
    outputTokens: input.outputTokens ?? 0,
    estimatedCostUsd: input.estimatedCostUsd ?? 0,
    cacheHit: input.cacheHit ?? false,
    model: input.model ?? null,
    expiresAt: Timestamp.fromMillis(Date.now() + 180 * 24 * 60 * 60 * 1000),
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  let principal: Awaited<ReturnType<typeof authenticateApiKey>> | undefined;
  let requestedUrl: string | null = null;
  let failureStage = "request_body";
  try {
    const body = await readLimitedJson(request);
    if (typeof body !== "object" || body === null || !("url" in body)) {
      throw new ApiError("INVALID_URL", "Request JSON must include a url field.");
    }
    const url = normalizeUserUrl((body as { url: unknown }).url);
    requestedUrl = url.toString();
    failureStage = "authentication";
    principal = await authenticateApiKey(request);
    failureStage = "request_quota";
    await reserveRequest(principal.userId, principal.apiKeyId, principal.plan);

    failureStage = "firebase_cache_read";
    const db = getAdminDb();
    const cacheId = createHash("sha256").update(url.toString()).digest("hex");
    const cacheRef = db.collection("analysisCache").doc(cacheId);
    const cacheSnapshot = await cacheRef.get();
    const cacheHit = cacheSnapshot.exists && Number(cacheSnapshot.get("expiresAtMs") ?? 0) > Date.now();
    let result: Record<string, unknown>;
    let analysisMeta: Record<string, unknown>;

    if (cacheHit) {
      result = { ...(cacheSnapshot.get("result") as Record<string, unknown>) };
      const cachedUsage = result.usage;
      if (cachedUsage && typeof cachedUsage === "object" && !Array.isArray(cachedUsage)) {
        result.usage = {
          ...(cachedUsage as Record<string, unknown>),
          input_tokens: 0,
          output_tokens: 0,
          estimated_ai_cost_usd: 0,
        };
      }
      analysisMeta = {
        ...(cacheSnapshot.get("analysisMeta") as Record<string, unknown>),
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        estimated_cost_usd: 0,
        cache_hit: true,
      };
    } else {
      failureStage = "website_and_gemini_analysis";
      const analysis = await analyzeWebsite(url);
      const canonicalUrl = analysis.result.request.canonical_url || url.toString();
      analysis.result.request = {
        ...analysis.result.request,
        input_url: url.toString(),
        canonical_url: canonicalUrl,
        domain: analysis.result.request.domain || new URL(canonicalUrl).hostname,
        pages_analyzed: analysis.pagesAnalyzed,
      };
      result = analysis.result as unknown as Record<string, unknown>;
      analysisMeta = {
        model: analysis.model,
        pages_analyzed: analysis.pagesAnalyzed,
        input_tokens: analysis.inputTokens,
        output_tokens: analysis.outputTokens,
        total_tokens: analysis.totalTokens,
        estimated_cost_usd: analysis.estimatedCostUsd,
        cache_hit: false,
      };
      failureStage = "firebase_cache_write";
      await cacheRef.set({
        url: url.toString(), result, analysisMeta,
        expiresAtMs: Date.now() + appConfig.analysis.cacheTtlSeconds * 1000,
        expiresAt: Timestamp.fromMillis(Date.now() + appConfig.analysis.cacheTtlSeconds * 1000),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const id = randomUUID();
    const analysisRecord = { ...result, id, url: url.toString(), analyzed_at: new Date().toISOString(), analysis_meta: analysisMeta };
    failureStage = "firebase_analysis_write";
    await db.collection("analyses").doc(id).set({
      ...analysisRecord, userId: principal.userId, apiKeyId: principal.apiKeyId, createdAt: FieldValue.serverTimestamp(),
    });
    failureStage = "usage_record";
    await recordUsage({
      principal,
      url: url.toString(),
      processingTimeMs: Date.now() - startedAt,
      success: true,
      statusCode: 200,
      inputTokens: Number(analysisMeta.input_tokens ?? 0),
      outputTokens: Number(analysisMeta.output_tokens ?? 0),
      estimatedCostUsd: Number(analysisMeta.estimated_cost_usd ?? 0),
      cacheHit,
      model: typeof analysisMeta.model === "string" ? analysisMeta.model : undefined,
    });
    failureStage = "response";
    return Response.json(analysisRecord);
  } catch (error) {
    const requestDomain = requestedUrl ? new URL(requestedUrl).hostname : null;
    if (principal) {
      try {
        await recordUsage({
          principal,
          url: requestedUrl,
          processingTimeMs: Date.now() - startedAt,
          success: false,
          statusCode: error instanceof ApiError ? error.status : 500,
        });
      } catch {
        console.error("Unable to record failed API usage", {
          endpoint: "/api/v1/analyze",
          failureStage,
          requestDomain,
        });
      }
    }
    return errorResponse(error, {
      endpoint: "/api/v1/analyze",
      failureStage,
      requestDomain,
      elapsedMs: Date.now() - startedAt,
    });
  }
}