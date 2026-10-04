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
    sub_industry: StatusField<string | null>;
    business_model: StatusField<string | null>;
    business_type: StatusField<string | null>;
    country: StatusField<string | null>;
    city: StatusField<string | null>;
    address: StatusField<string | null>;
    postal_code: StatusField<string | null>;
    target_market: StatusField<string | null>;
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

type SocialPlatform = "linkedin" | "facebook" | "instagram" | "x" | "youtube" | "github" | "tiktok";

const socialPlatformDomains: Record<SocialPlatform, string[]> = {
  linkedin: ["linkedin.com", "linkedin.cn", "lnkd.in"],
  facebook: ["facebook.com", "fb.com", "fb.me", "fb.watch"],
  instagram: ["instagram.com"],
  x: ["x.com", "twitter.com"],
  youtube: ["youtube.com", "youtu.be"],
  github: ["github.com"],
  tiktok: ["tiktok.com"],
};

function nullableSocialUrl(value: unknown, platform: SocialPlatform): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (!candidate || candidate.length > 2048) return null;
  const absoluteCandidate = /^[a-z][a-z\d+.-]*:/i.test(candidate)
    ? candidate
    : `https://${candidate.replace(/^\/\//, "")}`;
  try {
    const url = new URL(absoluteCandidate);
    const hostname = url.hostname.toLowerCase();
    const isExpectedPlatform = socialPlatformDomains[platform].some((domain) =>
      hostname === domain || hostname.endsWith(`.${domain}`));
    if (!["http:", "https:"].includes(url.protocol)
      || !isExpectedPlatform
      || url.username
      || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
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
  if (status === "FACT") return Math.min(base, 0.98);
  if (status === "INFERENCE") return Math.min(base, 0.8);
  return 0;
}

function evidenceClaimValue(root: Record<string, unknown>, field: string): unknown {
  const parts = field.split(".").filter(Boolean);
  let current: unknown = root;
  for (const part of parts) {
    if (Array.isArray(current)) {
      if (/^\d+$/.test(part)) {
        current = current[Number(part)];
        continue;
      }
      const match = current.find((item) => isRecord(item)
        && [item.signal, item.type, item.id].some((candidate) => candidate === part));
      current = match;
      continue;
    }
    if (!isRecord(current)) return undefined;
    current = current[part];
  }
  if (isRecord(current) && "value" in current) return current.value;
  if (current !== undefined) return current;

  const key = parts.at(-1);
  if (key && isRecord(root.company) && key in root.company) return root.company[key];
  if (key && isRecord(root.website_capabilities) && key in root.website_capabilities) return root.website_capabilities[key];
  return undefined;
}

function evidenceAnchor(field: string): RegExp | null {
  const key = field.split(".").at(-1)?.toLowerCase() ?? "";
  const rules: Record<string, RegExp> = {
    mobile_friendly: /\b(?:mobile[- ]friendly|responsive (?:design|layout|website|site)|optimized for mobile|mobile optimized|designed for mobile)\b/,
    has_mobile_optimization: /\b(?:mobile[- ]friendly|responsive (?:design|layout|website|site)|optimized for mobile|mobile optimized|designed for mobile)\b/,
    appears_b2b: /\b(?:b2b|business(?:es)?|enterprise|business to business)\b|(?:الشركات|للأعمال|مؤسسات)/u,
    b2b: /\b(?:b2b|business(?:es)?|enterprise|business to business)\b|(?:الشركات|للأعمال|مؤسسات)/u,
    appears_b2c: /\b(?:b2c|consumer(?:s)?|individuals|households|personal use)\b|(?:الأفراد|المستهلكين|للاستخدام الشخصي)/u,
    appears_b2b2c: /\b(?:b2b2c|business[- ]to[- ]business[- ]to[- ]consumer)\b/,
    online_booking: /\b(?:book(?:ing)?|appointment|schedule)\b|(?:حجز|احجز|الحجوزات|المواعيد|جدولة)/u,
    has_online_booking: /\b(?:book(?:ing)?|appointment|schedule)\b|(?:حجز|احجز|الحجوزات|المواعيد|جدولة)/u,
    lacks_online_booking: /\b(?:no online booking|booking unavailable|appointments? by phone only|call to book|book by phone only)\b/,
    booking_system: /\b(?:book(?:ing)?|appointment|schedule)\b|(?:حجز|احجز|الحجوزات|المواعيد|جدولة)/u,
    has_booking: /\b(?:book(?:ing)?|appointment|schedule)\b|(?:حجز|احجز|الحجوزات|المواعيد|جدولة)/u,
    contact_form: /\b(?:contact form|contact us|send us a message)\b|(?:نموذج الاتصال|اتصل بنا|تواصل معنا|أرسل لنا رسالة)/u,
    has_contact_form: /\b(?:contact form|contact us|send us a message)\b|(?:نموذج الاتصال|اتصل بنا|تواصل معنا|أرسل لنا رسالة)/u,
    pricing_page: /\b(?:pricing|prices?|plans?)\b|(?:الأسعار|السعر|خطط الأسعار|الباقات)/u,
    has_pricing: /\b(?:pricing|prices?|plans?)\b|(?:الأسعار|السعر|خطط الأسعار|الباقات)/u,
    has_demo_cta: /\b(?:demo|request a demo|book a demo|product demo)\b/,
    has_sales_cta: /\b(?:contact sales|talk to sales|sales team|request a quote)\b/,
    has_demo: /\b(?:demo|request a demo|book a demo|product demo)\b/,
    has_signup: /\b(?:sign up|signup|create an account|register|get started|download)\b/,
    has_login: /\b(?:log in|login|sign in)\b/,
    api: /\b(?:api|developer api|api documentation)\b/,
    documentation: /\b(?:documentation|docs|developer docs)\b/,
    developer_platform: /\b(?:developer platform|developers|developer tools)\b/,
    mobile_app: /\b(?:app store|google play|mobile app|download our app)\b/,
    has_subscription: /\b(?:subscription|monthly plan|annual plan|per user per month)\b/,
    ecommerce: /\b(?:online store|shop online|checkout|buy online|e[- ]?commerce|sell(?:ing)? (?:products )?online|online selling)\b|(?:متجر إلكتروني|تسوق عبر الإنترنت|اشتر الآن|إتمام الشراء)/u,
    has_ecommerce: /\b(?:online store|shop online|checkout|buy online|e[- ]?commerce|sell(?:ing)? (?:products )?online|online selling)\b|(?:متجر إلكتروني|تسوق عبر الإنترنت|اشتر الآن|إتمام الشراء)/u,
    lacks_ecommerce: /\b(?:no online store|does not sell online|doesn't sell online|online purchases? unavailable)\b/,
    online_payment: /\b(?:online payments?|accept payments online|pay online|checkout|payment methods?)\b|(?:الدفع عبر الإنترنت|الدفع الإلكتروني|ادفع الآن|طرق الدفع)/u,
    has_online_payment: /\b(?:online payments?|accept payments online|pay online|checkout|payment methods?)\b|(?:الدفع عبر الإنترنت|الدفع الإلكتروني|ادفع الآن|طرق الدفع)/u,
    ssl: /\b(?:ssl|https|secure connection)\b/,
    whatsapp: /\b(?:whatsapp|wa me)\b/,
    has_whatsapp: /\b(?:whatsapp|wa me)\b/,
    has_social_presence: /\b(?:facebook|instagram|linkedin|youtube|tiktok|social media|x\.com)\b/,
    appears_active: /\b(?:latest news|recently updated|updated on|copyright\s+20(?:2[4-9]|[3-9]\d))\b/,
    appears_local_business: /\b(?:visit us|located in|our address|local (?:business|service)|serving [\p{L}\s]+(?:area|community|region))\b/u,
    offers_multiple_services: /\b(?:services include|our services|we offer|solutions include)\b/,
    has_outdated_website_signals: /\b(?:under construction|website coming soon|flash player|outdated website|copyright\s+(?:19|20(?:0\d|1\d)))\b/,
    has_multilingual_site: /\b(?:multilingual|multiple languages|language selector|select language|english.{0,30}(?:español|spanish|français|deutsch)|(?:español|spanish|français|deutsch).{0,30}english)\b/,
    newsletter: /\b(?:newsletter|subscribe for updates)\b/,
    customer_login: /\b(?:log in|login|sign in)\b/,
    has_free_trial: /\bfree trial\b/,
    blog: /\b(?:blog|articles|latest posts)\b/,
    search: /\b(?:search|search for)\b/,
    has_physical_location: /\b(?:visit us|our address|located in|physical location)\b/,
  };
  if (key === "address") return /\b\d+\s+[\p{L}\p{N}.'-]+(?:\s+[\p{L}\p{N}.'-]+){0,3}\s+(?:street|st|road|rd|avenue|ave|boulevard|blvd|lane|ln|drive|dr)\b/u;
  return rules[key] ?? null;
}

function evidenceSupportsClaim(
  root: Record<string, unknown>,
  field: string,
  quote: string,
  status?: AnalysisStatus,
  reason?: string,
): boolean {
  const normalizedQuote = normalizeEvidenceText(quote);
  if (!normalizedQuote) return false;
  const claimValue = evidenceClaimValue(root, field);
  if (typeof claimValue === "string" && claimValue.trim()) {
    if (normalizedQuote.includes(normalizeEvidenceText(claimValue))) return true;
    const reasonText = typeof reason === "string" ? normalizeEvidenceText(reason) : "";
    const quoteTerms = normalizedQuote.match(/[\p{L}\p{N}]{3,}/gu) ?? [];
    const reasonReferencesSource = quoteTerms.some((term) => !evidenceReasonStopWords.has(term) && reasonText.includes(term));
    return status === "INFERENCE"
      && inferentialEvidenceFields.has(field)
      && reasonText.length >= 20
      && reasonReferencesSource;
  }

  const key = field.split(".").at(-1)?.toLowerCase();
  if ((key === "mobile_friendly" || key === "has_mobile_optimization") && typeof claimValue === "boolean") {
    const positiveEvidence = /\b(?:mobile friendly|responsive (?:design|layout|website|site)|optimized for mobile|mobile optimized|designed for mobile)\b/;
    const negativeEvidence = /\b(?:desktop only|not mobile friendly|not responsive|no mobile support|not optimized for mobile)\b/;
    return claimValue ? positiveEvidence.test(normalizedQuote) && !negativeEvidence.test(normalizedQuote)
      : negativeEvidence.test(normalizedQuote);
  }

  const anchor = evidenceAnchor(field);
  if (!anchor || !anchor.test(normalizedQuote)) return false;
  if (typeof claimValue !== "boolean") return true;
  if (claimValue) return true;

  const matchedText = normalizedQuote.match(anchor)?.[0];
  if (!matchedText) return false;
  const index = normalizedQuote.indexOf(matchedText);
  const surroundingText = normalizedQuote.slice(Math.max(0, index - 40), index + matchedText.length + 40);
  return /\b(?:no|not|without|does not|doesn't|unavailable|unsupported)\b/.test(surroundingText);
}

function normalizeLinkedClaims(value: unknown, evidence: BusinessAnalysis["evidence"], path = ""): unknown {
  if (Array.isArray(value)) {
    return value.map((item, index) => normalizeLinkedClaims(item, evidence, `${path}.${index}`));
  }
  if (!isRecord(value)) return value;

  if (typeof value.status === "string" && Array.isArray(value.evidence_ids)) {
    const evidenceIds = value.evidence_ids.map(String);
    const pathParts = path.split(".");
    const lastPathPart = pathParts.at(-1);
    const fieldPaths = path.startsWith("signals.") && typeof value.type === "string"
      ? evidenceFieldsForCanonicalPath(`signals.${value.type}`)
      : lastPathPart && /^\d+$/.test(lastPathPart)
        ? evidenceFieldsForCanonicalPath(`${path}.name`)
        : evidenceFieldsForCanonicalPath(path);
    const linkedEvidence = evidence.filter((item) => item.id && evidenceIds.includes(item.id)
      && fieldPaths.includes(item.field));
    if (!linkedEvidence.length) {
      return {
        ...value,
        ...( "value" in value ? { value: null } : {}),
        ...( "name" in value ? { name: "Unknown" } : {}),
        ...( "description" in value ? { description: null } : {}),
        status: "UNKNOWN",
        confidence: 0,
        evidence_ids: [],
      };
    }
    const status = value.status === "INFERENCE" || linkedEvidence.some((item) => item.status === "INFERENCE")
      ? "INFERENCE"
      : value.status === "FACT" ? "FACT" : "UNKNOWN";
    return {
      ...value,
      value: status === "UNKNOWN" ? null : value.value,
      status,
      confidence: normalizeConfidence(value.confidence, `${path}.confidence`, status, linkedEvidence.length),
      evidence_ids: linkedEvidence.map((item) => item.id),
    };
  }

  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
    key,
    normalizeLinkedClaims(entry, evidence, path ? `${path}.${key}` : key),
  ]));
}

