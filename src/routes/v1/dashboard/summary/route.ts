import { plans } from "@/lib/shared/config";
import { errorResponse } from "@/lib/shared/errors";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { authenticateDashboardUser } from "@/lib/server/user-auth";

export async function GET(request: Request) {
  try {
    const userId = await authenticateDashboardUser(request);
    const db = getAdminDb();
    const month = new Date().toISOString().slice(0, 7);
    const [profile, monthlyUsage, analyses, analysisCount, keys] = await Promise.all([
      db.collection("users").doc(userId).get(),
      db.collection("monthlyUsage").doc(`${userId}_${month}`).get(),
      db.collection("analyses").where("userId", "==", userId).limit(100).get(),
      db.collection("analyses").where("userId", "==", userId).count().get(),
      db.collection("apiKeys").where("userId", "==", userId).limit(100).get(),
    ]);
    const plan = profile.get("plan") in plans ? profile.get("plan") as keyof typeof plans : "free";
    const requestCount = Number(monthlyUsage.get("requests") ?? 0);
    const completedRequests = Number(monthlyUsage.get("completedRequests") ?? 0);
    const totalProcessingTimeMs = Number(monthlyUsage.get("totalProcessingTimeMs") ?? 0);
    const monthlyLimit = plans[plan].monthlyRequests;
    const recentAnalyses = analyses.docs
      .sort((left, right) => String(right.get("analyzed_at") ?? "").localeCompare(String(left.get("analyzed_at") ?? "")))
      .slice(0, 8)
      .map((document) => {
      const data = document.data();
      return {
        id: document.id,
        url: data.url,
        company_name: data.company?.company_name ?? null,
        industry: data.company?.industry ?? null,
        analyzed_at: data.analyzed_at ?? null,
        qualification_signals: data.qualification_signals ?? [],
      };
      });

    return Response.json({
      plan,
      month,
      total_analyses: analysisCount.data().count,
      requests: requestCount,
      monthly_limit: monthlyLimit,
      requests_per_minute_limit: plans[plan].requestsPerMinute,
      remaining_requests: Math.max(0, monthlyLimit - requestCount),
      successful_requests: Number(monthlyUsage.get("successfulRequests") ?? 0),
      failed_requests: Number(monthlyUsage.get("failedRequests") ?? 0),
      estimated_ai_cost_usd: Number(Number(monthlyUsage.get("estimatedAiCostUsd") ?? 0).toFixed(6)),
      input_tokens: Number(monthlyUsage.get("inputTokens") ?? 0),
      output_tokens: Number(monthlyUsage.get("outputTokens") ?? 0),
      average_processing_time_ms: completedRequests ? Math.round(totalProcessingTimeMs / completedRequests) : 0,
      active_api_keys: keys.docs.filter((document) => !document.get("revokedAt")).length,
      recent_analyses: recentAnalyses,
      window_note: "Usage totals are monthly aggregates; recent analyses are selected from a bounded 100-record account query.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}