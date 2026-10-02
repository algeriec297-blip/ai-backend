import { describe, expect, it } from "vitest";
import { validateBusinessAnalysis } from "@/lib/shared/analysis-schema";

const sourceUrl = "https://example.com/contact";

function validPayload() {
  return {
    company: {
      company_name: "Example Studio", legal_name: null, description: null, industry: "Design",
      sub_industry: null, business_type: null, country: null, city: null, address: null,
      postal_code: null, languages: ["en"], target_market: null, customer_type: "B2B",
    },
    contact: { email: null, phone: null, whatsapp: null, contact_page: sourceUrl, contact_form: null },
    services: [],
    products: { items: [], categories: [], pricing_detected: null, ecommerce_detected: null },
    social_media: { linkedin: null, facebook: null, instagram: null, youtube: null, tiktok: null, x: null, other_social_links: [] },
    website_capabilities: {
      online_booking: null, appointment_system: null, ecommerce: null, online_payment: null,
      contact_form: null, whatsapp: null, live_chat: null, newsletter: null, customer_login: null,
      multilingual_support: null, ssl: true, mobile_friendly: null, search: null, blog: null, pricing_page: null,
    },
    qualification_signals: [{
      signal: "has_physical_location", value: true, confidence: 0.9,
      evidence: [{ url: sourceUrl, reason: "A street address is listed on the contact page." }],
    }],
    evidence: [{ field: "contact.address", kind: "fact", url: sourceUrl, excerpt: "100 Example Street", confidence: 0.95 }],
    confidence_by_field: { "company.company_name": 0.95 },
  };
}

describe("validateBusinessAnalysis", () => {
  it("accepts validated data and preserves unknown values", () => {
    const result = validateBusinessAnalysis(validPayload(), new Map([[sourceUrl, "Contact us at 100 Example Street for details."]]));
    expect(result.company.company_name).toBe("Example Studio");
    expect(result.website_capabilities.online_booking).toBeNull();
    expect(result.evidence[0].kind).toBe("fact");
  });

  it("rejects evidence from pages that were not fetched", () => {
    const payload = validPayload();
    payload.evidence[0].url = "https://other.example/";
    expect(() => validateBusinessAnalysis(payload, new Map([[sourceUrl, "100 Example Street"]]))).toThrow(/unfetched page/);
  });

  it("rejects confidence values outside the 0-to-1 range", () => {
    const payload = validPayload();
    payload.qualification_signals[0].confidence = 1.5;
    expect(() => validateBusinessAnalysis(payload, new Map([[sourceUrl, "100 Example Street"]]))).toThrow(/confidence/);
  });

  it("rejects invented evidence excerpts", () => {
    const payload = validPayload();
    payload.evidence[0].excerpt = "This phrase is not on the page.";
    expect(() => validateBusinessAnalysis(payload, new Map([[sourceUrl, "100 Example Street"]]))).toThrow(/does not appear/);
  });

  it("accepts verbatim evidence when only punctuation, whitespace, or Unicode form differs", () => {
    const payload = validPayload();
    payload.evidence[0].excerpt = "100 — Example   Street!";
    const result = validateBusinessAnalysis(
      payload,
      new Map([[sourceUrl, "Contact us at 100 Example Street for details."]]),
    );
    expect(result.evidence[0].excerpt).toBe("100 — Example   Street!");
  });
});