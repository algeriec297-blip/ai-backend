export type EvidenceKind = "fact" | "inference";
export type AnalysisStatus = "FACT" | "INFERENCE" | "UNKNOWN";

export interface Evidence {
  field: string;
  kind: EvidenceKind;
  url: string;
  excerpt: string;
  confidence: number | null;
  id?: string;
  status?: AnalysisStatus;
  quote?: string;
  source_url?: string;
  source_page_type?: string;
  reason?: string;
}

export interface QualificationSignal {
  signal: string;
  value: boolean | null;
  confidence: number | null;
  evidence: Array<{ url: string; reason: string }>;
}

export interface StatusField<T = unknown> {
  value: T;
  status: AnalysisStatus;
  confidence: number;
  evidence_ids: string[];
}

export interface BusinessAnalysis {
  schema_version?: string;
  request: {
    input_url: string;
    canonical_url: string;
    domain: string;
    analyzed_at: string;
    pages_analyzed: number;
    analysis_duration_ms: number;
  };
  identity: {
    company_name: StatusField<string | null>;
    legal_name: StatusField<string | null>;
    description: StatusField<string | null>;
    industry: StatusField<string | null>;
    business_model: StatusField<string | null>;
    business_type: StatusField<string | null>;
  };
  market: {
    customer_segments: string[];
    target_audience: string[];
    geographic_markets: string[];
    languages: string[];
    industries_served: string[];
    company_size_focus: string[];
  };
  offerings: {
    services: Array<{ name: string; description: string | null; status: AnalysisStatus; confidence: number; evidence_ids: string[] }>;
    products: Array<{ name: string; description: string | null; status: AnalysisStatus; confidence: number; evidence_ids: string[] }>;
    solutions: string[];
    categories: string[];
    primary_offerings: string[];
  };
  commercial: {
    has_pricing: StatusField<boolean | null>;
    pricing_model: string[];
    price_range: string | null;
    has_free_trial: StatusField<boolean | null>;
    has_demo: StatusField<boolean | null>;
    has_subscription: StatusField<boolean | null>;
    has_online_purchase: StatusField<boolean | null>;
  };
  conversion_signals: {
    has_contact_form: StatusField<boolean | null>;
    has_sales_cta: StatusField<boolean | null>;
    has_demo_cta: StatusField<boolean | null>;
    has_signup: StatusField<boolean | null>;
    has_login: StatusField<boolean | null>;
    has_newsletter: StatusField<boolean | null>;
    has_booking: StatusField<boolean | null>;
    has_quote_request: StatusField<boolean | null>;
    has_downloadable_material: StatusField<boolean | null>;
  };
  digital_capabilities: {
    ecommerce: StatusField<boolean | null>;
    online_payment: StatusField<boolean | null>;
    customer_portal: StatusField<boolean | null>;
    account_creation: StatusField<boolean | null>;
    booking_system: StatusField<boolean | null>;
    search: StatusField<boolean | null>;
    api: StatusField<boolean | null>;
    documentation: StatusField<boolean | null>;
    developer_platform: StatusField<boolean | null>;
    mobile_app: StatusField<boolean | null>;
    integrations: string[];
    technologies_detected: string[];
  };
  contact: {
    emails: string[];
    phones: string[];
    addresses: string[];
    contact_urls: string[];
    sales_urls: string[];
    support_urls: string[];
  };
  social: {
    linkedin: string | null;
    facebook: string | null;
    instagram: string | null;
    x: string | null;
    youtube: string | null;
    github: string | null;
    other: string[];
  };
  qualification: {
    b2b: boolean | null;
    b2c: boolean | null;
    b2b2c: boolean | null;
    enterprise_focus: boolean | null;
    smb_focus: boolean | null;
    lead_capture: boolean | null;
    sales_led: boolean | null;
    self_service: boolean | null;
    recurring_revenue_signal: boolean | null;
    transactional_revenue_signal: boolean | null;
    business_maturity: string | null;
  };
  signals: Array<{ id: string; type: string; value: boolean | null; status: AnalysisStatus; confidence: number; evidence_ids: string[] }>;
  evidence: Array<{
    id?: string;
    field: string;
    status?: AnalysisStatus;
    confidence: number | null;
    quote?: string;
    source_url?: string;
    source_page_type?: string;
    reason?: string;
    kind?: EvidenceKind;
    url?: string;
    excerpt?: string;
  }>;
  unknowns: Array<{ field: string; reason: string }>;
  analysis_quality: {
    overall_confidence: number;
    coverage_score: number;
    evidence_coverage: number;
    pages_successfully_read: number;
    pages_failed: number;
    warnings: string[];
  };
  usage: {
    model: string;
    input_tokens: number;
    output_tokens: number;
    estimated_ai_cost_usd: number;
  };
  company: {
    company_name: string | null;
    legal_name: string | null;
    description: string | null;
    industry: string | null;
    sub_industry: string | null;
    business_type: string | null;
    country: string | null;
    city: string | null;
    address: string | null;
    postal_code: string | null;
    languages: string[];
    target_market: string | null;
    customer_type: "B2B" | "B2C" | "Both" | null;
  };
  contact_legacy: {
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    contact_page: string | null;
    contact_form: boolean | null;
  };
  services: Array<{ name: string; description: string | null }>;
  products: {
    items: Array<{ name: string; description: string | null }>;
    categories: string[];
    pricing_detected: boolean | null;
    ecommerce_detected: boolean | null;
  };
  social_media: {
    linkedin: string | null;
    facebook: string | null;
    instagram: string | null;
    youtube: string | null;
    tiktok: string | null;
    x: string | null;
    other_social_links: string[];
  };
  website_capabilities: {
    online_booking: boolean | null;
    appointment_system: boolean | null;
    ecommerce: boolean | null;
    online_payment: boolean | null;
    contact_form: boolean | null;
    whatsapp: boolean | null;
    live_chat: boolean | null;
    newsletter: boolean | null;
    customer_login: boolean | null;
    multilingual_support: boolean | null;
    ssl: boolean | null;
    mobile_friendly: boolean | null;
    search: boolean | null;
    blog: boolean | null;
    pricing_page: boolean | null;
  };
  qualification_signals: QualificationSignal[];
  evidence_legacy: Evidence[];
  confidence_by_field: Record<string, number | null>;
}

