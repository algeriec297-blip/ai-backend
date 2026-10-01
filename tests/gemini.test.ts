import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeWithGemini } from "@/lib/server/gemini";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("analyzeWithGemini", () => {
  it("reports safe provider status details without logging response text or secrets", async () => {
    const apiKey = "test-gemini-key-must-not-be-logged";
    vi.stubEnv("GEMINI_API_KEY", apiKey);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 400, status: "INVALID_ARGUMENT", message: "private provider response" },
    }), {
      status: 400,
      headers: { "content-type": "application/json", "x-goog-request-id": "request-id-123" },
    })));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(analyzeWithGemini([])).rejects.toMatchObject({
      code: "ANALYSIS_FAILED",
      message: "Gemini returned an unsuccessful response (HTTP 400, INVALID_ARGUMENT, provider code 400).",
    });
    expect(errorLog).toHaveBeenCalledWith("Gemini request returned non-success", {
      model: "gemini-2.5-flash",
      httpStatus: 400,
      providerStatus: "INVALID_ARGUMENT",
      providerCode: 400,
      requestId: "request-id-123",
    });
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain(apiKey);
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain("private provider response");
  });
});