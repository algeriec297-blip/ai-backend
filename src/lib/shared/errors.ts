export type ApiErrorCode =
  | "INVALID_URL"
  | "UNSAFE_URL"
  | "FETCH_FAILED"
  | "TIMEOUT"
  | "SITE_BLOCKED"
  | "ANALYSIS_FAILED"
  | "INVALID_AI_RESPONSE"
  | "RATE_LIMITED"
  | "QUOTA_EXCEEDED"
  | "UNAUTHORIZED"
  | "FIREBASE_NOT_CONFIGURED"
  | "INTERNAL_ERROR";

const statusByCode: Record<ApiErrorCode, number> = {
  INVALID_URL: 400,
  UNSAFE_URL: 400,
  FETCH_FAILED: 502,
  TIMEOUT: 504,
  SITE_BLOCKED: 422,
  ANALYSIS_FAILED: 502,
  INVALID_AI_RESPONSE: 502,
  RATE_LIMITED: 429,
  QUOTA_EXCEEDED: 429,
  UNAUTHORIZED: 401,
  FIREBASE_NOT_CONFIGURED: 503,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  readonly status: number;

  constructor(readonly code: ApiErrorCode, message: string, status = statusByCode[code]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function errorResponse(error: unknown): Response {
  const apiError = error instanceof ApiError
    ? error
    : new ApiError("INTERNAL_ERROR", "An unexpected error occurred.");

  if (apiError.status >= 500) console.error("API request failed", { code: apiError.code });
  return Response.json({ error: { code: apiError.code, message: apiError.message } }, { status: apiError.status });
}