const evidenceFieldAliases: Record<string, string[]> = {
  "identity.company_name": ["company.company_name"],
  "identity.legal_name": ["company.legal_name"],
  "identity.description": ["company.description"],
  "identity.industry": ["company.industry"],
  "identity.sub_industry": ["company.sub_industry"],
  "identity.business_model": ["company.customer_type", "qualification_signals.appears_b2b", "qualification_signals.appears_b2c"],
  "identity.business_type": ["company.business_type"],
  "identity.country": ["company.country"],
  "identity.city": ["company.city"],
  "identity.address": ["company.address", "contact.address"],
  "identity.postal_code": ["company.postal_code"],
  "identity.target_market": ["company.target_market"],
  "commercial.has_pricing": ["website_capabilities.pricing_page", "products.pricing_detected"],
  "conversion_signals.has_contact_form": ["contact.contact_form", "website_capabilities.contact_form"],
  "conversion_signals.has_booking": ["qualification_signals.has_online_booking", "signals.has_online_booking", "website_capabilities.online_booking", "website_capabilities.appointment_system"],
  "conversion_signals.has_newsletter": ["website_capabilities.newsletter"],
  "conversion_signals.has_login": ["website_capabilities.customer_login"],
  "digital_capabilities.ecommerce": ["qualification_signals.has_ecommerce", "signals.has_ecommerce", "website_capabilities.ecommerce", "products.ecommerce_detected"],
  "digital_capabilities.online_payment": ["qualification_signals.has_online_payment", "signals.has_online_payment", "website_capabilities.online_payment"],
  "digital_capabilities.booking_system": ["qualification_signals.has_online_booking", "signals.has_online_booking", "website_capabilities.online_booking", "website_capabilities.appointment_system"],
  "digital_capabilities.search": ["website_capabilities.search"],
  "digital_capabilities.mobile_app": ["website_capabilities.mobile_app"],
  "signals.has_online_booking": ["qualification_signals.has_online_booking", "digital_capabilities.booking_system", "website_capabilities.online_booking", "website_capabilities.appointment_system"],
  "signals.has_contact_form": ["qualification_signals.has_contact_form", "conversion_signals.has_contact_form", "website_capabilities.contact_form", "contact.contact_form"],
  "signals.has_online_payment": ["qualification_signals.has_online_payment", "digital_capabilities.online_payment", "website_capabilities.online_payment"],
  "signals.has_ecommerce": ["qualification_signals.has_ecommerce", "digital_capabilities.ecommerce", "website_capabilities.ecommerce", "products.ecommerce_detected"],
  "signals.has_whatsapp": ["qualification_signals.has_whatsapp", "website_capabilities.whatsapp", "contact.whatsapp"],
  "signals.appears_b2b": ["qualification_signals.appears_b2b", "company.customer_type", "identity.business_model"],
  "signals.appears_b2c": ["qualification_signals.appears_b2c", "company.customer_type", "identity.business_model"],
  "qualification.b2b": ["qualification_signals.appears_b2b", "qualification_signals.b2b"],
  "qualification.b2c": ["qualification_signals.appears_b2c", "qualification_signals.b2c"],
};

const inferentialEvidenceFields = new Set([
  "identity.industry",
  "identity.sub_industry",
  "identity.business_model",
  "identity.business_type",
  "identity.target_market",
]);
const evidenceReasonStopWords = new Set([
  "the", "and", "for", "from", "this", "that", "page", "site", "website", "company", "business",
  "service", "services", "provide", "provides", "with", "which", "supports",
]);

function evidenceFieldsForCanonicalPath(path: string): string[] {
  const aliases = evidenceFieldAliases[path] ?? [];
  const serviceMatch = /^offerings\.(services|products)\.(\d+)\.(name|description)$/.exec(path);
  if (serviceMatch) {
    const [, collection, index, property] = serviceMatch;
    const legacyCollection = collection === "services" ? "services" : "products.items";
    aliases.push(`${legacyCollection}.${index}.${property}`);
  }
  const signalMatch = /^signals\.([^.]+)$/.exec(path);
  if (signalMatch) {
    aliases.push(`qualification_signals.${signalMatch[1]}`);
  }
  return [path, ...aliases];
}

