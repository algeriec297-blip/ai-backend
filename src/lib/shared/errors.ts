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
    Object.defineProperty(this, "message", {
      value: message,
      enumerable: true,
      configurable: true,
      writable: true,
    });
    this.name = "ApiError";
    this.status = status;
  }
}

export function safeErrorDetails(error: unknown): {
  errorType: string;
  errorMessage: string;
  errorCode: string | null;
  httpStatus: number | null;
  causeType: string | null;
  causeCode: string | null;
} {
  const errorRecord = typeof error === "object" && error !== null
    ? error as { name?: unknown; message?: unknown; code?: unknown; status?: unknown; statusCode?: unknown; cause?: unknown }
    : {};
  const causeRecord = typeof errorRecord.cause === "object" && errorRecord.cause !== null
    ? errorRecord.cause as { name?: unknown; code?: unknown }
    : {};
  let errorMessage = typeof errorRecord.message === "string" ? errorRecord.message : String(error);
  for (const [name, value] of Object.entries(process.env)) {
    if (/(?:KEY|TOKEN|SECRET|PASSWORD|PRIVATE|CREDENTIAL)/i.test(name) && value && value.length >= 4) {
      errorMessage = errorMessage.replaceAll(value, "[REDACTED]");
    }
  }
  errorMessage = errorMessage
    .replace(/https?:\/\/[^\s"'<>]+/gi, "[URL]")
    .replace(/(authorization|api[_-]?key|token|password)(\s*[:=]\s*)[^\s,;]+/gi, "$1$2[REDACTED]")
    .slice(0, 300);
  const safeCode = (value: unknown) =>
    typeof value === "string" && /^[A-Za-z0-9_.:-]{1,100}$/.test(value) ? value : null;
  const status = errorRecord.status ?? errorRecord.statusCode;

  return {
    errorType: typeof errorRecord.name === "string" ? errorRecord.name : typeof error,
    errorMessage,
    errorCode: safeCode(errorRecord.code),
    httpStatus: typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599 ? status : null,
    causeType: typeof causeRecord.name === "string" ? causeRecord.name : null,
    causeCode: safeCode(causeRecord.code),
  };
}

export function errorResponse(error: unknown): Response {
  const apiError = error instanceof ApiError
    ? error
    : new ApiError("INTERNAL_ERROR", "An unexpected error occurred.");

  if (apiError.status >= 500) {
    console.error("API request failed", error instanceof ApiError
      ? { code: apiError.code }
      : { code: apiError.code, ...safeErrorDetails(error) });
  }
  return Response.json({ error: { code: apiError.code, message: apiError.message } }, { status: apiError.status });
}