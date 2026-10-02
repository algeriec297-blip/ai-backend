export type EvidenceKind = "fact" | "inference";

export interface Evidence {
  field: string;
  kind: EvidenceKind;
  url: string;
  excerpt: string;
  confidence: number | null;
}

export interface QualificationSignal {
  signal: string;
  value: boolean | null;
  confidence: number | null;
  evidence: Array<{ url: string; reason: string }>;
}

export interface BusinessAnalysis {
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
  contact: {
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
  evidence: Evidence[];
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

export function validateBusinessAnalysis(value: unknown, sourceTextByUrl: Map<string, string>): BusinessAnalysis {
  const root = record(value, "analysis");
  const company = record(root.company, "company");
  const contact = record(root.contact, "contact");
  const products = record(root.products, "products");
  const social = record(root.social_media, "social_media");
  const capabilities = record(root.website_capabilities, "website_capabilities");
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
    contact: {
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
      linkedin: nullableString(social.linkedin, "social.linkedin", 2048),
      facebook: nullableString(social.facebook, "social.facebook", 2048),
      instagram: nullableString(social.instagram, "social.instagram", 2048),
      youtube: nullableString(social.youtube, "social.youtube", 2048),
      tiktok: nullableString(social.tiktok, "social.tiktok", 2048),
      x: nullableString(social.x, "social.x", 2048),
      other_social_links: stringArray(social.other_social_links, "other_social_links", 30),
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
    evidence: normalizedEvidence,
    confidence_by_field: safeConfidenceMap,
  };
}