function hasEvidenceForPath(
  root: Record<string, unknown>,
  evidence: BusinessAnalysis["evidence"],
  path: string,
): boolean {
  const fields = evidenceFieldsForCanonicalPath(path);
  return evidence.some((item) => fields.includes(item.field)
    && evidenceSupportsClaim(
      root,
      item.field,
      item.quote ?? item.excerpt ?? "",
      item.status ?? (item.kind === "inference" ? "INFERENCE" : "FACT"),
      item.reason,
    ));
}

function evidenceBackedArray(
  root: Record<string, unknown>,
  value: string[],
  path: string,
  evidence: BusinessAnalysis["evidence"],
): string[] {
  return value.filter((_item, index) => hasEvidenceForPath(root, evidence, `${path}.${index}`));
}

function evidenceBackedValue<T>(
  root: Record<string, unknown>,
  value: T | null,
  path: string,
  evidence: BusinessAnalysis["evidence"],
): T | null {
  return value !== null && hasEvidenceForPath(root, evidence, path) ? value : null;
}

function legacyEvidenceBackedValue(
  value: unknown,
  fieldAliases: string[],
  evidence: BusinessAnalysis["evidence"],
): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalizedValue = normalizeEvidenceText(value);
  return evidence.some((item) => fieldAliases.includes(item.field)
    && normalizeEvidenceText(item.quote ?? item.excerpt ?? "").includes(normalizedValue))
    ? value
    : null;
}

function legacyEvidenceBackedArray(
  values: string[],
  path: string,
  evidence: BusinessAnalysis["evidence"],
): string[] {
  return values.filter((value, index) => legacyEvidenceBackedValue(
    value,
    [`${path}.${index}`],
    evidence,
  ) !== null);
}

function supportingEvidence(evidence: BusinessAnalysis["evidence"], canonicalPath: string) {
  const supportedFields = evidenceFieldsForCanonicalPath(canonicalPath);
  return evidence.filter((item) => supportedFields.includes(item.field));
}

function statusFieldFromEvidence<T>(
  value: T | null,
  canonicalPath: string,
  evidence: BusinessAnalysis["evidence"],
  confidenceValue: unknown = null,
): StatusField<T | null> {
  const matches = supportingEvidence(evidence, canonicalPath);
  const evidenceIds = matches.flatMap((item) => item.id ? [item.id] : []);
  if (value === null || evidenceIds.length === 0) {
    return { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] };
  }

  const status = matches.some((item) => item.status === "INFERENCE" || item.kind === "inference")
    ? "INFERENCE"
    : "FACT";
  const evidenceConfidence = matches.reduce((total, item) => total + (item.confidence ?? 0), 0) / matches.length;
  const statedConfidence = confidence(confidenceValue, `${canonicalPath}.confidence`);
  const baseConfidence = statedConfidence === null ? evidenceConfidence : Math.min(statedConfidence, evidenceConfidence);
  return {
    value,
    status,
    confidence: normalizeConfidence(baseConfidence, `${canonicalPath}.confidence`, status, evidenceIds.length),
    evidence_ids: evidenceIds,
  };
}

function statusValue<T>(field: StatusField<T | null>): T | null {
  return field.status === "UNKNOWN" ? null : field.value;
}

function deriveAnalysisQuality(analysis: BusinessAnalysis, pagesAnalyzed: number): BusinessAnalysis["analysis_quality"] {
  const claims: StatusField[] = [];
  const collectClaims = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(collectClaims);
      return;
    }
    if (!isRecord(value)) return;
    if (typeof value.status === "string" && Array.isArray(value.evidence_ids)) claims.push(value as unknown as StatusField);
    Object.values(value).forEach(collectClaims);
  };
  collectClaims(analysis.identity);
  collectClaims(analysis.offerings);
  collectClaims(analysis.commercial);
  collectClaims(analysis.conversion_signals);
  collectClaims(analysis.digital_capabilities);
  collectClaims(analysis.signals);

  const supportedClaims = claims.filter((claim) => claim.status !== "UNKNOWN" && claim.evidence_ids.length > 0);
  const overallConfidence = claims.length
    ? supportedClaims.reduce((total, claim) => total + claim.confidence, 0) / claims.length
    : 0;
  const coverage = claims.length ? supportedClaims.length / claims.length : 0;
  const evidenceCoverage = supportedClaims.length
    ? supportedClaims.filter((claim) => claim.evidence_ids.length > 0).length / supportedClaims.length
    : 0;

  return {
    overall_confidence: Math.min(overallConfidence, 0.98),
    coverage_score: coverage,
    evidence_coverage: evidenceCoverage,
    pages_successfully_read: pagesAnalyzed,
    pages_failed: 0,
    warnings: analysis.analysis_quality.warnings.slice(0, 20),
  };
}

