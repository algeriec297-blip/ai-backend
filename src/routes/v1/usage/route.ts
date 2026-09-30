import { authenticateApiKey } from "@/lib/server/api-auth";
import { plans } from "@/lib/shared/config";
import { errorResponse } from "@/lib/shared/errors";
import { getAdminDb } from "@/lib/server/firebase-admin";

export async function GET(request: Request) {
  try {
    const principal = await authenticateApiKey(request);
    const month = new Date().toISOString().slice(0, 7);
    const db = getAdminDb();
    const [usage, keyUsage] = await Promise.all([
      db.collection("monthlyUsage").doc(`${principal.userId}_${month}`).get(),
      db.collection("monthlyKeyUsage").doc(`${principal.userId}_${principal.apiKeyId}_${month}`).get(),
    ]);
    const requests = Number(usage.get("requests") ?? 0);
    const completedRequests = Number(usage.get("completedRequests") ?? 0);
    const monthlyLimit = plans[principal.plan].monthlyRequests;
    return Response.json({
      plan: principal.plan,
      month,
      requests,
      api_key_requests: Number(keyUsage.get("requests") ?? 0),
      monthly_limit: monthlyLimit,
      requests_per_minute_limit: plans[principal.plan].requestsPerMinute,
      remaining_requests: Math.max(0, monthlyLimit - requests),
      estimated_ai_cost_usd: Number(Number(usage.get("estimatedAiCostUsd") ?? 0).toFixed(6)),
      api_key_estimated_ai_cost_usd: Number(Number(keyUsage.get("estimatedAiCostUsd") ?? 0).toFixed(6)),
      input_tokens: Number(usage.get("inputTokens") ?? 0),
      output_tokens: Number(usage.get("outputTokens") ?? 0),
      successful_requests: Number(usage.get("successfulRequests") ?? 0),
      failed_requests: Number(usage.get("failedRequests") ?? 0),
      average_processing_time_ms: completedRequests
        ? Math.round(Number(usage.get("totalProcessingTimeMs") ?? 0) / completedRequests)
        : 0,
      window_note: "Usage, token, and cost totals are incrementally aggregated for the current month.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}