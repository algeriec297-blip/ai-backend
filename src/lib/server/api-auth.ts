import { createHash } from "node:crypto";
import type { PlanId } from "@/lib/shared/config";
import { ApiError, safeErrorDetails } from "@/lib/shared/errors";
import { getAdminDb } from "@/lib/server/firebase-admin";

export interface ApiPrincipal {
  userId: string;
  apiKeyId: string;
  plan: PlanId;
}

export async function authenticateApiKey(request: Request): Promise<ApiPrincipal> {
  const authorization = request.headers.get("authorization");
  const apiKey = authorization?.match(/^Bearer\s+(bqa_(?:live|test)_[A-Za-z0-9_-]{32,})$/)?.[1];
  if (!apiKey) throw new ApiError("UNAUTHORIZED", "A valid API key is required.");

  const keyHash = createHash("sha256").update(apiKey).digest("hex");
  let keys;
  try {
    const db = getAdminDb();
    keys = await db.collection("apiKeys").where("keyHash", "==", keyHash).limit(1).get();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("API key lookup failed", safeErrorDetails(error));
    throw new ApiError("DEPENDENCY_UNAVAILABLE", "The API key store is temporarily unavailable. Please try again.");
  }
  const key = keys.docs[0];
  if (!key || key.get("revokedAt")) throw new ApiError("UNAUTHORIZED", "The API key is invalid or revoked.");

  const plan = key.get("plan");
  const validPlans: PlanId[] = ["free", "starter", "pro", "business", "enterprise"];
  return {
    userId: String(key.get("userId")),
    apiKeyId: key.id,
    plan: validPlans.includes(plan) ? plan : "free",
  };
}