function canonicalizeLegacyInput(
  analysis: BusinessAnalysis,
  legacyCompany: Record<string, unknown>,
  legacyContact: Record<string, unknown>,
  legacyProducts: Record<string, unknown>,
  legacySocial: Record<string, unknown>,
  legacyCapabilities: Record<string, unknown>,
  evidence: BusinessAnalysis["evidence"],
  legacySignals: QualificationSignal[],
  confidenceMap: Record<string, unknown>,
): BusinessAnalysis {
  const fieldConfidence = (field: string) => confidenceMap[field] ?? null;
  const companyName = statusFieldFromEvidence(
    nullableString(legacyCompany.company_name, "company.company_name", 300),
    "identity.company_name", evidence, fieldConfidence("company.company_name"),
  );
  const legalName = statusFieldFromEvidence(
    nullableString(legacyCompany.legal_name, "company.legal_name", 300),
    "identity.legal_name", evidence, fieldConfidence("company.legal_name"),
  );
  const description = statusFieldFromEvidence(
    nullableString(legacyCompany.description, "company.description", 2000),
    "identity.description", evidence, fieldConfidence("company.description"),
  );
  const industry = statusFieldFromEvidence(
    nullableString(legacyCompany.industry, "company.industry", 200),
    "identity.industry", evidence, fieldConfidence("company.industry"),
  );
  const subIndustry = statusFieldFromEvidence(
    nullableString(legacyCompany.sub_industry, "company.sub_industry", 200),
    "identity.sub_industry", evidence, fieldConfidence("company.sub_industry"),
  );
  const businessModel = statusFieldFromEvidence(
    nullableString(legacyCompany.customer_type, "company.customer_type", 50),
    "identity.business_model", evidence, fieldConfidence("company.customer_type"),
  );
  const businessType = statusFieldFromEvidence(
    nullableString(legacyCompany.business_type, "company.business_type", 120),
    "identity.business_type", evidence, fieldConfidence("company.business_type"),
  );
  const country = statusFieldFromEvidence(
    nullableString(legacyCompany.country, "company.country", 100),
    "identity.country", evidence, fieldConfidence("company.country"),
  );
  const city = statusFieldFromEvidence(
    nullableString(legacyCompany.city, "company.city", 100),
    "identity.city", evidence, fieldConfidence("company.city"),
  );
  const address = statusFieldFromEvidence(
    nullableString(legacyCompany.address, "company.address", 500),
    "identity.address", evidence, fieldConfidence("company.address"),
  );
  const postalCode = statusFieldFromEvidence(
    nullableString(legacyCompany.postal_code, "company.postal_code", 40),
    "identity.postal_code", evidence, fieldConfidence("company.postal_code"),
  );
  const targetMarket = statusFieldFromEvidence(
    nullableString(legacyCompany.target_market, "company.target_market", 300),
    "identity.target_market", evidence, fieldConfidence("company.target_market"),
  );
  const legacySignalValue = (name: string) => legacySignals.find((signal) => signal.signal === name)?.value ?? null;
  const bookingValue = nullableBoolean(legacyCapabilities.online_booking ?? legacyCapabilities.appointment_system ?? legacySignalValue("has_online_booking"), "website_capabilities.online_booking");
  const contactFormValue = nullableBoolean(legacyContact.contact_form ?? legacyCapabilities.contact_form ?? legacySignalValue("has_contact_form"), "contact.contact_form");
  const onlinePaymentValue = nullableBoolean(legacyCapabilities.online_payment ?? legacySignalValue("has_online_payment"), "website_capabilities.online_payment");
  const ecommerceValue = nullableBoolean(legacyProducts.ecommerce_detected ?? legacyCapabilities.ecommerce ?? legacySignalValue("has_ecommerce"), "products.ecommerce_detected");
  const searchValue = nullableBoolean(legacyCapabilities.search, "website_capabilities.search");
  const pricingValue = nullableBoolean(legacyProducts.pricing_detected ?? legacyCapabilities.pricing_page, "products.pricing_detected");

  const services = analysis.services.map((service, index) => {
    const field = statusFieldFromEvidence(service.name, `offerings.services.${index}.name`, evidence);
    return {
      name: statusValue(field) ?? "Unknown service",
      description: legacyEvidenceBackedValue(
        service.description,
        [`services.${index}.description`],
        evidence,
      ),
      status: field.status,
      confidence: field.confidence,
      evidence_ids: field.evidence_ids,
    };
  });
  const productItems = analysis.products.items.map((product, index) => {
    const field = statusFieldFromEvidence(product.name, `offerings.products.${index}.name`, evidence);
    return {
      name: statusValue(field) ?? "Unknown product",
      description: legacyEvidenceBackedValue(
        product.description,
        [`products.items.${index}.description`],
        evidence,
      ),
      status: field.status,
      confidence: field.confidence,
      evidence_ids: field.evidence_ids,
    };
  });
  const signals = legacySignals.map((signal) => {
    const legacyValue = signal.signal === "has_online_booking" ? bookingValue
      : signal.signal === "has_contact_form" ? contactFormValue
        : signal.signal === "has_online_payment" ? onlinePaymentValue
          : signal.signal === "has_ecommerce" ? ecommerceValue
            : signal.signal === "appears_b2b" ? legacyCompany.customer_type === "B2B"
              : signal.signal === "appears_b2c" ? legacyCompany.customer_type === "B2C"
                : signal.value;
    const field = statusFieldFromEvidence(legacyValue, `signals.${signal.signal}`, evidence, signal.confidence);
    return {
      id: `sig_${signal.signal}`,
      type: signal.signal,
      value: statusValue(field),
      status: field.status,
      confidence: field.confidence,
      evidence_ids: field.evidence_ids,
    };
  });
  const signalValue = (name: string): boolean | null => {
    const signal = signals.find((item) => item.type === name);
    return signal?.status === "UNKNOWN" ? null : signal?.value ?? null;
  };

  return {
    ...analysis,
    identity: {
      company_name: companyName,
      legal_name: legalName,
      description,
      industry,
      sub_industry: subIndustry,
      business_model: businessModel,
      business_type: businessType,
      country,
      city,
      address,
      postal_code: postalCode,
      target_market: targetMarket,
    },
    market: {
      ...analysis.market,
      languages: [],
      target_audience: statusValue(targetMarket) ? [statusValue(targetMarket)!] : [],
      geographic_markets: [statusValue(city), statusValue(country)].filter((value): value is string => value !== null),
      company_size_focus: [],
    },
    offerings: {
      ...analysis.offerings,
      services,
      products: productItems,
      categories: legacyEvidenceBackedArray(analysis.products.categories, "products.categories", evidence),
    },
    commercial: {
      ...analysis.commercial,
      has_pricing: statusFieldFromEvidence(pricingValue, "commercial.has_pricing", evidence),
    },
    conversion_signals: {
      ...analysis.conversion_signals,
      has_contact_form: statusFieldFromEvidence(contactFormValue, "conversion_signals.has_contact_form", evidence),
      has_booking: statusFieldFromEvidence(bookingValue, "conversion_signals.has_booking", evidence),
      has_newsletter: statusFieldFromEvidence(
        nullableBoolean(legacyCapabilities.newsletter, "website_capabilities.newsletter"),
        "conversion_signals.has_newsletter", evidence,
      ),
      has_login: statusFieldFromEvidence(
        nullableBoolean(legacyCapabilities.customer_login, "website_capabilities.customer_login"),
        "conversion_signals.has_login", evidence,
      ),
    },
    digital_capabilities: {
      ...analysis.digital_capabilities,
      ecommerce: statusFieldFromEvidence(ecommerceValue, "digital_capabilities.ecommerce", evidence),
      online_payment: statusFieldFromEvidence(onlinePaymentValue, "digital_capabilities.online_payment", evidence),
      booking_system: statusFieldFromEvidence(bookingValue, "digital_capabilities.booking_system", evidence),
      search: statusFieldFromEvidence(searchValue, "digital_capabilities.search", evidence),
    },
    contact: {
      ...analysis.contact,
      emails: legacyEvidenceBackedValue(legacyContact.email, ["contact.email"], evidence)
        ? [legacyEvidenceBackedValue(legacyContact.email, ["contact.email"], evidence)!]
        : [],
      phones: legacyEvidenceBackedValue(legacyContact.phone, ["contact.phone"], evidence)
        ? [legacyEvidenceBackedValue(legacyContact.phone, ["contact.phone"], evidence)!]
        : [],
      addresses: statusValue(address) ? [statusValue(address)!] : [],
      contact_urls: legacyEvidenceBackedValue(legacyContact.contact_page, ["contact.contact_page"], evidence)
        ? [legacyEvidenceBackedValue(legacyContact.contact_page, ["contact.contact_page"], evidence)!]
        : [],
    },
    social: {
      linkedin: legacyEvidenceBackedValue(nullableSocialUrl(legacySocial.linkedin, "linkedin"), ["social_media.linkedin"], evidence),
      facebook: legacyEvidenceBackedValue(nullableSocialUrl(legacySocial.facebook, "facebook"), ["social_media.facebook"], evidence),
      instagram: legacyEvidenceBackedValue(nullableSocialUrl(legacySocial.instagram, "instagram"), ["social_media.instagram"], evidence),
      x: legacyEvidenceBackedValue(nullableSocialUrl(legacySocial.x, "x"), ["social_media.x"], evidence),
      youtube: legacyEvidenceBackedValue(nullableSocialUrl(legacySocial.youtube, "youtube"), ["social_media.youtube"], evidence),
      github: null,
      other: legacyEvidenceBackedArray(
        safeStringArray(legacySocial.other_social_links ?? [], "social_media.other_social_links", 20),
        "social_media.other_social_links",
        evidence,
      ),
    },
    qualification: {
      ...analysis.qualification,
      b2b: signalValue("appears_b2b") ?? (businessModel.status !== "UNKNOWN" ? businessModel.value === "B2B" : null),
      b2c: signalValue("appears_b2c") ?? (businessModel.status !== "UNKNOWN" ? businessModel.value === "B2C" : null),
    },
    signals,
  };
}

function mergeQualificationSignals(
  canonicalSignals: BusinessAnalysis["signals"],
  legacySignals: unknown,
  evidence: BusinessAnalysis["evidence"],
): BusinessAnalysis["signals"] {
  if (!Array.isArray(legacySignals)) return canonicalSignals;
  const merged = [...canonicalSignals];
  const existingTypes = new Set(merged.map((signal) => signal.type));
  for (const [index, item] of legacySignals.slice(0, 50).entries()) {
    if (!isRecord(item)) continue;
    const type = typeof item.signal === "string" ? item.signal.trim().slice(0, 100) : "";
    if (!type || existingTypes.has(type)) continue;
    const requestedValue = item.value === null || typeof item.value === "boolean" ? item.value : null;
    const requestedUrls = new Set(Array.isArray(item.evidence)
      ? item.evidence.flatMap((entry) => isRecord(entry) && typeof entry.url === "string" ? [entry.url] : [])
      : []);
    const matchingEvidence = supportingEvidence(evidence, `signals.${type}`)
      .filter((entry) => requestedUrls.has(entry.source_url ?? entry.url ?? ""));
    const linked = statusFieldFromEvidence(
      requestedValue,
      `signals.${type}`,
      matchingEvidence,
      item.confidence,
    );
    merged.push({
      id: typeof item.id === "string" && item.id ? item.id.slice(0, 100) : `sig_legacy_${index + 1}`,
      type,
      value: statusValue(linked),
      status: linked.status,
      confidence: linked.confidence,
      evidence_ids: linked.evidence_ids,
    });
    existingTypes.add(type);
  }
  return merged;
}

