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

export interface SafeHtmlResponse {
  url: string;
  html: string;
  bytes: number;
  contentType: string;
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

async function resolvePublicHost(hostname: string): Promise<ResolvedAddress[]> {
  const unwrapped = hostname.replace(/^\[|\]$/g, "");
  const literalFamily = isIP(unwrapped);
  const addresses = literalFamily
    ? [{ address: unwrapped, family: literalFamily }]
    : await lookup(unwrapped, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new ApiError("UNSAFE_URL", "The website resolves to a non-public network address.");
  }
  return addresses.map(({ address, family }) => ({ address, family: family as 4 | 6 }));
}

function requestPinned(url: URL, address: ResolvedAddress, maxBytes: number, timeoutMs: number, signal?: AbortSignal): Promise<{
  status: number;
  headers: IncomingHttpHeaders;
  body: Buffer;
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
      "user-agent": "BusinessQualificationBot/1.0 (+https://example.invalid/bot)",
      accept: "text/html,application/xhtml+xml;q=0.9",
      "accept-encoding": "identity",
    },
    lookup: ((_host, _options, callback) => callback(null, address.address, address.family)) as NonNullable<RequestOptions["lookup"]>,
  };

  return new Promise((resolve, reject) => {
    const request = requestFunction(options, (response) => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > maxBytes) {
          request.destroy(new ApiError("SITE_BLOCKED", "The website page exceeds the allowed response size."));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => resolve({
        status: response.statusCode ?? 0,
        headers: response.headers,
        body: Buffer.concat(chunks),
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

export async function fetchSafeHtml(
  input: URL | string,
  maxBytes = appConfig.analysis.maxPageBytes,
  timeoutMs = appConfig.analysis.fetchTimeoutMs,
  signal?: AbortSignal,
): Promise<SafeHtmlResponse> {
  let url = normalizeUserUrl(input.toString());
  let downloadedBytes = 0;
  for (let redirectCount = 0; redirectCount <= appConfig.analysis.maxRedirects; redirectCount += 1) {
    if (signal?.aborted) throw new ApiError("TIMEOUT", "The analysis deadline was reached.");
    const remainingBytes = maxBytes - downloadedBytes;
    if (remainingBytes <= 0) throw new ApiError("SITE_BLOCKED", "The website exceeded the allowed analysis response size.");
    const addresses = await resolvePublicHost(url.hostname);
    if (signal?.aborted) throw new ApiError("TIMEOUT", "The analysis deadline was reached.");
    const address = addresses.find((entry) => entry.family === 4) ?? addresses[0];
    let response: Awaited<ReturnType<typeof requestPinned>>;
    try {
      response = await requestPinned(url, address, remainingBytes, timeoutMs, signal);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("FETCH_FAILED", "The website could not be fetched.");
    }
    downloadedBytes += response.body.length;
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.location;
      if (!location || redirectCount === appConfig.analysis.maxRedirects) throw new ApiError("FETCH_FAILED", "The redirect limit was reached.");
      url = normalizeUserUrl(new URL(location, url).toString());
      continue;
    }
    if ([401, 403, 429].includes(response.status)) throw new ApiError("SITE_BLOCKED", "The website blocked automated access.");
    if (response.status < 200 || response.status >= 300) throw new ApiError("FETCH_FAILED", `The website returned HTTP ${response.status}.`);

    const contentType = String(response.headers["content-type"] ?? "").toLowerCase();
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new ApiError("SITE_BLOCKED", "The URL did not return an HTML page.");
    }
    return { url: url.toString(), html: response.body.toString("utf8"), bytes: downloadedBytes, contentType };
  }
  throw new ApiError("FETCH_FAILED", "The redirect limit was reached.");
}