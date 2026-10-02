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
  it("accepts the newer contract with schema_version and statusful truth values", () => {
    const payload = {
      schema_version: "1.0",
      request: {
        input_url: sourceUrl,
        canonical_url: sourceUrl,
        domain: "example.com",
        analyzed_at: "2026-10-02T00:00:00.000Z",
        pages_analyzed: 1,
        analysis_duration_ms: 1200,
      },
      identity: {
        company_name: { value: "Example Studio", status: "FACT", confidence: 0.95, evidence_ids: ["ev_001"] },
        legal_name: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        description: { value: "Design agency", status: "FACT", confidence: 0.92, evidence_ids: ["ev_001"] },
        industry: { value: "Design", status: "FACT", confidence: 0.95, evidence_ids: ["ev_001"] },
        business_model: { value: "B2B services", status: "INFERENCE", confidence: 0.78, evidence_ids: ["ev_001"] },
        business_type: { value: "agency", status: "FACT", confidence: 0.9, evidence_ids: ["ev_001"] },
      },
      commercial: {
        has_pricing: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        pricing_model: [],
        price_range: null,
        has_free_trial: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        has_demo: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        has_subscription: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        has_online_purchase: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
      },
      conversion_signals: {
        has_contact_form: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        has_sales_cta: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        has_demo_cta: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        has_signup: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        has_login: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        has_newsletter: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        has_booking: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        has_quote_request: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        has_downloadable_material: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
      },
      digital_capabilities: {
        ecommerce: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        online_payment: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        customer_portal: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        account_creation: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        booking_system: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        search: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        api: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        documentation: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        developer_platform: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        mobile_app: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        integrations: [],
        technologies_detected: [],
      },
      qualification: {
        b2b: true,
        b2c: null,
        b2b2c: null,
      },
      company: {
        company_name: "Example Studio",
        legal_name: null,
        description: "Design agency",
        industry: "Design",
        sub_industry: null,
        business_type: "agency",
        country: null,
        city: null,
        address: null,
        postal_code: null,
        languages: ["en"],
        target_market: null,
        customer_type: "B2B",
      },
      contact: { email: null, phone: null, whatsapp: null, contact_page: sourceUrl, contact_form: null },
      services: [],
      products: { items: [], categories: [], pricing_detected: null, ecommerce_detected: null },
      social_media: { linkedin: null, facebook: null, instagram: null, youtube: null, tiktok: null, x: null, other_social_links: [] },
      website_capabilities: { online_booking: null, appointment_system: null, ecommerce: null, online_payment: null, contact_form: null, whatsapp: null, live_chat: null, newsletter: null, customer_login: null, multilingual_support: null, ssl: true, mobile_friendly: null, search: null, blog: null, pricing_page: null },
      qualification_signals: [{ signal: "appears_b2b", value: true, confidence: 0.92, evidence: [{ url: sourceUrl, reason: "The site sells enterprise design services." }] }],
      evidence: [{ field: "identity.company_name", kind: "fact", url: sourceUrl, excerpt: "Example Studio", confidence: 0.95 }],
      confidence_by_field: { "company.company_name": 0.95 },
      signals: [{ id: "sig_001", type: "b2b", value: true, status: "FACT", confidence: 0.9, evidence_ids: ["ev_001"] }],
      unknowns: [{ field: "commercial.price_range", reason: "No pricing was found." }],
      analysis_quality: { overall_confidence: 0.9, coverage_score: 0.7, evidence_coverage: 0.8, pages_successfully_read: 1, pages_failed: 0, warnings: [] },
      usage: { model: "gemini-3.1-flash-lite", input_tokens: 100, output_tokens: 50, estimated_ai_cost_usd: 0.01 },
    };
    const result = validateBusinessAnalysis(payload, new Map([[sourceUrl, "Example Studio offers enterprise design services."] ]));
    expect(result.company.company_name).toBe("Example Studio");
    expect(result.schema_version).toBe("1.0");
    expect(result.request.input_url).toBe(sourceUrl);
    expect(result.identity.company_name.value).toBe("Example Studio");
    expect(result.qualification.b2b).toBe(true);
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