function deriveLegacyCompatibility(analysis: BusinessAnalysis, pagesAnalyzed: number): BusinessAnalysis {
  const identity = analysis.identity;
  const booking = statusValue(analysis.digital_capabilities.booking_system);
  const contactForm = statusValue(analysis.conversion_signals.has_contact_form);
  const onlinePayment = statusValue(analysis.digital_capabilities.online_payment);
  const ecommerce = statusValue(analysis.digital_capabilities.ecommerce);
  const newsletter = statusValue(analysis.conversion_signals.has_newsletter);
  const customerLogin = statusValue(analysis.conversion_signals.has_login);
  const pricingPage = statusValue(analysis.commercial.has_pricing);
  const search = statusValue(analysis.digital_capabilities.search);
  const signalValues = new Map(analysis.signals.map((signal) => [signal.type, statusValue(signal)]));
  const signals = new Map<string, QualificationSignal>();
  const evidenceById = new Map(analysis.evidence.flatMap((item) => item.id ? [[item.id, item] as const] : []));
  const appendSignal = (name: string, field: StatusField<boolean | null>) => {
    if (signals.has(name)) return;
    const evidence = field.evidence_ids.flatMap((id) => {
      const item = evidenceById.get(id);
      return item?.source_url || item?.url
        ? [{ url: item.source_url ?? item.url ?? "", reason: item.quote ?? item.excerpt ?? "" }]
        : [];
    });
    signals.set(name, {
      signal: name,
      value: statusValue(field),
      confidence: field.confidence,
      evidence,
    });
  };

  for (const signal of analysis.signals) {
    appendSignal(signal.type, signal);
  }
  appendSignal("has_online_booking", analysis.digital_capabilities.booking_system);
  appendSignal("has_contact_form", analysis.conversion_signals.has_contact_form);
  appendSignal("has_online_payment", analysis.digital_capabilities.online_payment);
  appendSignal("has_ecommerce", analysis.digital_capabilities.ecommerce);

  const companyName = statusValue(identity.company_name);
  const legalName = statusValue(identity.legal_name);
  const description = statusValue(identity.description);
  const industry = statusValue(identity.industry);
  const businessType = statusValue(identity.business_type);
  const businessModel = statusValue(identity.business_model);
  const customerType = businessModel === "B2B" || businessModel === "B2C" || businessModel === "Both"
    ? businessModel
    : signalValues.get("appears_b2b") === true
      ? "B2B"
      : signalValues.get("appears_b2c") === true
        ? "B2C"
        : null;
  const evidenceLegacy = analysis.evidence.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    field: item.field,
    kind: item.status === "INFERENCE" || item.kind === "inference" ? "inference" as const : "fact" as const,
    url: item.source_url ?? item.url ?? "",
    excerpt: item.quote ?? item.excerpt ?? "",
    confidence: item.confidence,
    status: item.status ?? (item.kind === "inference" ? "INFERENCE" as const : "FACT" as const),
    quote: item.quote ?? item.excerpt ?? "",
    source_url: item.source_url ?? item.url ?? "",
    source_page_type: item.source_page_type ?? "unknown",
    reason: item.reason ?? "",
  }));
  const confidenceByField = { ...analysis.confidence_by_field };
  for (const item of analysis.evidence) {
    if (item.confidence !== null) confidenceByField[item.field] = item.confidence;
  }
  const verifiedServices = analysis.offerings.services.filter((item) => item.status !== "UNKNOWN");
  const verifiedProducts = analysis.offerings.products.filter((item) => item.status !== "UNKNOWN");

  return {
    ...analysis,
    offerings: {
      ...analysis.offerings,
      services: verifiedServices,
      products: verifiedProducts,
    },
    request: { ...analysis.request, pages_analyzed: pagesAnalyzed },
    analysis_quality: deriveAnalysisQuality(analysis, pagesAnalyzed),
    company: {
      ...analysis.company,
      company_name: companyName,
      legal_name: legalName,
      description,
      industry,
      sub_industry: statusValue(identity.sub_industry),
      business_type: businessType,
      country: statusValue(identity.country),
      city: statusValue(identity.city),
      postal_code: statusValue(identity.postal_code),
      target_market: statusValue(identity.target_market),
      languages: analysis.market.languages,
      customer_type: customerType,
      address: statusValue(identity.address) ?? analysis.contact.addresses[0] ?? null,
    },
    contact_legacy: {
      ...analysis.contact_legacy,
      email: analysis.contact.emails[0] ?? null,
      phone: analysis.contact.phones[0] ?? null,
      whatsapp: null,
      contact_page: analysis.contact.contact_urls[0] ?? null,
      contact_form: contactForm,
    },
    services: verifiedServices.map(({ name, description: serviceDescription }) => ({ name, description: serviceDescription })),
    products: {
      items: verifiedProducts.map(({ name, description: productDescription }) => ({ name, description: productDescription })),
      categories: analysis.offerings.categories,
      pricing_detected: pricingPage,
      ecommerce_detected: ecommerce,
    },
    social_media: {
      linkedin: analysis.social.linkedin,
      facebook: analysis.social.facebook,
      instagram: analysis.social.instagram,
      youtube: analysis.social.youtube,
      tiktok: null,
      x: analysis.social.x,
      other_social_links: analysis.social.other,
    },
    website_capabilities: {
      online_booking: booking,
      appointment_system: booking,
      ecommerce,
      online_payment: onlinePayment,
      contact_form: contactForm,
      whatsapp: signalValues.get("has_whatsapp") ?? null,
      live_chat: null,
      newsletter,
      customer_login: customerLogin,
      multilingual_support: signalValues.get("has_multilingual_site") ?? null,
      ssl: null,
      search,
      blog: null,
      pricing_page: pricingPage,
      mobile_friendly: signalValues.get("has_mobile_optimization") ?? null,
    },
    qualification: {
      ...analysis.qualification,
      b2b: signalValues.get("appears_b2b") ?? (
        identity.business_model.status !== "UNKNOWN"
          ? identity.business_model.value === "B2B" || identity.business_model.value === "Both"
          : null
      ),
      b2c: signalValues.get("appears_b2c") ?? (
        identity.business_model.status !== "UNKNOWN"
          ? identity.business_model.value === "B2C" || identity.business_model.value === "Both"
          : null
      ),
      b2b2c: signalValues.get("appears_b2b2c") ?? (
        identity.business_model.status !== "UNKNOWN" ? identity.business_model.value === "Both" : null
      ),
    },
    qualification_signals: [...signals.values()],
    evidence_legacy: evidenceLegacy,
    confidence_by_field: confidenceByField,
  };
}

function safeStringArray(value: unknown, field: string, maxItems = 40): string[] {
  return Array.isArray(value) ? stringArray(value, field, maxItems) : [];
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`Invalid ${field}`);
  return value;
}

function normalizeEvidenceText(value: string): string {
  const decoded = value.replace(/&(#(?:x[\da-f]+|\d+)|amp|lt|gt|quot|apos|nbsp);/gi, (entity, name: string) => {
    if (name[0] === "#") {
      const codePoint = name[1]?.toLowerCase() === "x"
        ? Number.parseInt(name.slice(2), 16)
        : Number.parseInt(name.slice(1), 10);
      return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : entity;
    }
    const namedEntities: Record<string, string> = {
      amp: "&",
      apos: "'",
      gt: ">",
      lt: "<",
      nbsp: " ",
      quot: '"',
    };
    return namedEntities[name.toLowerCase()] ?? entity;
  });
  return decoded.toLowerCase().replace(/\s+/g, " ").trim();
}

