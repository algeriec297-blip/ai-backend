import { describe, expect, it, vi } from "vitest";
import { createPinnedLookup, isPublicAddress, normalizeUserUrl } from "@/lib/server/url-safety";
import { ApiError } from "@/lib/shared/errors";

describe("normalizeUserUrl", () => {
  it("adds HTTPS to a bare hostname and removes fragments", () => {
    expect(normalizeUserUrl("example.com/about#team").toString()).toBe("https://example.com/about");
  });

  it.each([
    "http://localhost",
    "http://127.0.0.1",
    "http://[::1]",
    "http://service.local",
    "http://service.internal",
    "ftp://example.com",
    "https://user:password@example.com",
    "https://example.com:8443",
  ])("rejects unsafe address %s", (input) => {
    expect(() => normalizeUserUrl(input)).toThrow(ApiError);
  });

  it("rejects non-string and excessively long inputs", () => {
    expect(() => normalizeUserUrl(null)).toThrow(ApiError);
    expect(() => normalizeUserUrl(`https://${"a".repeat(2050)}.com`)).toThrow(ApiError);
  });
});

describe("public network address policy", () => {
  it.each([
    "0.0.0.0",
    "10.1.2.3",
    "127.0.0.1",
    "169.254.10.20",
    "172.20.1.2",
    "192.168.1.1",
    "::1",
    "fc00::1",
    "fe80::1",
    "2001:db8::1",
  ])("blocks %s", (address) => expect(isPublicAddress(address)).toBe(false));

  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])(
    "allows public address %s",
    (address) => expect(isPublicAddress(address)).toBe(true),
  );
});

describe("createPinnedLookup", () => {
  it("returns a public pinned address for both Node lookup callback shapes", () => {
    const address = { address: "93.184.216.34", family: 4 as const };
    const lookup = createPinnedLookup(address);
    const allCallback = vi.fn();
    const singleCallback = vi.fn();

    lookup("example.com", { all: true }, allCallback);
    lookup("example.com", { all: false }, singleCallback);

    expect(allCallback).toHaveBeenCalledWith(null, [address]);
    expect(singleCallback).toHaveBeenCalledWith(null, address.address, address.family);
  });
});