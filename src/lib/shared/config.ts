export const appConfig = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  apiUrl: process.env.API_URL ?? "http://localhost:3000",
  gemini: {
    model: process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite",
    inputUsdPerMillionTokens: Number(process.env.GEMINI_INPUT_USD_PER_MILLION ?? "0.30"),
    outputUsdPerMillionTokens: Number(process.env.GEMINI_OUTPUT_USD_PER_MILLION ?? "2.50"),
    timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS ?? "90000"),
  },
  analysis: {
    maxPages: Number(process.env.MAX_PAGES_PER_ANALYSIS ?? "6"),
    maxPageBytes: Number(process.env.MAX_PAGE_BYTES ?? "1000000"),
    maxTotalBytes: Number(process.env.MAX_TOTAL_BYTES ?? "3000000"),
    fetchTimeoutMs: Number(process.env.FETCH_TIMEOUT_MS ?? "25000"),
    totalTimeoutMs: Number(process.env.ANALYSIS_TIMEOUT_MS ?? "180000"),
    maxRedirects: Number(process.env.MAX_REDIRECTS ?? "3"),
    cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? "86400"),
  },
} as const;

export const plans = {
  free: { monthlyRequests: 100, requestsPerMinute: 5 },
  starter: { monthlyRequests: 2_000, requestsPerMinute: 30 },
  pro: { monthlyRequests: 20_000, requestsPerMinute: 120 },
  business: { monthlyRequests: 100_000, requestsPerMinute: 300 },
  enterprise: { monthlyRequests: Number.MAX_SAFE_INTEGER, requestsPerMinute: 600 },
} as const;

export type PlanId = keyof typeof plans;

export function estimateGeminiCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * appConfig.gemini.inputUsdPerMillionTokens;
  const outputCost = (outputTokens / 1_000_000) * appConfig.gemini.outputUsdPerMillionTokens;
  return Number((inputCost + outputCost).toFixed(8));
}