export interface AnalysisRecord extends BusinessAnalysis {
  id: string;
  url: string;
  analyzed_at: string;
  analysis_meta: {
    model: string;
    pages_analyzed: number;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    estimated_cost_usd: number;
    cache_hit: boolean;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown, field: string, maxLength = 2000): string | null {
  if (value === null) return null;
  if (typeof value !== "string") throw new Error(`Invalid ${field}`);
  return value.trim().slice(0, maxLength) || null;
}

function stringArray(value: unknown, field: string, maxItems = 40): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) throw new Error(`Invalid ${field}`);
  return value.slice(0, maxItems).map((item) => item.trim().slice(0, 300)).filter(Boolean);
}

function nullableBoolean(value: unknown, field: string): boolean | null {
  if (value === null || typeof value === "boolean") return value;
  throw new Error(`Invalid ${field}`);
}

function confidence(value: unknown, field: string): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) throw new Error(`Invalid ${field}`);
  return value;
}

function normalizeConfidence(value: unknown, field: string, status: AnalysisStatus, evidenceCount = 0): number {
  const base = confidence(value, field) ?? 0;
  if (status === "UNKNOWN" || evidenceCount === 0) return 0;
  if (status === "FACT") return Math.min(Math.max(base, 0.05), 0.98);
  if (status === "INFERENCE") return Math.min(Math.max(base, 0.05), 0.8);
  return 0;
}

function safeStringArray(value: unknown, field: string, maxItems = 40): string[] {
  return Array.isArray(value) ? stringArray(value, field, maxItems) : [];
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`Invalid ${field}`);
  return value;
}

function normalizeEvidenceText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function analyzeStatus(value: unknown): AnalysisStatus {
  if (value === null || value === undefined) return "UNKNOWN";
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();
    if (normalized === "FACT" || normalized === "INFERENCE" || normalized === "UNKNOWN") return normalized as AnalysisStatus;
  }
  throw new Error("Invalid status");
}

function statusField<T>(value: unknown, field: string): StatusField<T> {
  if (value === null || value === undefined) {
    return { value: null as T, status: "UNKNOWN", confidence: 0, evidence_ids: [] };
  }
  const entry = record(value, field);
  const status = analyzeStatus(entry.status ?? entry.kind);
  const evidenceIds = Array.isArray(entry.evidence_ids) ? entry.evidence_ids.map((item) => String(item)) : [];
  return {
    value: entry.value as T,
    status,
    confidence: normalizeConfidence(entry.confidence, `${field}.confidence`, status, evidenceIds.length),
    evidence_ids: evidenceIds,
  };
}

function makeLegacyCompany(identity: Record<string, unknown>): {
  company_name: string | null;
  legal_name: string | null;
  description: string | null;
  industry: string | null;
  sub_industry: string | null;
  business_type: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  languages: string[];
  target_market: string | null;
  customer_type: "B2B" | "B2C" | "Both" | null;
} {
  const companyName = isRecord(identity.company_name) ? identity.company_name.value : null;
  const legalName = isRecord(identity.legal_name) ? identity.legal_name.value : null;
  const description = isRecord(identity.description) ? identity.description.value : null;
  const industry = isRecord(identity.industry) ? identity.industry.value : null;
  const businessType = isRecord(identity.business_type) ? identity.business_type.value : null;
  const businessModel = isRecord(identity.business_model) ? identity.business_model.value : null;

  return {
    company_name: nullableString(companyName, "company_name", 300),
    legal_name: nullableString(legalName, "legal_name", 300),
    description: nullableString(description, "description", 2000),
    industry: nullableString(industry, "industry", 200),
    sub_industry: null,
    business_type: nullableString(businessType, "business_type", 120),
    country: null,
    city: null,
    address: null,
    postal_code: null,
    languages: [],
    target_market: null,
    customer_type: nullableString(businessModel as string | null, "customer_type", 50) === null ? null : (businessModel as string) as "B2B" | "B2C" | "Both" | null,
  };
}

