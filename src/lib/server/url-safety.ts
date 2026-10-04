import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpRequest, type IncomingHttpHeaders, type RequestOptions } from "node:http";
import { request as httpsRequest } from "node:https";
import { appConfig } from "@/lib/shared/config";
import { ApiError } from "@/lib/shared/errors";

interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

interface LookupResultAddress {
  address: string;
  family: number;
}

export interface SafeHtmlResponse {
  url: string;
  html: string;
  bytes: number;
  contentType: string;
  truncated: boolean;
}

function isPublicIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [first, second] = parts;
  if (first === 0 || first === 10 || first === 127 || first >= 224) return false;
  if (first === 100 && second >= 64 && second <= 127) return false;
  if (first === 169 && second === 254) return false;
  if (first === 172 && second >= 16 && second <= 31) return false;
  if (first === 192 && second === 0) return false;
  if (first === 192 && second === 168) return false;
  if (first === 192 && second === 88) return false;
  if (first === 198 && (second === 18 || second === 19 || second === 51)) return false;
  if (first === 203 && second === 0) return false;
  return true;
}

function isPublicIpv6(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0];
  const firstGroup = Number.parseInt(normalized.split(":")[0] || "0", 16);
  if (firstGroup < 0x2000 || firstGroup > 0x3fff) return false;
  if (normalized.startsWith("2001:db8:") || normalized.startsWith("2001:0db8:")) return false;
  if (normalized.startsWith("2001:0000:") || normalized.startsWith("2002:")) return false;
  return true;
}

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isPublicIpv4(address);
  if (family === 6) return isPublicIpv6(address);
  return false;
}

function safeNetworkError(error: unknown) {
  const source = error && typeof error === "object" ? error as {
    name?: unknown;
    code?: unknown;
    syscall?: unknown;
    cause?: unknown;
  } : {};
  const cause = source.cause && typeof source.cause === "object"
    ? source.cause as { code?: unknown; syscall?: unknown }
    : {};
  return {
    name: typeof source.name === "string" ? source.name.slice(0, 80) : "UnknownError",
    code: typeof source.code === "string" ? source.code.slice(0, 80) : undefined,
    syscall: typeof source.syscall === "string" ? source.syscall.slice(0, 80) : undefined,
    causeCode: typeof cause.code === "string" ? cause.code.slice(0, 80) : undefined,
    causeSyscall: typeof cause.syscall === "string" ? cause.syscall.slice(0, 80) : undefined,
  };
}

function networkErrorCode(error: unknown): string | undefined {
  const source = error && typeof error === "object" ? error as {
    code?: unknown;
    cause?: unknown;
  } : {};
  const cause = source.cause && typeof source.cause === "object"
    ? source.cause as { code?: unknown }
    : {};
  const code = typeof source.code === "string" ? source.code
    : typeof cause.code === "string" ? cause.code
      : undefined;
  return code?.slice(0, 80);
}

function isRetryableNetworkError(error: unknown): boolean {
  return new Set([
    "EAI_AGAIN",
    "ECONNABORTED",
    "ECONNREFUSED",
    "ECONNRESET",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "EPIPE",
    "ETIMEDOUT",
  ]).has(networkErrorCode(error) ?? "");
}

function fetchFailureMessage(stage: "dns" | "request", error: unknown): string {
  const code = networkErrorCode(error);
  if (stage === "dns") {
    return code ? `The website DNS lookup failed (${code}).` : "The website DNS lookup failed.";
  }
  return code ? `The website connection failed (${code}).` : "The website connection failed.";
}

function logFetchFailure(stage: string, url: URL, error: unknown, details: Record<string, unknown> = {}) {
  console.warn("Website fetch failed", {
    stage,
    host: url.hostname,
    protocol: url.protocol,
    ...details,
    error: safeNetworkError(error),
  });
}