function evidenceMatchesSource(pageText: string, excerpt: string): boolean {
  const normalizedExcerpt = normalizeEvidenceText(excerpt);
  return normalizedExcerpt.length > 0 && normalizeEvidenceText(pageText).includes(normalizedExcerpt);
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
  const subIndustry = isRecord(identity.sub_industry) ? identity.sub_industry.value : null;
  const businessType = isRecord(identity.business_type) ? identity.business_type.value : null;
  const country = isRecord(identity.country) ? identity.country.value : null;
  const city = isRecord(identity.city) ? identity.city.value : null;
  const address = isRecord(identity.address) ? identity.address.value : null;
  const postalCode = isRecord(identity.postal_code) ? identity.postal_code.value : null;
  const targetMarket = isRecord(identity.target_market) ? identity.target_market.value : null;
  const businessModel = isRecord(identity.business_model) ? identity.business_model.value : null;

  return {
    company_name: nullableString(companyName, "company_name", 300),
    legal_name: nullableString(legalName, "legal_name", 300),
    description: nullableString(description, "description", 2000),
    industry: nullableString(industry, "industry", 200),
    sub_industry: nullableString(subIndustry, "sub_industry", 200),
    business_type: nullableString(businessType, "business_type", 120),
    country: nullableString(country, "country", 100),
    city: nullableString(city, "city", 100),
    address: nullableString(address, "address", 500),
    postal_code: nullableString(postalCode, "postal_code", 40),
    languages: [],
    target_market: nullableString(targetMarket, "target_market", 300),
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

    const normalizedEvidence: Evidence[] = evidence.slice(0, 120).flatMap((item, index) => {
      if (!isRecord(item) || (item.kind !== "fact" && item.kind !== "inference")) return [];
      if (typeof item.url !== "string" || typeof item.excerpt !== "string") return [];
      const url = item.url.trim().slice(0, 2048);
      const excerpt = item.excerpt.trim().slice(0, 500);
      const pageText = sourceTextByUrl.get(url);
      if (!url || pageText === undefined || !evidenceMatchesSource(pageText, excerpt)) return [];
      const field = typeof item.field === "string" ? item.field.trim().slice(0, 120) : "unknown";
      if (!field || !evidenceSupportsClaim(
        root,
        field,
        excerpt,
        item.kind === "inference" ? "INFERENCE" : "FACT",
        typeof item.reason === "string" ? item.reason : undefined,
      )) return [];
      if (item.confidence !== null && (typeof item.confidence !== "number"
        || !Number.isFinite(item.confidence) || item.confidence < 0 || item.confidence > 1)) return [];
      return [{
        id: typeof item.id === "string" && item.id.trim() ? item.id.trim().slice(0, 50) : `ev_${index + 1}`,
        field,
        kind: item.kind as EvidenceKind,
        status: item.kind === "fact" ? "FACT" as const : "INFERENCE" as const,
        url,
        excerpt,
        quote: excerpt,
        source_url: url,
        confidence: normalizeConfidence(item.confidence, "evidence.confidence", item.kind === "fact" ? "FACT" : "INFERENCE", 1),
      }];
    });

    const normalizedSignals: QualificationSignal[] = signals.slice(0, 50).map((item) => {
      const signal = record(item, "signal");
      if (!Array.isArray(signal.evidence)) throw new Error("Invalid signal evidence");
      const signalName = nullableString(signal.signal, "signal.name", 100) ?? "unknown";
      const signalValue = nullableBoolean(signal.value, "signal.value");
      const validEvidence = signal.evidence.slice(0, 20).flatMap((source) => {
        const sourceRecord = record(source, "signal evidence item");
        const url = nullableString(sourceRecord.url, "signal evidence.url", 2048);
        const reason = nullableString(sourceRecord.reason, "signal evidence.reason", 500) ?? "";
        const pageText = sourceTextByUrl.get(url ?? "") ?? "";
        if (!url || !sourceTextByUrl.has(url) || !reason
          || !evidenceSupportsClaim({ [signalName]: { value: signalValue } }, signalName, reason)
          || !evidenceSupportsClaim({ [signalName]: { value: signalValue } }, signalName, pageText)) return [];
        return [{ url, reason }];
      });
      const directEvidence = validEvidence.some(({ url, reason }) =>
        normalizeEvidenceText(sourceTextByUrl.get(url) ?? "").includes(normalizeEvidenceText(reason)));
      return {
        signal: signalName,
        value: validEvidence.length ? signalValue : null,
        confidence: normalizeConfidence(signal.confidence, "signal.confidence", validEvidence.length ? (directEvidence ? "FACT" : "INFERENCE") : "UNKNOWN", validEvidence.length),
        evidence: validEvidence,
      };
    });

    const confidenceMap = record(root.confidence_by_field, "confidence_by_field");
    const safeConfidenceMap: Record<string, number | null> = {};
    for (const [field, value] of Object.entries(confidenceMap).slice(0, 100)) {
      const matchingEvidence = normalizedEvidence.find((item) =>
        item.field === field || item.field.split(".").at(-1) === field.split(".").at(-1));
      safeConfidenceMap[field.slice(0, 120)] = normalizeConfidence(
        value,
        `confidence_by_field.${field}`,
        matchingEvidence?.kind === "fact" ? "FACT" : matchingEvidence ? "INFERENCE" : "UNKNOWN",
        matchingEvidence ? 1 : 0,
      );
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

    const legacyNormalized: BusinessAnalysis = {
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
        sub_industry: { value: nullableString(company.sub_industry, "sub_industry", 200), status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        business_model: { value: null, status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        business_type: { value: nullableString(company.business_type, "business_type", 120), status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        country: { value: nullableString(company.country, "country", 100), status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        city: { value: nullableString(company.city, "city", 100), status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        address: { value: nullableString(company.address, "address", 500), status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        postal_code: { value: nullableString(company.postal_code, "postal_code", 40), status: "UNKNOWN", confidence: 0, evidence_ids: [] },
        target_market: { value: nullableString(company.target_market, "target_market", 300), status: "UNKNOWN", confidence: 0, evidence_ids: [] },
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
        linkedin: nullableSocialUrl(social.linkedin, "linkedin"),
        facebook: nullableSocialUrl(social.facebook, "facebook"),
        instagram: nullableSocialUrl(social.instagram, "instagram"),
        youtube: nullableSocialUrl(social.youtube, "youtube"),
        tiktok: nullableSocialUrl(social.tiktok, "tiktok"),
        x: nullableSocialUrl(social.x, "x"),
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
        mobile_friendly: normalizedEvidence.some((item) => item.field.split(".").at(-1) === "mobile_friendly")
          ? nullableBoolean(capabilities.mobile_friendly, "mobile_friendly")
          : null,
        search: nullableBoolean(capabilities.search, "search"),
        blog: nullableBoolean(capabilities.blog, "blog"),
        pricing_page: nullableBoolean(capabilities.pricing_page, "pricing_page"),
      },
      qualification_signals: normalizedSignals,
      evidence_legacy: normalizedEvidence,
      confidence_by_field: safeConfidenceMap,
    };
    const canonical = canonicalizeLegacyInput(
      legacyNormalized,
      company,
      contact,
      products,
      social,
      capabilities,
      normalizedEvidence,
      normalizedSignals,
      confidenceMap,
    );
    const pagesAnalyzed = sourceTextByUrl.size;
    const linkedCanonical = normalizeLinkedClaims(canonical, normalizedEvidence) as BusinessAnalysis;
    return deriveLegacyCompatibility(linkedCanonical, pagesAnalyzed);
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
  let droppedOfferingItems = 0;
  let repairedSignalConfidence = 0;
  const normalizeOfferingItems = (value: unknown, collection: "services" | "products") => {
    if (!Array.isArray(value)) return [];
    return value.slice(0, 20).flatMap((item) => {
      try {
        if (!isRecord(item)) throw new Error("Offering item must be an object");
        const name = nullableString(item.name, `offerings.${collection}.name`, 200);
        if (!name || /^unknown(?:\s+(?:service|product))?$/i.test(name)) {
          throw new Error("Offering item must have a verified name");
        }
        const description = nullableString(item.description, `offerings.${collection}.description`, 1000);
        const status = analyzeStatus(item.status);
        const itemConfidence = confidence(item.confidence, `offerings.${collection}.confidence`) ?? 0;
        const evidenceIds = Array.isArray(item.evidence_ids)
          ? item.evidence_ids.map((id) => String(id)).slice(0, 20)
          : [];
        return [{ name, description, status, confidence: itemConfidence, evidence_ids: evidenceIds }];
      } catch {
        droppedOfferingItems += 1;
        return [];
      }
    });
  };
  const normalizedEvidence: BusinessAnalysis["evidence"] = Array.isArray(root.evidence)
    ? root.evidence.slice(0, 120).flatMap((item) => {
      try {
        const evidenceItem = record(item, "evidence.item");
      const sourceUrl = nullableString(evidenceItem.source_url ?? null, "evidence.source_url", 2048);
      const quote = nullableString(evidenceItem.quote ?? null, "evidence.quote", 500) ?? "";
      const field = nullableString(evidenceItem.field ?? null, "evidence.field", 120) ?? "unknown";
      const status = analyzeStatus(evidenceItem.status ?? evidenceItem.kind ?? "UNKNOWN");
      const pageText = sourceTextByUrl.get(sourceUrl ?? "") ?? "";
      const id = nullableString(evidenceItem.id ?? null, "evidence.id", 50);
      if (!id || status === "UNKNOWN" || !sourceUrl || !sourceTextByUrl.has(sourceUrl) || !quote
        || !evidenceMatchesSource(pageText, quote)
        || !evidenceSupportsClaim(root, field, quote, status,
          typeof evidenceItem.reason === "string" ? evidenceItem.reason : undefined)) return [];
      return [{
        id,
        field,
        status,
        confidence: normalizeConfidence(evidenceItem.confidence, "evidence.confidence", status, 1),
        quote,
        excerpt: quote,
        source_url: sourceUrl,
        source_page_type: nullableString(evidenceItem.source_page_type ?? null, "evidence.source_page_type", 100) ?? "unknown",
        reason: nullableString(evidenceItem.reason ?? null, "evidence.reason", 500) ?? "",
      }];
      } catch {
        return [];
      }
    })
    : [];

  const team: BusinessAnalysis = {
    schema_version: nullableString(root.schema_version, "schema_version", 20) ?? "1.0",
    request: {
      input_url: nullableString(request.input_url ?? null, "request.input_url", 2048) ?? "",
      canonical_url: nullableString(request.canonical_url ?? null, "request.canonical_url", 2048) ?? "",
      domain: nullableString(request.domain ?? null, "request.domain", 300) ?? "",
      analyzed_at: nullableString(request.analyzed_at ?? null, "request.analyzed_at", 100) ?? new Date().toISOString(),
      pages_analyzed: Number.isFinite(Number(request.pages_analyzed)) ? Number(request.pages_analyzed) : 0,
      analysis_duration_ms: Number.isFinite(Number(request.analysis_duration_ms)) ? Number(request.analysis_duration_ms) : 0,
    },
    identity: {
      company_name: statusField(identity.company_name, "identity.company_name"),
      legal_name: statusField(identity.legal_name, "identity.legal_name"),
      description: statusField(identity.description, "identity.description"),
      industry: statusField(identity.industry, "identity.industry"),
      sub_industry: statusField(identity.sub_industry, "identity.sub_industry"),
      business_model: statusField(identity.business_model, "identity.business_model"),
      business_type: statusField(identity.business_type, "identity.business_type"),
      country: statusField(identity.country, "identity.country"),
      city: statusField(identity.city, "identity.city"),
      address: statusField(identity.address, "identity.address"),
      postal_code: statusField(identity.postal_code, "identity.postal_code"),
      target_market: statusField(identity.target_market, "identity.target_market"),
    },
    market: {
      customer_segments: evidenceBackedArray(root, safeStringArray(market.customer_segments, "market.customer_segments", 20), "market.customer_segments", normalizedEvidence),
      target_audience: evidenceBackedArray(root, safeStringArray(market.target_audience, "market.target_audience", 20), "market.target_audience", normalizedEvidence),
      geographic_markets: evidenceBackedArray(root, safeStringArray(market.geographic_markets, "market.geographic_markets", 20), "market.geographic_markets", normalizedEvidence),
      languages: evidenceBackedArray(root, safeStringArray(market.languages, "market.languages", 20), "market.languages", normalizedEvidence),
      industries_served: evidenceBackedArray(root, safeStringArray(market.industries_served, "market.industries_served", 20), "market.industries_served", normalizedEvidence),
      company_size_focus: evidenceBackedArray(root, safeStringArray(market.company_size_focus, "market.company_size_focus", 20), "market.company_size_focus", normalizedEvidence),
    },
    offerings: {
      services: normalizeOfferingItems(offerings.services, "services"),
      products: normalizeOfferingItems(offerings.products, "products"),
      solutions: evidenceBackedArray(root, safeStringArray(offerings.solutions, "offerings.solutions", 20), "offerings.solutions", normalizedEvidence),
      categories: evidenceBackedArray(root, safeStringArray(offerings.categories, "offerings.categories", 20), "offerings.categories", normalizedEvidence),
      primary_offerings: evidenceBackedArray(root, safeStringArray(offerings.primary_offerings, "offerings.primary_offerings", 20), "offerings.primary_offerings", normalizedEvidence),
    },
    commercial: {
      has_pricing: statusField(commercial.has_pricing, "commercial.has_pricing"),
      pricing_model: evidenceBackedArray(root, safeStringArray(commercial.pricing_model, "commercial.pricing_model", 20), "commercial.pricing_model", normalizedEvidence),
      price_range: evidenceBackedValue(root, nullableString(commercial.price_range ?? null, "commercial.price_range", 200), "commercial.price_range", normalizedEvidence),
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
      integrations: evidenceBackedArray(root, safeStringArray(digitalCapabilities.integrations, "digital_capabilities.integrations", 20), "digital_capabilities.integrations", normalizedEvidence),
      technologies_detected: evidenceBackedArray(root, safeStringArray(digitalCapabilities.technologies_detected, "digital_capabilities.technologies_detected", 20), "digital_capabilities.technologies_detected", normalizedEvidence),
    },
    contact: {
      emails: evidenceBackedArray(root, safeStringArray(contactRoot.emails ?? [], "contact.emails", 20), "contact.emails", normalizedEvidence),
      phones: evidenceBackedArray(root, safeStringArray(contactRoot.phones ?? [], "contact.phones", 20), "contact.phones", normalizedEvidence),
      addresses: evidenceBackedArray(root, safeStringArray(contactRoot.addresses ?? [], "contact.addresses", 20), "contact.addresses", normalizedEvidence),
      contact_urls: evidenceBackedArray(root, safeStringArray(contactRoot.contact_urls ?? [], "contact.contact_urls", 20), "contact.contact_urls", normalizedEvidence),
      sales_urls: evidenceBackedArray(root, safeStringArray(contactRoot.sales_urls ?? [], "contact.sales_urls", 20), "contact.sales_urls", normalizedEvidence),
      support_urls: evidenceBackedArray(root, safeStringArray(contactRoot.support_urls ?? [], "contact.support_urls", 20), "contact.support_urls", normalizedEvidence),
    },
    social: {
      linkedin: evidenceBackedValue(root, nullableSocialUrl(social.linkedin, "linkedin"), "social.linkedin", normalizedEvidence),
      facebook: evidenceBackedValue(root, nullableSocialUrl(social.facebook, "facebook"), "social.facebook", normalizedEvidence),
      instagram: evidenceBackedValue(root, nullableSocialUrl(social.instagram, "instagram"), "social.instagram", normalizedEvidence),
      x: evidenceBackedValue(root, nullableSocialUrl(social.x, "x"), "social.x", normalizedEvidence),
      youtube: evidenceBackedValue(root, nullableSocialUrl(social.youtube, "youtube"), "social.youtube", normalizedEvidence),
      github: evidenceBackedValue(root, nullableSocialUrl(social.github, "github"), "social.github", normalizedEvidence),
      other: evidenceBackedArray(root, safeStringArray(social.other ?? [], "social.other", 20), "social.other", normalizedEvidence),
    },
    qualification: {
      b2b: evidenceBackedValue(root, typeof qualification.b2b === "boolean" ? qualification.b2b : null, "qualification.b2b", normalizedEvidence),
      b2c: evidenceBackedValue(root, typeof qualification.b2c === "boolean" ? qualification.b2c : null, "qualification.b2c", normalizedEvidence),
      b2b2c: evidenceBackedValue(root, typeof qualification.b2b2c === "boolean" ? qualification.b2b2c : null, "qualification.b2b2c", normalizedEvidence),
      enterprise_focus: evidenceBackedValue(root, typeof qualification.enterprise_focus === "boolean" ? qualification.enterprise_focus : null, "qualification.enterprise_focus", normalizedEvidence),
      smb_focus: evidenceBackedValue(root, typeof qualification.smb_focus === "boolean" ? qualification.smb_focus : null, "qualification.smb_focus", normalizedEvidence),
      lead_capture: evidenceBackedValue(root, typeof qualification.lead_capture === "boolean" ? qualification.lead_capture : null, "qualification.lead_capture", normalizedEvidence),
      sales_led: evidenceBackedValue(root, typeof qualification.sales_led === "boolean" ? qualification.sales_led : null, "qualification.sales_led", normalizedEvidence),
      self_service: evidenceBackedValue(root, typeof qualification.self_service === "boolean" ? qualification.self_service : null, "qualification.self_service", normalizedEvidence),
      recurring_revenue_signal: evidenceBackedValue(root, typeof qualification.recurring_revenue_signal === "boolean" ? qualification.recurring_revenue_signal : null, "qualification.recurring_revenue_signal", normalizedEvidence),
      transactional_revenue_signal: evidenceBackedValue(root, typeof qualification.transactional_revenue_signal === "boolean" ? qualification.transactional_revenue_signal : null, "qualification.transactional_revenue_signal", normalizedEvidence),
      business_maturity: evidenceBackedValue(root, nullableString(qualification.business_maturity ?? null, "qualification.business_maturity", 100), "qualification.business_maturity", normalizedEvidence),
    },
    signals: Array.isArray(root.signals) ? root.signals.slice(0, 40).map((item) => {
      const signal = record(item, "signals.item");
      const id = nullableString(signal.id ?? null, "signals.id", 100) ?? `sig_${Math.random().toString(36).slice(2, 8)}`;
      const requestedStatus = signal.status === "FACT" || signal.status === "INFERENCE" || signal.status === "UNKNOWN" ? signal.status : "UNKNOWN";
      const requestedEvidenceIds = Array.isArray(signal.evidence_ids) ? signal.evidence_ids.map((entry) => String(entry)).slice(0, 20) : [];
      const field = nullableString(signal.type ?? null, "signals.type", 100) ?? "unknown";
      const validEvidenceIds = requestedEvidenceIds.filter((evidenceId) => normalizedEvidence.some((entry) =>
        entry.id === evidenceId && evidenceFieldsForCanonicalPath(`signals.${field}`).includes(entry.field)));
      const normalizedStatus = validEvidenceIds.length ? requestedStatus : "UNKNOWN";
      const signalEvidence = normalizedEvidence.filter((entry) =>
        entry.id && validEvidenceIds.includes(entry.id)
        && evidenceFieldsForCanonicalPath(`signals.${field}`).includes(entry.field));
      let declaredConfidence: number | null = 0;
      if (normalizedStatus !== "UNKNOWN") try {
        declaredConfidence = confidence(signal.confidence, "signals.confidence");
      } catch {
        declaredConfidence = null;
        repairedSignalConfidence += 1;
      }
      const evidenceConfidence = signalEvidence.length
        ? signalEvidence.reduce((total, entry) => total + (entry.confidence ?? 0), 0) / signalEvidence.length
        : 0;
      return {
        id,
        type: field,
        value: normalizedStatus === "UNKNOWN" || (signal.value !== null && typeof signal.value !== "boolean") ? null : signal.value,
        status: normalizedStatus,
        confidence: normalizeConfidence(
          declaredConfidence ?? evidenceConfidence,
          "signals.confidence",
          normalizedStatus,
          validEvidenceIds.length,
        ),
        evidence_ids: validEvidenceIds,
      };
    }) : [],
    evidence: normalizedEvidence,
    unknowns: Array.isArray(root.unknowns) ? root.unknowns.slice(0, 50).map((item) => {
      const unknownItem = record(item, "unknowns.item");
      return {
        field: nullableString(unknownItem.field, "unknowns.field", 200) ?? "unknown",
        reason: nullableString(unknownItem.reason, "unknowns.reason", 500) ?? "",
      };
    }) : [],
    analysis_quality: {
      overall_confidence: Math.min(confidence(analysisQuality.overall_confidence ?? null, "analysis_quality.overall_confidence") ?? 0, 0.98),
      coverage_score: confidence(analysisQuality.coverage_score ?? null, "analysis_quality.coverage_score") ?? 0,
      evidence_coverage: confidence(analysisQuality.evidence_coverage ?? null, "analysis_quality.evidence_coverage") ?? 0,
      pages_successfully_read: Number.isFinite(Number(analysisQuality.pages_successfully_read)) ? Number(analysisQuality.pages_successfully_read) : 0,
      pages_failed: Number.isFinite(Number(analysisQuality.pages_failed)) ? Number(analysisQuality.pages_failed) : 0,
      warnings: [
        ...(Array.isArray(analysisQuality.warnings) ? analysisQuality.warnings.map((warning) => String(warning)) : []),
        ...(droppedOfferingItems
          ? [`${droppedOfferingItems} malformed offering item${droppedOfferingItems === 1 ? " was" : "s were"} discarded.`]
          : []),
        ...(repairedSignalConfidence
          ? [`${repairedSignalConfidence} signal confidence value${repairedSignalConfidence === 1 ? " was" : "s were"} replaced with confidence derived from verified evidence.`]
          : []),
      ].slice(0, 20),
    },
    usage: {
      model: nullableString(usage.model ?? null, "usage.model", 100) ?? "gemini-3.1-flash-lite",
      input_tokens: Number.isFinite(Number(usage.input_tokens)) ? Number(usage.input_tokens) : 0,
      output_tokens: Number.isFinite(Number(usage.output_tokens)) ? Number(usage.output_tokens) : 0,
      estimated_ai_cost_usd: Number.isFinite(Number(usage.estimated_ai_cost_usd)) ? Number(usage.estimated_ai_cost_usd) : 0,
    },
    company: makeLegacyCompany(identity),
    contact_legacy: {
      email: nullableString(contactRoot.email ?? null, "contact.email", 320),
      phone: nullableString(contactRoot.phone ?? null, "contact.phone", 80),
      whatsapp: nullableString(contactRoot.whatsapp ?? null, "contact.whatsapp", 120),
      contact_page: nullableString(contactRoot.contact_page ?? null, "contact.contact_page", 2048),
      contact_form: nullableBoolean(contactRoot.contact_form ?? null, "contact.contact_form"),
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
      pricing_detected: nullableBoolean(productsRoot.pricing_detected ?? null, "pricing_detected"),
      ecommerce_detected: nullableBoolean(productsRoot.ecommerce_detected ?? null, "ecommerce_detected"),
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
      online_booking: nullableBoolean(websiteCapabilitiesRoot.online_booking ?? null, "online_booking"),
      appointment_system: nullableBoolean(websiteCapabilitiesRoot.appointment_system ?? null, "appointment_system"),
      ecommerce: nullableBoolean(websiteCapabilitiesRoot.ecommerce ?? null, "ecommerce"),
      online_payment: nullableBoolean(websiteCapabilitiesRoot.online_payment ?? null, "online_payment"),
      contact_form: nullableBoolean(websiteCapabilitiesRoot.contact_form ?? null, "contact_form"),
      whatsapp: nullableBoolean(websiteCapabilitiesRoot.whatsapp ?? null, "whatsapp"),
      live_chat: nullableBoolean(websiteCapabilitiesRoot.live_chat ?? null, "live_chat"),
      newsletter: nullableBoolean(websiteCapabilitiesRoot.newsletter ?? null, "newsletter"),
      customer_login: nullableBoolean(websiteCapabilitiesRoot.customer_login ?? null, "customer_login"),
      multilingual_support: nullableBoolean(websiteCapabilitiesRoot.multilingual_support ?? null, "multilingual_support"),
      ssl: nullableBoolean(websiteCapabilitiesRoot.ssl ?? null, "ssl"),
      mobile_friendly: normalizedEvidence.some((item) => item.field === "website_capabilities.mobile_friendly")
        ? nullableBoolean(websiteCapabilitiesRoot.mobile_friendly ?? null, "mobile_friendly")
        : null,
      search: nullableBoolean(websiteCapabilitiesRoot.search ?? null, "search"),
      blog: nullableBoolean(websiteCapabilitiesRoot.blog ?? null, "blog"),
      pricing_page: nullableBoolean(websiteCapabilitiesRoot.pricing_page ?? null, "pricing_page"),
    },
    qualification_signals: Array.isArray(root.qualification_signals) ? root.qualification_signals.slice(0, 50).map((item) => {
      const signal = record(item, "signal");
      const signalName = nullableString(signal.signal, "signal.name", 100) ?? "unknown";
      const signalValue = nullableBoolean(signal.value, "signal.value");
      const validEvidence = Array.isArray(signal.evidence) ? signal.evidence.slice(0, 20).flatMap((entry) => {
        const entryRecord = record(entry, "signal evidence item");
        const url = nullableString(entryRecord.url, "signal evidence.url", 2048);
        const reason = nullableString(entryRecord.reason, "signal evidence.reason", 500) ?? "";
        const pageText = sourceTextByUrl.get(url ?? "") ?? "";
        if (!url || !sourceTextByUrl.has(url) || !reason
          || !evidenceSupportsClaim({ [signalName]: { value: signalValue } }, signalName, reason)
          || !evidenceSupportsClaim({ [signalName]: { value: signalValue } }, signalName, pageText)) return [];
        return [{ url, reason }];
      }) : [];
      const directEvidence = validEvidence.some(({ url, reason }) =>
        normalizeEvidenceText(sourceTextByUrl.get(url) ?? "").includes(normalizeEvidenceText(reason)));
      return {
        signal: signalName,
        value: validEvidence.length ? signalValue : null,
        confidence: normalizeConfidence(signal.confidence, "signal.confidence", validEvidence.length ? (directEvidence ? "FACT" : "INFERENCE") : "UNKNOWN", validEvidence.length),
        evidence: validEvidence,
      };
    }) : [],
    evidence_legacy: normalizedEvidence.map((item) => ({
      field: item.field,
      kind: item.status === "INFERENCE" ? "inference" as const : "fact" as const,
      url: item.source_url ?? "",
      excerpt: item.quote ?? "",
      confidence: item.confidence,
    })),
    confidence_by_field: {},
  };

  const pagesAnalyzed = sourceTextByUrl.size;
  const teamWithCanonicalSignals: BusinessAnalysis = {
    ...team,
    signals: mergeQualificationSignals(team.signals, root.qualification_signals, normalizedEvidence),
  };
  const linkedCanonical = normalizeLinkedClaims(teamWithCanonicalSignals, team.evidence) as BusinessAnalysis;
  const canonical: BusinessAnalysis = {
    ...linkedCanonical,
    offerings: {
      ...linkedCanonical.offerings,
      services: linkedCanonical.offerings.services.flatMap((item, index) => {
        if (item.status === "UNKNOWN") return [];
        return [{
          ...item,
          description: hasEvidenceForPath(root, normalizedEvidence, `offerings.services.${index}.description`)
            ? item.description
            : null,
        }];
      }),
      products: linkedCanonical.offerings.products.flatMap((item, index) => {
        if (item.status === "UNKNOWN") return [];
        return [{
          ...item,
          description: hasEvidenceForPath(root, normalizedEvidence, `offerings.products.${index}.description`)
            ? item.description
            : null,
        }];
      }),
    },
  };
  return deriveLegacyCompatibility(canonical, pagesAnalyzed);
}