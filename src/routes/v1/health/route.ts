import { appConfig } from "@/lib/shared/config";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "business-qualification-api",
    timestamp: new Date().toISOString(),
    integrations: {
      gemini_configured: Boolean(process.env.GEMINI_API_KEY),
      firebase_configured: Boolean(
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
        (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        process.env.FIREBASE_USE_APPLICATION_DEFAULT_CREDENTIALS === "true",
      ),
    },
    limits: {
      max_pages_per_analysis: appConfig.analysis.maxPages,
      max_page_bytes: appConfig.analysis.maxPageBytes,
      cache_ttl_seconds: appConfig.analysis.cacheTtlSeconds,
    },
  });
}