export function validateBusinessAnalysis(value: unknown, sourceTextByUrl: Map<string, string>): BusinessAnalysis {
  const root = record(value, "analysis");
  const newContract = root.schema_version !== undefined || root.identity !== undefined || root.request !== undefined || root.analysis_quality !== undefined;
  const legacyRequest = isRecord(root.request) ? record(root.request, "request") : {};
  const legacyCompany = isRecord(root.company) ? record(root.company, "company") : {};
  const legacyContact = isRecord(root.contact) ? record(root.contact, "contact") : {};
  const legacyProducts = isRecord(root.products) ? record(root.products, "products") : {};
  const legacySocial = isRecord(root.social_media) ? record(root.social_media, "social_media") : {};
  const legacyCapabilities = isRecord(root.website_capabilities) ? record(root.website_capabilities, "website_capabilities") : {};

  if (!newContract) {
    if (!isRecord(root.company)) throw new Error("Invalid company");
    const company = legacyCompany;
    const contact = legacyContact;
    const products = legacyProducts;
    const social = legacySocial;
    const capabilities = legacyCapabilities;
    if (!["B2B", "B2C", "Both", null].includes(company.customer_type as "B2B" | "B2C" | "Both" | null)) {
      throw new Error("Invalid customer_type");
    }

    const services = root.services;
    const productItems = products.items;
    const signals = root.qualification_signals;
    const evidence = root.evidence;

    if (!Array.isArray(services) || !Array.isArray(productItems) || !Array.isArray(signals) || !Array.isArray(evidence)) {
      throw new Error("Invalid analysis arrays");
    }

    const normalizedEvidence: Evidence[] = evidence.slice(0, 120).map((item) => {
      const source = record(item, "evidence item");
      if (source.kind !== "fact" && source.kind !== "inference") throw new Error("Invalid evidence kind");
      const url = nullableString(source.url, "evidence.url", 2048);
      if (!url || !sourceTextByUrl.has(url)) throw new Error("Evidence references an unfetched page");
      const excerpt = nullableString(source.excerpt, "evidence.excerpt", 500) ?? "";
      const pageText = sourceTextByUrl.get(url) ?? "";
      if (!excerpt || !normalizeEvidenceText(pageText).includes(normalizeEvidenceText(excerpt))) {
        throw new Error("Evidence excerpt does not appear in the source page");
      }
      return {
        field: nullableString(source.field, "evidence.field", 120) ?? "unknown",
        kind: source.kind,
        url,
        excerpt,
        confidence: confidence(source.confidence, "evidence.confidence"),
      };
    });

    const normalizedSignals: QualificationSignal[] = signals.slice(0, 50).map((item) => {
      const signal = record(item, "signal");
      if (!Array.isArray(signal.evidence)) throw new Error("Invalid signal evidence");
      return {
        signal: nullableString(signal.signal, "signal.name", 100) ?? "unknown",
        value: nullableBoolean(signal.value, "signal.value"),
        confidence: confidence(signal.confidence, "signal.confidence"),
        evidence: signal.evidence.slice(0, 20).map((source) => {
          const sourceRecord = record(source, "signal evidence item");
          const url = nullableString(sourceRecord.url, "signal evidence.url", 2048);
          if (!url || !sourceTextByUrl.has(url)) throw new Error("Signal references an unfetched page");
          return { url, reason: nullableString(sourceRecord.reason, "signal evidence.reason", 500) ?? "" };
        }),
      };
    });

    const confidenceMap = record(root.confidence_by_field, "confidence_by_field");
    const safeConfidenceMap: Record<string, number | null> = {};
    for (const [field, value] of Object.entries(confidenceMap).slice(0, 100)) {
      safeConfidenceMap[field.slice(0, 120)] = confidence(value, `confidence_by_field.${field}`);
    }

    const normalizedServices = services.slice(0, 40).map((item) => {
      const service = record(item, "service");
      return {
        name: nullableString(service.name, "service.name", 200) ?? "Unknown service",
        description: nullableString(service.description, "service.description", 1000),
      };
    });
    const normalizedProducts = productItems.slice(0, 40).map((item) => {
      const product = record(item, "product");
      return {
        name: nullableString(product.name, "product.name", 200) ?? "Unknown product",
        description: nullableString(product.description, "product.description", 1000),
      };
    });

    return {
      schema_version: "1.0",
      request: {
        input_url: typeof legacyRequest.input_url === "string" ? legacyRequest.input_url : "",
        canonical_url: typeof legacyRequest.canonical_url === "string" ? legacyRequest.canonical_url : "",
        domain: typeof legacyRequest.domain === "string" ? legacyRequest.domain : "",
        analyzed_at: typeof legacyRequest.analyzed_at === "string" ? legacyRequest.analyzed_at : new Date().toISOString(),
        pages_analyzed: Number(legacyRequest.pages_analyzed ?? 1),
        analysis_duration_ms: Number(legacyRequest.analysis_duration_ms ?? 0),
      },
      identity: {
        company_name: { value: nullableString(company.company_name, "company_name", 300), status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        legal_name: { value: nullableString(company.legal_name, "legal_name", 300), status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        description: { value: nullableString(company.description, "description", 2000), status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        industry: { value: nullableString(company.industry, "industry", 200), status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        business_model: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        business_type: { value: nullableString(company.business_type, "business_type", 120), status: "UNKNOWN", confidence: 0, evidence_ids: [] },
      },
      market: { customer_segments: [], target_audience: [], geographic_markets: [], languages: [], industries_served: [], company_size_focus: [] },
      offerings: { services: [], products: [], solutions: [], categories: [], primary_offerings: [] },
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
      contact: {
        emails: [], phones: [], addresses: [], contact_urls: [], sales_urls: [], support_urls: [],
      },
      social: {
        linkedin: null, facebook: null, instagram: null, x: null, youtube: null, github: null, other: [],
      },
      qualification: {
        b2b: null, b2c: null, b2b2c: null, enterprise_focus: null, smb_focus: null, lead_capture: null,
        sales_led: null, self_service: null, recurring_revenue_signal: null, transactional_revenue_signal: null, business_maturity: null,
      },
      signals: [],
      evidence: normalizedEvidence,
      unknowns: [],
      analysis_quality: {
        overall_confidence: 0,
        coverage_score: 0,
        evidence_coverage: 0,
        pages_successfully_read: 1,
        pages_failed: 0,
        warnings: [],
      },
      usage: {
        model: "gemini-3.1-flash-lite",
        input_tokens: 0,
        output_tokens: 0,
        estimated_ai_cost_usd: 0,
      },
      company: {
        company_name: nullableString(company.company_name, "company_name", 300),
        legal_name: nullableString(company.legal_name, "legal_name", 300),
        description: nullableString(company.description, "description", 2000),
        industry: nullableString(company.industry, "industry", 200),
        sub_industry: nullableString(company.sub_industry, "sub_industry", 200),
        business_type: nullableString(company.business_type, "business_type", 120),
        country: nullableString(company.country, "country", 120),
        city: nullableString(company.city, "city", 120),
        address: nullableString(company.address, "address", 500),
        postal_code: nullableString(company.postal_code, "postal_code", 40),
        languages: stringArray(company.languages, "languages", 20),
        target_market: nullableString(company.target_market, "target_market", 500),
        customer_type: company.customer_type as "B2B" | "B2C" | "Both" | null,
      },
      contact_legacy: {
        email: nullableString(contact.email, "contact.email", 320),
        phone: nullableString(contact.phone, "contact.phone", 80),
        whatsapp: nullableString(contact.whatsapp, "contact.whatsapp", 120),
        contact_page: nullableString(contact.contact_page, "contact.contact_page", 2048),
        contact_form: nullableBoolean(contact.contact_form, "contact.contact_form"),
      },
      services: normalizedServices,
      products: {
        items: normalizedProducts,
        categories: stringArray(products.categories, "product categories", 40),
        pricing_detected: nullableBoolean(products.pricing_detected, "pricing_detected"),
        ecommerce_detected: nullableBoolean(products.ecommerce_detected, "ecommerce_detected"),
      },
      social_media: {
        linkedin: nullableString(social.linkedin ?? null, "social.linkedin", 2048),
        facebook: nullableString(social.facebook ?? null, "social.facebook", 2048),
        instagram: nullableString(social.instagram ?? null, "social.instagram", 2048),
        youtube: nullableString(social.youtube ?? null, "social.youtube", 2048),
        tiktok: nullableString(social.tiktok ?? null, "social.tiktok", 2048),
        x: nullableString(social.x ?? null, "social.x", 2048),
        other_social_links: safeStringArray(social.other_social_links ?? [], "other_social_links", 30),
      },
      website_capabilities: {
        online_booking: nullableBoolean(capabilities.online_booking, "online_booking"),
        appointment_system: nullableBoolean(capabilities.appointment_system, "appointment_system"),
        ecommerce: nullableBoolean(capabilities.ecommerce, "ecommerce"),
        online_payment: nullableBoolean(capabilities.online_payment, "online_payment"),
        contact_form: nullableBoolean(capabilities.contact_form, "contact_form"),
        whatsapp: nullableBoolean(capabilities.whatsapp, "whatsapp"),
        live_chat: nullableBoolean(capabilities.live_chat, "live_chat"),
        newsletter: nullableBoolean(capabilities.newsletter, "newsletter"),
        customer_login: nullableBoolean(capabilities.customer_login, "customer_login"),
        multilingual_support: nullableBoolean(capabilities.multilingual_support, "multilingual_support"),
        ssl: nullableBoolean(capabilities.ssl, "ssl"),
        mobile_friendly: nullableBoolean(capabilities.mobile_friendly, "mobile_friendly"),
        search: nullableBoolean(capabilities.search, "search"),
        blog: nullableBoolean(capabilities.blog, "blog"),
        pricing_page: nullableBoolean(capabilities.pricing_page, "pricing_page"),
      },
      qualification_signals: normalizedSignals,
      evidence_legacy: normalizedEvidence,
      confidence_by_field: safeConfidenceMap,
    };
  }

  const identity = isRecord(root.identity) ? record(root.identity, "identity") : {};
  const request = isRecord(root.request) ? record(root.request, "request") : {};
  const commercial = isRecord(root.commercial) ? record(root.commercial, "commercial") : {};
  const conversionSignals = isRecord(root.conversion_signals) ? record(root.conversion_signals, "conversion_signals") : {};
  const digitalCapabilities = isRecord(root.digital_capabilities) ? record(root.digital_capabilities, "digital_capabilities") : {};
  const market = isRecord(root.market) ? record(root.market, "market") : {};
  const offerings = isRecord(root.offerings) ? record(root.offerings, "offerings") : {};
  const social = isRecord(root.social) ? record(root.social, "social") : {};
  const qualification = isRecord(root.qualification) ? record(root.qualification, "qualification") : {};
  const analysisQuality = isRecord(root.analysis_quality) ? record(root.analysis_quality, "analysis_quality") : {};
  const usage = isRecord(root.usage) ? record(root.usage, "usage") : {};
  const contactRoot = isRecord(root.contact) ? record(root.contact, "contact") : {};
  const productsRoot = isRecord(root.products) ? record(root.products, "products") : {};
  const websiteCapabilitiesRoot = isRecord(root.website_capabilities) ? record(root.website_capabilities, "website_capabilities") : {};

  const team: BusinessAnalysis = {
    schema_version: nullableString(root.schema_version, "schema_version", 20) ?? "1.0",
    request: {
      input_url: nullableString(request.input_url, "request.input_url", 2048) ?? "",
      canonical_url: nullableString(request.canonical_url, "request.canonical_url", 2048) ?? "",
      domain: nullableString(request.domain, "request.domain", 300) ?? "",
      analyzed_at: nullableString(request.analyzed_at, "request.analyzed_at", 100) ?? new Date().toISOString(),
      pages_analyzed: Number.isFinite(Number(request.pages_analyzed)) ? Number(request.pages_analyzed) : 0,
      analysis_duration_ms: Number.isFinite(Number(request.analysis_duration_ms)) ? Number(request.analysis_duration_ms) : 0,
    },
    identity: {
      company_name: statusField(identity.company_name, "identity.company_name"),
      legal_name: statusField(identity.legal_name, "identity.legal_name"),
      description: statusField(identity.description, "identity.description"),
      industry: statusField(identity.industry, "identity.industry"),
      business_model: statusField(identity.business_model, "identity.business_model"),
      business_type: statusField(identity.business_type, "identity.business_type"),
    },
    market: {
      customer_segments: safeStringArray(market.customer_segments, "market.customer_segments", 20),
      target_audience: safeStringArray(market.target_audience, "market.target_audience", 20),
      geographic_markets: safeStringArray(market.geographic_markets, "market.geographic_markets", 20),
      languages: safeStringArray(market.languages, "market.languages", 20),
      industries_served: safeStringArray(market.industries_served, "market.industries_served", 20),
      company_size_focus: safeStringArray(market.company_size_focus, "market.company_size_focus", 20),
    },
    offerings: {
      services: Array.isArray(offerings.services) ? offerings.services.slice(0, 20).map((item) => {
        const recordItem = record(item, "offerings.services item");
        return {
          name: nullableString(recordItem.name, "offerings.services.name", 200) ?? "Unknown service",
          description: nullableString(recordItem.description, "offerings.services.description", 1000),
          status: analyzeStatus(recordItem.status),
          confidence: confidence(recordItem.confidence, "offerings.services.confidence") ?? 0,
          evidence_ids: Array.isArray(recordItem.evidence_ids) ? recordItem.evidence_ids.map((id) => String(id)).slice(0, 20) : [],
        };
      }) : [],
      products: Array.isArray(offerings.products) ? offerings.products.slice(0, 20).map((item) => {
        const recordItem = record(item, "offerings.products item");
        return {
          name: nullableString(recordItem.name, "offerings.products.name", 200) ?? "Unknown product",
          description: nullableString(recordItem.description, "offerings.products.description", 1000),
          status: analyzeStatus(recordItem.status),
          confidence: confidence(recordItem.confidence, "offerings.products.confidence") ?? 0,
          evidence_ids: Array.isArray(recordItem.evidence_ids) ? recordItem.evidence_ids.map((id) => String(id)).slice(0, 20) : [],
        };
      }) : [],
      solutions: safeStringArray(offerings.solutions, "offerings.solutions", 20),
      categories: safeStringArray(offerings.categories, "offerings.categories", 20),
      primary_offerings: safeStringArray(offerings.primary_offerings, "offerings.primary_offerings", 20),
    },
    commercial: {
      has_pricing: statusField(commercial.has_pricing, "commercial.has_pricing"),
      pricing_model: safeStringArray(commercial.pricing_model, "commercial.pricing_model", 20),
      price_range: nullableString(commercial.price_range, "commercial.price_range", 200),
      has_free_trial: statusField(commercial.has_free_trial, "commercial.has_free_trial"),
      has_demo: statusField(commercial.has_demo, "commercial.has_demo"),
      has_subscription: statusField(commercial.has_subscription, "commercial.has_subscription"),
      has_online_purchase: statusField(commercial.has_online_purchase, "commercial.has_online_purchase"),
    },
    conversion_signals: {
      has_contact_form: statusField(conversionSignals.has_contact_form, "conversion_signals.has_contact_form"),
      has_sales_cta: statusField(conversionSignals.has_sales_cta, "conversion_signals.has_sales_cta"),
      has_demo_cta: statusField(conversionSignals.has_demo_cta, "conversion_signals.has_demo_cta"),
      has_signup: statusField(conversionSignals.has_signup, "conversion_signals.has_signup"),
      has_login: statusField(conversionSignals.has_login, "conversion_signals.has_login"),
      has_newsletter: statusField(conversionSignals.has_newsletter, "conversion_signals.has_newsletter"),
      has_booking: statusField(conversionSignals.has_booking, "conversion_signals.has_booking"),
      has_quote_request: statusField(conversionSignals.has_quote_request, "conversion_signals.has_quote_request"),
      has_downloadable_material: statusField(conversionSignals.has_downloadable_material, "conversion_signals.has_downloadable_material"),
    },
    digital_capabilities: {
      ecommerce: statusField(digitalCapabilities.ecommerce, "digital_capabilities.ecommerce"),
      online_payment: statusField(digitalCapabilities.online_payment, "digital_capabilities.online_payment"),
      customer_portal: statusField(digitalCapabilities.customer_portal, "digital_capabilities.customer_portal"),
      account_creation: statusField(digitalCapabilities.account_creation, "digital_capabilities.account_creation"),
      booking_system: statusField(digitalCapabilities.booking_system, "digital_capabilities.booking_system"),
      search: statusField(digitalCapabilities.search, "digital_capabilities.search"),
      api: statusField(digitalCapabilities.api, "digital_capabilities.api"),
      documentation: statusField(digitalCapabilities.documentation, "digital_capabilities.documentation"),
      developer_platform: statusField(digitalCapabilities.developer_platform, "digital_capabilities.developer_platform"),
      mobile_app: statusField(digitalCapabilities.mobile_app, "digital_capabilities.mobile_app"),
      integrations: safeStringArray(digitalCapabilities.integrations, "digital_capabilities.integrations", 20),
      technologies_detected: safeStringArray(digitalCapabilities.technologies_detected, "digital_capabilities.technologies_detected", 20),
    },
    contact: {
      emails: safeStringArray(contactRoot.emails ?? [], "contact.emails", 20),
      phones: safeStringArray(contactRoot.phones ?? [], "contact.phones", 20),
      addresses: safeStringArray(contactRoot.addresses ?? [], "contact.addresses", 20),
      contact_urls: safeStringArray(contactRoot.contact_urls ?? [], "contact.contact_urls", 20),
      sales_urls: safeStringArray(contactRoot.sales_urls ?? [], "contact.sales_urls", 20),
      support_urls: safeStringArray(contactRoot.support_urls ?? [], "contact.support_urls", 20),
    },
    social: {
      linkedin: nullableString(social.linkedin ?? null, "social.linkedin", 2048),
      facebook: nullableString(social.facebook ?? null, "social.facebook", 2048),
      instagram: nullableString(social.instagram ?? null, "social.instagram", 2048),
      x: nullableString(social.x ?? null, "social.x", 2048),
      youtube: nullableString(social.youtube ?? null, "social.youtube", 2048),
      github: nullableString(social.github ?? null, "social.github", 2048),
      other: safeStringArray(social.other ?? [], "social.other", 20),
    },
    qualification: {
      b2b: typeof qualification.b2b === "boolean" ? qualification.b2b : null,
      b2c: typeof qualification.b2c === "boolean" ? qualification.b2c : null,
      b2b2c: typeof qualification.b2b2c === "boolean" ? qualification.b2b2c : null,
      enterprise_focus: typeof qualification.enterprise_focus === "boolean" ? qualification.enterprise_focus : null,
      smb_focus: typeof qualification.smb_focus === "boolean" ? qualification.smb_focus : null,
      lead_capture: typeof qualification.lead_capture === "boolean" ? qualification.lead_capture : null,
      sales_led: typeof qualification.sales_led === "boolean" ? qualification.sales_led : null,
      self_service: typeof qualification.self_service === "boolean" ? qualification.self_service : null,
      recurring_revenue_signal: typeof qualification.recurring_revenue_signal === "boolean" ? qualification.recurring_revenue_signal : null,
      transactional_revenue_signal: typeof qualification.transactional_revenue_signal === "boolean" ? qualification.transactional_revenue_signal : null,
      business_maturity: nullableString(qualification.business_maturity ?? null, "qualification.business_maturity", 100),
    },
    signals: Array.isArray(root.signals) ? root.signals.slice(0, 40).map((item) => {
      const signal = record(item, "signals.item");
      const id = nullableString(signal.id ?? null, "signals.id", 100) ?? `sig_${Math.random().toString(36).slice(2, 8)}`;
      const normalizedStatus = signal.status === "FACT" || signal.status === "INFERENCE" || signal.status === "UNKNOWN" ? signal.status : "UNKNOWN";
      const evidenceIds = Array.isArray(signal.evidence_ids) ? signal.evidence_ids.map((entry) => String(entry)).slice(0, 20) : [];
      return {
        id,
        type: nullableString(signal.type ?? null, "signals.type", 100) ?? "unknown",
        value: signal.value === null || typeof signal.value === "boolean" ? signal.value : null,
        status: normalizedStatus,
        confidence: normalizeConfidence(signal.confidence, "signals.confidence", normalizedStatus, evidenceIds.length),
        evidence_ids: evidenceIds,
      };
    }) : [],
    evidence: Array.isArray(root.evidence) ? root.evidence.slice(0, 120).map((item) => {
      const evidenceItem = record(item, "evidence.item");
      const sourceUrl = nullableString(evidenceItem.source_url ?? null, "evidence.source_url", 2048);
      if (sourceUrl && !sourceTextByUrl.has(sourceUrl)) throw new Error("Evidence references an unfetched page");
      const quote = nullableString(evidenceItem.quote ?? null, "evidence.quote", 500) ?? "";
      const pageText = sourceTextByUrl.get(sourceUrl ?? "") ?? "";
      if (sourceUrl && quote && !normalizeEvidenceText(pageText).includes(normalizeEvidenceText(quote))) {
        throw new Error("Evidence excerpt does not appear in the source page");
      }
      const status = analyzeStatus(evidenceItem.status ?? evidenceItem.kind ?? "UNKNOWN");
      return {
        id: nullableString(evidenceItem.id ?? null, "evidence.id", 50) ?? "ev_unknown",
        field: nullableString(evidenceItem.field ?? null, "evidence.field", 120) ?? "unknown",
        status,
        confidence: normalizeConfidence(evidenceItem.confidence, "evidence.confidence", status, sourceUrl ? 1 : 0),
        quote,
        source_url: sourceUrl ?? "",
        source_page_type: nullableString(evidenceItem.source_page_type ?? null, "evidence.source_page_type", 100) ?? "unknown",
        reason: nullableString(evidenceItem.reason ?? null, "evidence.reason", 500) ?? "",
      };
    }) : [],
    unknowns: Array.isArray(root.unknowns) ? root.unknowns.slice(0, 50).map((item) => {
      const unknownItem = record(item, "unknowns.item");
      return {
        field: nullableString(unknownItem.field, "unknowns.field", 200) ?? "unknown",
        reason: nullableString(unknownItem.reason, "unknowns.reason", 500) ?? "",
      };
    }) : [],
    analysis_quality: {
      overall_confidence: confidence(analysisQuality.overall_confidence, "analysis_quality.overall_confidence") ?? 0,
      coverage_score: confidence(analysisQuality.coverage_score, "analysis_quality.coverage_score") ?? 0,
      evidence_coverage: confidence(analysisQuality.evidence_coverage, "analysis_quality.evidence_coverage") ?? 0,
      pages_successfully_read: Number.isFinite(Number(analysisQuality.pages_successfully_read)) ? Number(analysisQuality.pages_successfully_read) : 0,
      pages_failed: Number.isFinite(Number(analysisQuality.pages_failed)) ? Number(analysisQuality.pages_failed) : 0,
      warnings: Array.isArray(analysisQuality.warnings) ? analysisQuality.warnings.map((warning) => String(warning)).slice(0, 20) : [],
    },
    usage: {
      model: nullableString(usage.model, "usage.model", 100) ?? "gemini-3.1-flash-lite",
      input_tokens: Number.isFinite(Number(usage.input_tokens)) ? Number(usage.input_tokens) : 0,
      output_tokens: Number.isFinite(Number(usage.output_tokens)) ? Number(usage.output_tokens) : 0,
      estimated_ai_cost_usd: Number.isFinite(Number(usage.estimated_ai_cost_usd)) ? Number(usage.estimated_ai_cost_usd) : 0,
    },
    company: makeLegacyCompany(identity),
    contact_legacy: {
      email: nullableString(contactRoot.email, "contact.email", 320),
      phone: nullableString(contactRoot.phone, "contact.phone", 80),
      whatsapp: nullableString(contactRoot.whatsapp, "contact.whatsapp", 120),
      contact_page: nullableString(contactRoot.contact_page, "contact.contact_page", 2048),
      contact_form: nullableBoolean(contactRoot.contact_form, "contact.contact_form"),
    },
    services: Array.isArray(root.services) ? root.services.slice(0, 40).map((item) => {
      const service = record(item, "service");
      return {
        name: nullableString(service.name, "service.name", 200) ?? "Unknown service",
        description: nullableString(service.description, "service.description", 1000),
      };
    }) : [],
    products: {
      items: Array.isArray(productsRoot.items) ? productsRoot.items.slice(0, 40).map((item) => {
        const product = record(item, "product");
        return {
          name: nullableString(product.name, "product.name", 200) ?? "Unknown product",
          description: nullableString(product.description, "product.description", 1000),
        };
      }) : [],
      categories: stringArray(productsRoot.categories ?? [], "product categories", 40),
      pricing_detected: nullableBoolean(productsRoot.pricing_detected, "pricing_detected"),
      ecommerce_detected: nullableBoolean(productsRoot.ecommerce_detected, "ecommerce_detected"),
    },
    social_media: {
      linkedin: nullableString(social.linkedin ?? null, "social.linkedin", 2048),
      facebook: nullableString(social.facebook ?? null, "social.facebook", 2048),
      instagram: nullableString(social.instagram ?? null, "social.instagram", 2048),
      youtube: nullableString(social.youtube ?? null, "social.youtube", 2048),
      tiktok: nullableString(social.tiktok ?? null, "social.tiktok", 2048),
      x: nullableString(social.x ?? null, "social.x", 2048),
      other_social_links: safeStringArray(social.other_social_links ?? [], "other_social_links", 30),
    },
    website_capabilities: {
      online_booking: nullableBoolean(websiteCapabilitiesRoot.online_booking, "online_booking"),
      appointment_system: nullableBoolean(websiteCapabilitiesRoot.appointment_system, "appointment_system"),
      ecommerce: nullableBoolean(websiteCapabilitiesRoot.ecommerce, "ecommerce"),
      online_payment: nullableBoolean(websiteCapabilitiesRoot.online_payment, "online_payment"),
      contact_form: nullableBoolean(websiteCapabilitiesRoot.contact_form, "contact_form"),
      whatsapp: nullableBoolean(websiteCapabilitiesRoot.whatsapp, "whatsapp"),
      live_chat: nullableBoolean(websiteCapabilitiesRoot.live_chat, "live_chat"),
      newsletter: nullableBoolean(websiteCapabilitiesRoot.newsletter, "newsletter"),
      customer_login: nullableBoolean(websiteCapabilitiesRoot.customer_login, "customer_login"),
      multilingual_support: nullableBoolean(websiteCapabilitiesRoot.multilingual_support, "multilingual_support"),
      ssl: nullableBoolean(websiteCapabilitiesRoot.ssl, "ssl"),
      mobile_friendly: nullableBoolean(websiteCapabilitiesRoot.mobile_friendly, "mobile_friendly"),
      search: nullableBoolean(websiteCapabilitiesRoot.search, "search"),
      blog: nullableBoolean(websiteCapabilitiesRoot.blog, "blog"),
      pricing_page: nullableBoolean(websiteCapabilitiesRoot.pricing_page, "pricing_page"),
    },
    qualification_signals: Array.isArray(root.qualification_signals) ? root.qualification_signals.slice(0, 50).map((item) => {
      const signal = record(item, "signal");
      return {
        signal: nullableString(signal.signal, "signal.name", 100) ?? "unknown",
        value: nullableBoolean(signal.value, "signal.value"),
        confidence: confidence(signal.confidence, "signal.confidence"),
        evidence: Array.isArray(signal.evidence) ? signal.evidence.slice(0, 20).map((entry) => {
          const entryRecord = record(entry, "signal evidence item");
          const url = nullableString(entryRecord.url, "signal evidence.url", 2048);
          if (url && !sourceTextByUrl.has(url)) throw new Error("Signal references an unfetched page");
          return { url: url ?? "", reason: nullableString(entryRecord.reason, "signal evidence.reason", 500) ?? "" };
        }) : [],
      };
    }) : [],
    evidence_legacy: Array.isArray(root.evidence) ? root.evidence.slice(0, 120).map((item) => {
      const source = record(item, "evidence item");
      const kind = source.kind === "fact" || source.kind === "inference" ? source.kind : "inference";
      const url = nullableString(source.url, "evidence.url", 2048);
      if (!url || !sourceTextByUrl.has(url)) throw new Error("Evidence references an unfetched page");
      const excerpt = nullableString(source.excerpt, "evidence.excerpt", 500) ?? "";
      const pageText = sourceTextByUrl.get(url) ?? "";
      if (!excerpt || !normalizeEvidenceText(pageText).includes(normalizeEvidenceText(excerpt))) {
        throw new Error("Evidence excerpt does not appear in the source page");
      }
      return {
        field: nullableString(source.field, "evidence.field", 120) ?? "unknown",
        kind,
        url,
        excerpt,
        confidence: confidence(source.confidence, "evidence.confidence"),
      };
    }) : [],
    confidence_by_field: {},
  };

  return team;
}