import { describe, expect, it } from "vitest";
import { discoverPages, extractPage } from "@/lib/server/business-analysis";

describe("extractPage", () => {
  it("captures observable website capabilities and source text", () => {
    const html = `<!doctype html><html><head><title>Sample company</title>
      <meta name="description" content="A sample service business">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>@media (max-width: 640px) { .layout { display: block; } }</style>
      </head><body><nav><a href="/booking">Book an appointment</a>
      <a href="https://wa.me/15550001111">WhatsApp</a></nav>
      <form action="/contact"><input name="email"><button>Send a message</button></form>
      <p>We provide accounting services to small businesses.</p></body></html>`;
    const page = extractPage(html, "https://example.com/");
    expect(page.title).toBe("Sample company");
    expect(page.observations.viewport_meta_detected).toBe(true);
    expect(page.observations.responsive_css_detected).toBe(true);
    expect(page.observations.form_detected).toBe(true);
    expect(page.observations.booking_link_detected).toBe(true);
    expect(page.observations.whatsapp_link_detected).toBe(true);
    expect(page.text).toContain("Send a message");
  });
});

describe("discoverPages", () => {
  it("selects useful same-host pages and excludes external hosts", () => {
    const html = `<a href="/about">About us</a><a href="/services">Services</a>
      <a href="/contact">Contact</a><a href="https://other.example/pricing">Pricing</a>
      <a href="/random">Read more</a>`;
    const pages = discoverPages(html, "https://example.com/");
    expect(pages).toContain("https://example.com/about");
    expect(pages).toContain("https://example.com/contact");
    expect(pages.some((url) => url.includes("other.example"))).toBe(false);
    expect(pages.some((url) => url.endsWith("/random"))).toBe(false);
  });
});