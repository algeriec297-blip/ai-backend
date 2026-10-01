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
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 400, status: "INVALID_ARGUMENT", message: "private provider response" },
    }), {
      status: 400,
      headers: { "content-type": "application/json", "x-goog-request-id": "request-id-123" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(analyzeWithGemini([])).rejects.toMatchObject({
      code: "ANALYSIS_FAILED",
      message: "Gemini returned an unsuccessful response (HTTP 400, INVALID_ARGUMENT, provider code 400).",
    });
    expect(errorLog).toHaveBeenCalledWith("Gemini request returned non-success", {
      model: "gemini-3.8-flash",
      httpStatus: 400,
      providerStatus: "INVALID_ARGUMENT",
      providerCode: 400,
      requestId: "request-id-123",
    });
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(request.generationConfig.responseSchema).toBeUndefined();
    expect(request.generationConfig.responseJsonSchema.type).toBe("object");
    expect(request.generationConfig.responseJsonSchema.properties.confidence_by_field.additionalProperties)
      .toEqual({ anyOf: [{ type: "number" }, { type: "null" }] });
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain(apiKey);
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain("private provider response");
  });

  it("retries transient 503 responses at most twice and succeeds when Gemini recovers", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { status: "UNAVAILABLE" } }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { status: "UNAVAILABLE" } }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(analyzeWithGemini([])).rejects.toMatchObject({ code: "INVALID_AI_RESPONSE" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-transient 400 responses", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { status: "INVALID_ARGUMENT", code: 400 } }), { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(analyzeWithGemini([])).rejects.toMatchObject({ code: "ANALYSIS_FAILED" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops after four retries when Gemini remains unavailable", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 503, status: "UNAVAILABLE" },
    }), {
      status: 503,
      headers: { "content-type": "application/json", "retry-after": "0.001" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(analyzeWithGemini([])).rejects.toMatchObject({
      code: "ANALYSIS_FAILED",
      message: "Gemini returned an unsuccessful response (HTTP 503, UNAVAILABLE, provider code 503).",
    });
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
});