async function lookupWithDeadline(
  hostname: string,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<LookupResultAddress[]> {
  let timer: NodeJS.Timeout | undefined;
  let abortListener: (() => void) | undefined;
  try {
    return await Promise.race([
      lookup(hostname, { all: true, verbatim: true }),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new ApiError("TIMEOUT", "The website DNS lookup exceeded its deadline.")),
          timeoutMs,
        );
        abortListener = () => reject(new ApiError("TIMEOUT", "The analysis deadline was reached."));
        signal?.addEventListener("abort", abortListener, { once: true });
        if (signal?.aborted) abortListener();
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    if (abortListener) signal?.removeEventListener("abort", abortListener);
  }
}

export function normalizeUserUrl(input: unknown): URL {
  if (typeof input !== "string" || input.length > 2048) throw new ApiError("INVALID_URL", "Provide a valid website URL.");
  let url: URL;
  try {
    const trimmed = input.trim();
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new ApiError("INVALID_URL", "Provide a valid website URL.");
  }

  if (!(["http:", "https:"].includes(url.protocol)) || url.username || url.password) {
    throw new ApiError("INVALID_URL", "Only public HTTP and HTTPS website URLs are supported.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new ApiError("UNSAFE_URL", "Only standard HTTP and HTTPS ports are allowed.");
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new ApiError("UNSAFE_URL", "Local and internal hosts cannot be analyzed.");
  }
  if (isIP(hostname) && !isPublicAddress(hostname)) {
    throw new ApiError("UNSAFE_URL", "Private and reserved IP addresses cannot be analyzed.");
  }
  url.hash = "";
  return url;
}

async function resolvePublicHost(hostname: string, timeoutMs: number, signal?: AbortSignal): Promise<ResolvedAddress[]> {
  const unwrapped = hostname.replace(/^\[|\]$/g, "");
  const literalFamily = isIP(unwrapped);
  let addresses: LookupResultAddress[];
  if (literalFamily) {
    addresses = [{ address: unwrapped, family: literalFamily }];
  } else {
    const lookupStartedAt = Date.now();
    try {
      addresses = await lookupWithDeadline(unwrapped, timeoutMs, signal);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (networkErrorCode(error) !== "EAI_AGAIN") throw error;
      const remainingTimeout = timeoutMs - (Date.now() - lookupStartedAt);
      if (remainingTimeout <= 0) throw new ApiError("TIMEOUT", "The website DNS lookup exceeded its deadline.");
      addresses = await lookupWithDeadline(unwrapped, remainingTimeout, signal);
    }
  }
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new ApiError("UNSAFE_URL", "The website resolves to a non-public network address.");
  }
  return addresses.map(({ address, family }) => ({ address, family: family as 4 | 6 }));
}

function requestPinned(url: URL, address: ResolvedAddress, maxBytes: number, timeoutMs: number, signal?: AbortSignal): Promise<{
  status: number;
  headers: IncomingHttpHeaders;
  body: Buffer;
  truncated: boolean;
}> {
  const requestFunction = url.protocol === "https:" ? httpsRequest : httpRequest;
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const options: RequestOptions = {
    protocol: url.protocol,
    hostname,
    port: url.port ? Number(url.port) : undefined,
    path: `${url.pathname}${url.search}`,
    method: "GET",
    headers: {
      "user-agent": "BusinessQualificationBot/1.0 (+https://siteintel.iceiy.com/)",
      accept: "text/html,application/xhtml+xml;q=0.9",
      "accept-encoding": "identity",
    },
    lookup: createPinnedLookup(address),
  };

  return new Promise((resolve, reject) => {
    const request = requestFunction(options, (response) => {
      const status = response.statusCode ?? 0;
      if ([301, 302, 303, 307, 308].includes(status)) {
        response.destroy();
        resolve({ status, headers: response.headers, body: Buffer.alloc(0), truncated: false });
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      let truncated = false;
      response.on("data", (chunk: Buffer) => {
        const remaining = maxBytes - size;
        if (chunk.length > remaining) {
          if (remaining > 0) chunks.push(chunk.subarray(0, remaining));
          size = maxBytes;
          truncated = true;
          response.destroy();
          resolve({ status, headers: response.headers, body: Buffer.concat(chunks), truncated });
        } else {
          size += chunk.length;
          chunks.push(chunk);
        }
      });
      response.on("end", () => resolve({
        status,
        headers: response.headers,
        body: Buffer.concat(chunks),
        truncated,
      }));
      response.on("error", reject);
    });
    request.setTimeout(timeoutMs, () => request.destroy(new ApiError("TIMEOUT", "The website request timed out.")));
    request.on("error", reject);
    const totalTimeout = setTimeout(() => request.destroy(new ApiError("TIMEOUT", "The website exceeded the fetch deadline.")), timeoutMs);
    const abortRequest = () => request.destroy(new ApiError("TIMEOUT", "The analysis deadline was reached."));
    signal?.addEventListener("abort", abortRequest, { once: true });
    if (signal?.aborted) abortRequest();
    request.on("close", () => {
      clearTimeout(totalTimeout);
      signal?.removeEventListener("abort", abortRequest);
    });
    request.end();
  });
}

export function createPinnedLookup(address: ResolvedAddress): NonNullable<RequestOptions["lookup"]> {
  return ((_hostname, options, callback) => {
      if (options.all) callback(null, [address]);
      else callback(null, address.address, address.family);
  }) as NonNullable<RequestOptions["lookup"]>;
}

export async function fetchSafeHtml(
  input: URL | string,
  maxBytes = appConfig.analysis.maxPageBytes,
  timeoutMs = appConfig.analysis.fetchTimeoutMs,
  signal?: AbortSignal,
): Promise<SafeHtmlResponse> {
  let url = normalizeUserUrl(input.toString());
  let downloadedBytes = 0;
  const pageDeadline = Date.now() + timeoutMs;
  for (let redirectCount = 0; redirectCount <= appConfig.analysis.maxRedirects; redirectCount += 1) {
    if (signal?.aborted) throw new ApiError("TIMEOUT", "The analysis deadline was reached.");
    const remainingBytes = maxBytes - downloadedBytes;
    if (remainingBytes <= 0) throw new ApiError("SITE_BLOCKED", "The website exceeded the allowed analysis response size.");
    let addresses: ResolvedAddress[];
    try {
      addresses = await resolvePublicHost(url.hostname, Math.max(1, pageDeadline - Date.now()), signal);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logFetchFailure("dns", url, error);
      throw new ApiError("FETCH_FAILED", fetchFailureMessage("dns", error));
    }
    if (signal?.aborted) throw new ApiError("TIMEOUT", "The analysis deadline was reached.");
    let response: Awaited<ReturnType<typeof requestPinned>> | undefined;
    const preferredAddresses = [
      addresses.find((entry) => entry.family === 4),
      addresses.find((entry) => entry.family === 6),
      ...addresses,
    ].filter((entry): entry is ResolvedAddress => entry !== undefined)
      .filter((entry, index, all) => all.findIndex((candidate) => candidate.address === entry.address) === index);
    const requestAddresses = preferredAddresses.slice(0, 2);
    let lastRequestError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const address = requestAddresses[Math.min(attempt, requestAddresses.length - 1)];
      const remainingTimeout = pageDeadline - Date.now();
      if (remainingTimeout <= 0) {
        throw new ApiError("TIMEOUT", "The website exceeded the fetch deadline.");
      }
      try {
        response = await requestPinned(url, address, remainingBytes, remainingTimeout, signal);
        lastRequestError = undefined;
        break;
      } catch (error) {
        lastRequestError = error;
        logFetchFailure("request", url, error, {
          addressFamily: address.family,
          attempt: attempt + 1,
          timeoutMs: remainingTimeout,
        });
        if (error instanceof ApiError) throw error;
        if (attempt === 1 || !isRetryableNetworkError(error)) break;
      }
    }
    if (lastRequestError !== undefined) {
      throw new ApiError("FETCH_FAILED", fetchFailureMessage("request", lastRequestError));
    }
    if (!response) throw new ApiError("FETCH_FAILED", "The website could not be fetched.");
    downloadedBytes += response.body.length;
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.location;
      if (!location || redirectCount === appConfig.analysis.maxRedirects) {
        console.warn("Website fetch redirect stopped", {
          host: url.hostname,
          protocol: url.protocol,
          status: response.status,
          redirectCount,
        });
        throw new ApiError("FETCH_FAILED", "The redirect limit was reached.");
      }
      url = normalizeUserUrl(new URL(location, url).toString());
      continue;
    }
    if ([401, 403, 429].includes(response.status)) {
      console.warn("Website fetch was rejected", { host: url.hostname, protocol: url.protocol, status: response.status });
      throw new ApiError("SITE_BLOCKED", "The website blocked automated access.");
    }
    if (response.status < 200 || response.status >= 300) {
      console.warn("Website fetch returned an unsuccessful status", { host: url.hostname, protocol: url.protocol, status: response.status });
      throw new ApiError("FETCH_FAILED", `The website returned HTTP ${response.status}.`);
    }

    const contentType = String(response.headers["content-type"] ?? "").toLowerCase();
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new ApiError("SITE_BLOCKED", "The URL did not return an HTML page.");
    }
    return {
      url: url.toString(),
      html: response.body.toString("utf8"),
      bytes: downloadedBytes,
      contentType,
      truncated: response.truncated,
    };
  }
  throw new ApiError("FETCH_FAILED", "The redirect limit was reached.");
}