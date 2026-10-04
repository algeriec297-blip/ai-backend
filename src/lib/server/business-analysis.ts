import * as cheerio from "cheerio";
import { appConfig } from "@/lib/shared/config";
import { ApiError } from "@/lib/shared/errors";
import { fetchSafeHtml } from "@/lib/server/url-safety";
import { analyzeWithGemini } from "@/lib/server/gemini";
import { validateBusinessAnalysis, type BusinessAnalysis, type Evidence } from "@/lib/shared/analysis-schema";

export interface AnalyzedWebsite {
  result: BusinessAnalysis;
  model: string;
  pagesAnalyzed: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

interface PageContent {
  url: string;
  title: string;
  description: string;
  siteName: string;
  structuredCompanyName: string;
  structuredLegalName: string;
  structuredDescription: string;
  structuredIndustry: string;
  metadataText: string;
  text: string;
  observations: {
    viewport_meta_detected: boolean;
    responsive_css_detected: boolean;
    form_detected: boolean;
    search_detected: boolean;
    booking_link_detected: boolean;
    whatsapp_link_detected: boolean;
    links: Array<{ url: string; label: string }>;
  };
}

const secondaryPageConcurrency = 3;

function pagePriority(pathname: string, label: string): number {
  const path = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  const content = `${path} ${label.toLowerCase()}`;
  if (/(?:^|\/)(?:events?|webinars?|news|press|careers?|jobs?)(?:\/|$)/.test(path)) return -1;
  if (/(?:^|\/)(?:features?|products?|platform)(?:\/|$)/.test(path)) return 1_000;
  if (/(?:^|\/)(?:pricing|plans?)(?:\/|$)/.test(path) || /\bpricing\b/.test(content)) return 950;
  if (/(?:^|\/)(?:about|company)(?:\/|$)/.test(path) || /\babout (?:us|the company)\b/.test(content)) return 900;
  if (/(?:^|\/)(?:integrations?|developers?|api|docs?)(?:\/|$)/.test(path)) return 850;
  if (/(?:^|\/)(?:security|trust|compliance)(?:\/|$)/.test(path)) return 800;
  if (/(?:^|\/)(?:contact|sales|demo)(?:\/|$)/.test(path)) return 700;
  if (/(?:^|\/)(?:features?|products?|platform)(?:\/|$)/.test(path)) return 650;
  if (/(?:^|\/)(?:solutions?|industries|customers?)(?:\/|$)/.test(path)) return 450;
  if (/(?:^|\/)(?:services?)(?:\/|$)/.test(path)) return 400;
  return 0;
}

function linkPriority(url: string, label: string): number {
  const value = `${url} ${label}`.toLowerCase();
  if (/linkedin\.com|facebook\.com|instagram\.com|youtube\.com|youtu\.be|x\.com|twitter\.com|github\.com|tiktok\.com/.test(value)) return 100;
  if (/pricing|plans?|about|company|product|feature|platform|integration|developer|\/api|\/docs|security|contact|sales|demo|sign.?up|login|download|app store|google play/.test(value)) return 80;
  return 0;
}

function structuredOrganizationData($: cheerio.CheerioAPI): {
  companyName: string;
  legalName: string;
  description: string;
  industry: string;
  values: string[];
} {
  const result = { companyName: "", legalName: "", description: "", industry: "", values: [] as string[] };
  const relevantTypes = /organization|localbusiness|travelagency|lodgingbusiness|brand|website/i;
  const relevantKeys: Record<string, keyof Omit<typeof result, "values">> = {
    name: "companyName",
    legalname: "legalName",
    description: "description",
    industry: "industry",
  };
  let visited = 0;
  const visit = (value: unknown, depth: number): void => {
    if (depth > 8 || visited++ > 500) return;
    if (Array.isArray(value)) {
      value.slice(0, 50).forEach((item) => visit(item, depth + 1));
      return;
    }
    if (typeof value !== "object" || value === null) return;
    const item = value as Record<string, unknown>;
    const type = Array.isArray(item["@type"]) ? item["@type"].join(" ") : String(item["@type"] ?? "");
    if (relevantTypes.test(type)) {
      for (const [key, outputKey] of Object.entries(relevantKeys)) {
        const field = item[key] ?? item[Object.keys(item).find((candidate) => candidate.toLowerCase() === key) ?? ""];
        if (typeof field === "string" && field.trim()) {
          if (!result[outputKey]) result[outputKey] = field.trim().slice(0, 500);
          result.values.push(`${key}: ${field.trim().slice(0, 500)}`);
        }
      }
    }
    Object.values(item).forEach((entry) => visit(entry, depth + 1));
  };

  $("script[type='application/ld+json']").slice(0, 10).each((_index, element) => {
    const raw = $(element).text();
    if (raw.length > 250_000) return;
    try {
      visit(JSON.parse(raw) as unknown, 0);
    } catch {
      return;
    }
  });
  result.values = [...new Set(result.values)].slice(0, 20);
  return result;
}

export function extractPage(html: string, url: string): PageContent {
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim().slice(0, 300);
  const description = (
    $('meta[name="description"]').attr("content")
    ?? $('meta[property="og:description"]').attr("content")
    ?? $('meta[name="twitter:description"]').attr("content")
    ?? ""
  ).trim().slice(0, 500);
  const siteName = (
    $('meta[property="og:site_name"]').attr("content")
    ?? $('meta[name="application-name"]').attr("content")
    ?? ""
  ).trim().slice(0, 300);
  const socialTitle = (
    $('meta[property="og:title"]').attr("content")
    ?? $('meta[name="twitter:title"]').attr("content")
    ?? ""
  ).trim().slice(0, 300);
  const structuredData = structuredOrganizationData($);
  const metadataText = [
    siteName,
    socialTitle,
    structuredData.values.join("\n"),
  ].filter(Boolean).join("\n").slice(0, 6_000);
  const viewportMeta = Boolean($('meta[name="viewport"]').attr("content"));
  const responsiveCss = /@media\b|\b(?:max|min)-width\s*:/i.test($("style").text());
  const formDetected = $("form").length > 0;
  const searchDetected = Boolean($('input[type="search"], input[name*="search" i], form[action*="search" i]').length);
  const links = $("a[href]").toArray().flatMap((element) => {
    const href = $(element).attr("href");
    if (!href) return [];
    try {
      const link = new URL(href, url);
      if (!["http:", "https:"].includes(link.protocol)) return [];
      return [{ url: link.toString().slice(0, 2048), label: $(element).text().replace(/\s+/g, " ").trim().slice(0, 120) }];
    } catch {
      return [];
    }
  }).sort((left, right) => linkPriority(right.url, right.label) - linkPriority(left.url, left.label))
    .slice(0, 80);
  const bookingLinkDetected = links.some(({ url: link }) => /book|booking|appointment|schedule/i.test(link));
  const whatsappLinkDetected = links.some(({ url: link }) => /wa\.me|whatsapp\.com/i.test(link));
  $("script, style, noscript, svg, iframe, nav, [role='navigation'], footer, [role='contentinfo']").remove();
  const blockText = $("h1, h2, h3, p, li, a, button, label").toArray()
    .map((element) => $(element).text().replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ");
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const text = (blockText.length > bodyText.length ? blockText : bodyText).slice(0, 18_000);
  return {
    url,
    title,
    description,
    siteName,
    structuredCompanyName: structuredData.companyName,
    structuredLegalName: structuredData.legalName,
    structuredDescription: structuredData.description,
    structuredIndustry: structuredData.industry,
    metadataText,
    text,
    observations: {
      viewport_meta_detected: viewportMeta,
      responsive_css_detected: responsiveCss,
      form_detected: formDetected,
      search_detected: searchDetected,
      booking_link_detected: bookingLinkDetected,
      whatsapp_link_detected: whatsappLinkDetected,
      links,
    },
  };
}

function titleBrand(title: string): string | null {
  if (!/[:|–—]/.test(title)) return null;
  const candidate = title.split(/[:|–—]/, 1)[0]?.trim();
  if (!candidate || candidate.length > 80 || /^(home|homepage|welcome|official website)$/i.test(candidate)) return null;
  return candidate;
}

function fallbackIdentityEvidence(pages: PageContent[]): Array<{
  field: string;
  value: string;
  status: "FACT" | "INFERENCE";
  quote: string;
  sourceUrl: string;
  reason: string;
}> {
  const output: ReturnType<typeof fallbackIdentityEvidence> = [];
  const companyPage = pages.find((page) => page.siteName || page.structuredCompanyName || page.title) ?? pages[0];
  if (companyPage) {
    const companyName = companyPage.siteName || companyPage.structuredCompanyName || titleBrand(companyPage.title);
    if (companyName) output.push({
      field: "identity.company_name",
      value: companyName,
      status: "FACT",
      quote: companyPage.siteName || companyPage.structuredCompanyName || companyPage.title,
      sourceUrl: companyPage.url,
      reason: "The company or brand name is explicitly displayed in the page metadata or title.",
    });
  }
  const legalNamePage = pages.find((page) => page.structuredLegalName);
  if (legalNamePage?.structuredLegalName) output.push({
    field: "identity.legal_name",
    value: legalNamePage.structuredLegalName,
    status: "FACT",
    quote: legalNamePage.structuredLegalName,
    sourceUrl: legalNamePage.url,
    reason: "The legal entity name is explicitly provided in structured page metadata.",
  });
  const descriptionPage = pages.find((page) => page.description || page.structuredDescription);
  const description = descriptionPage?.description || descriptionPage?.structuredDescription;
  if (descriptionPage && description) output.push({
    field: "identity.description",
    value: description,
    status: "FACT",
    quote: description,
    sourceUrl: descriptionPage.url,
    reason: "This description is published in the page or structured metadata.",
  });

  const explicitIndustryPage = pages.find((page) => page.structuredIndustry);
  if (explicitIndustryPage?.structuredIndustry) output.push({
    field: "identity.industry",
    value: explicitIndustryPage.structuredIndustry,
    status: "FACT",
    quote: explicitIndustryPage.structuredIndustry,
    sourceUrl: explicitIndustryPage.url,
    reason: "The industry is explicitly stated in structured page metadata.",
  });
  const industryRules: Array<{ industry: string; pattern: RegExp }> = [
    { industry: "Workplace collaboration software", pattern: /(?:workplace collaboration|team communication|collaboration software|connect(?:ing)? teams)/i },
    { industry: "Workflow automation software", pattern: /(?:workflow automation|automating workflows|automate workflows)/i },
    { industry: "Travel and hospitality", pattern: /vacation rentals?|holiday rentals?|places to stay|accommodation|lodging|إيجارات العطلات|مكان إقامة|أماكن الإقامة|بيوت للإيجار|تجارب سفر/iu },
    { industry: "Financial technology", pattern: /payment processing|online payments?|financial technology|معالجة المدفوعات|المدفوعات الإلكترونية/iu },
    { industry: "E-commerce and retail", pattern: /online store|shop online|e-commerce|متجر إلكتروني|التسوق عبر الإنترنت/iu },
    { industry: "Appointment scheduling", pattern: /appointment scheduling|schedule appointments|احجز موعد|حجز المواعيد/iu },
  ];
  for (const { industry, pattern } of explicitIndustryPage ? [] : industryRules) {
    const page = pages.find((candidate) => pattern.test([
      candidate.title, candidate.description, candidate.metadataText, candidate.text,
    ].join("\n")));
    if (!page) continue;
    const source = [page.title, page.description, page.metadataText, page.text].join("\n");
    const quote = source.match(pattern)?.[0];
    if (quote) output.push({
      field: "identity.industry",
      value: industry,
      status: "INFERENCE",
      quote,
      sourceUrl: page.url,
      reason: `The page describes ${quote}, which supports this industry classification.`,
    });
    break;
  }

  const sources = pages.map((page) => ({
    page,
    text: [page.title, page.description, page.metadataText, page.text].join("\n"),
  }));
  const businessTypeSource = sources.find(({ text }) => /(?:AI work platform|SaaS|software platform|collaboration software|workflow automation)/i.test(text));
  const businessTypeQuote = businessTypeSource?.text.match(/(?:AI work platform|SaaS|software platform|collaboration software|workflow automation)/i)?.[0];
  if (businessTypeSource && businessTypeQuote) output.push({
    field: "identity.business_type",
    value: "SaaS collaboration platform",
    status: "INFERENCE",
    quote: businessTypeQuote,
    sourceUrl: businessTypeSource.page.url,
    reason: `The offering is described as "${businessTypeQuote}", indicating software delivered as a collaboration platform.`,
  });
  const subIndustrySource = sources.find(({ text }) => /(?:team communication|team messaging|connect(?:ing)? teams|collaboration software)/i.test(text));
  const subIndustryQuote = subIndustrySource?.text.match(/(?:team communication|team messaging|connect(?:ing)? teams|collaboration software)/i)?.[0];
  if (subIndustrySource && subIndustryQuote) output.push({
    field: "identity.sub_industry",
    value: "Team collaboration software",
    status: "INFERENCE",
    quote: subIndustryQuote,
    sourceUrl: subIndustrySource.page.url,
    reason: `The page describes "${subIndustryQuote}", supporting a more specific team-collaboration classification.`,
  });

  const audienceSource = sources.find(({ text }) => /(?:teams|organizations|businesses|enterprise)/i.test(text));
  const audienceQuote = audienceSource?.text.match(/(?:teams|organizations|businesses|enterprise)/i)?.[0];
  if (audienceSource && audienceQuote) {
    output.push({
      field: "identity.business_model",
      value: "B2B",
      status: "INFERENCE",
      quote: audienceQuote,
      sourceUrl: audienceSource.page.url,
      reason: `The page positions the offering for "${audienceQuote}", supporting a business-to-business audience inference.`,
    });
    output.push({
      field: "identity.target_market",
      value: "Work teams and organizations",
      status: "INFERENCE",
      quote: audienceQuote,
      sourceUrl: audienceSource.page.url,
      reason: `The explicit audience term "${audienceQuote}" supports an organizational target-market inference.`,
    });
  }
  return output;
}

function fallbackService(pages: PageContent[]): { name: string; quote: string; sourceUrl: string } | null {
  const phrases = [
    /AI work platform|team communication|team messaging|workflow automation|collaboration platform|project management/i,
    /vacation rentals?|holiday rentals?|places to stay|accommodation|lodging|إيجارات العطلات|مكان إقامة|أماكن الإقامة|بيوت للإيجار|تجارب سفر/iu,
    /payment processing|online payments?|معالجة المدفوعات|المدفوعات الإلكترونية/iu,
    /appointment scheduling|schedule meetings|جدولة المواعيد|حجز المواعيد/iu,
  ];
  for (const pattern of phrases) {
    for (const page of pages) {
      const source = [page.title, page.description, page.metadataText, page.text].join("\n");
      const quote = source.match(pattern)?.[0];
      if (quote) return { name: quote, quote, sourceUrl: page.url };
    }
  }
  return null;
}

type LinkFallbackCandidate =
  | { field: "commercial.has_pricing" | "commercial.has_demo"; value: true; quote: string; sourceUrl: string }
  | { field: "conversion_signals.has_demo_cta" | "conversion_signals.has_sales_cta" | "conversion_signals.has_signup" | "conversion_signals.has_login"; value: true; quote: string; sourceUrl: string }
  | { field: "digital_capabilities.api" | "digital_capabilities.documentation" | "digital_capabilities.developer_platform" | "digital_capabilities.mobile_app"; value: true; quote: string; sourceUrl: string }
  | { field: "social.linkedin" | "social.facebook" | "social.instagram" | "social.x" | "social.youtube" | "social.github"; value: string; quote: string; sourceUrl: string };

function fallbackLinkEvidence(pages: PageContent[]): LinkFallbackCandidate[] {
  const output: LinkFallbackCandidate[] = [];
  const definitions: Array<{
    field: LinkFallbackCandidate["field"];
    pattern: RegExp;
    urlPattern?: RegExp;
  }> = [
    { field: "commercial.has_pricing", pattern: /\bpricing\b/i },
    { field: "commercial.has_demo", pattern: /\bdemo\b/i },
    { field: "conversion_signals.has_demo_cta", pattern: /\bdemo\b/i },
    { field: "conversion_signals.has_sales_cta", pattern: /\b(?:contact sales|talk to sales)\b/i },
    { field: "conversion_signals.has_signup", pattern: /\b(?:sign up|signup|get started)\b/i },
    { field: "conversion_signals.has_login", pattern: /\b(?:log in|login|sign in)\b/i },
    { field: "digital_capabilities.api", pattern: /\bapi\b/i },
    { field: "digital_capabilities.documentation", pattern: /\b(?:documentation|docs)\b/i },
    { field: "digital_capabilities.developer_platform", pattern: /\bdevelopers?\b/i },
    { field: "digital_capabilities.mobile_app", pattern: /\b(?:app store|google play)\b/i },
    { field: "social.linkedin", pattern: /linkedin\.com/i, urlPattern: /linkedin\.com/i },
    { field: "social.facebook", pattern: /facebook\.com/i, urlPattern: /facebook\.com/i },
    { field: "social.instagram", pattern: /instagram\.com/i, urlPattern: /instagram\.com/i },
    { field: "social.x", pattern: /(?:x\.com|twitter\.com)/i, urlPattern: /(?:x\.com|twitter\.com)/i },
    { field: "social.youtube", pattern: /(?:youtube\.com|youtu\.be)/i, urlPattern: /(?:youtube\.com|youtu\.be)/i },
    { field: "social.github", pattern: /github\.com/i, urlPattern: /github\.com/i },
  ];
  const seen = new Set<string>();
  for (const page of pages) {
    for (const link of page.observations.links) {
      for (const definition of definitions) {
        if (seen.has(definition.field)) continue;
        const match = definition.urlPattern
          ? link.url.match(definition.urlPattern)
          : link.label.match(definition.pattern) ?? link.url.match(definition.pattern);
        if (!match) continue;
        const isSocial = definition.field.startsWith("social.");
        const candidate = {
          field: definition.field,
          value: isSocial ? link.url : true,
          quote: isSocial ? link.url : match[0],
          sourceUrl: page.url,
        } as LinkFallbackCandidate;
        output.push(candidate);
        seen.add(definition.field);
      }
    }
  }
  return output;
}

function applyLinkFallback(
  analysis: BusinessAnalysis,
  candidate: LinkFallbackCandidate,
  evidenceId: string,
): boolean {
  const supported = (value: { status?: string } | undefined) => !value || value.status === "UNKNOWN";
  const field = {
    value: true,
    status: "FACT" as const,
    confidence: 0.82,
    evidence_ids: [evidenceId],
  };
  switch (candidate.field) {
    case "commercial.has_pricing":
      if (!supported(analysis.commercial.has_pricing)) return false;
      analysis.commercial.has_pricing = field;
      return true;
    case "commercial.has_demo":
      if (!supported(analysis.commercial.has_demo)) return false;
      analysis.commercial.has_demo = field;
      return true;
    case "conversion_signals.has_demo_cta":
      if (!supported(analysis.conversion_signals.has_demo_cta)) return false;
      analysis.conversion_signals.has_demo_cta = field;
      return true;
    case "conversion_signals.has_sales_cta":
      if (!supported(analysis.conversion_signals.has_sales_cta)) return false;
      analysis.conversion_signals.has_sales_cta = field;
      return true;
    case "conversion_signals.has_signup":
      if (!supported(analysis.conversion_signals.has_signup)) return false;
      analysis.conversion_signals.has_signup = field;
      return true;
    case "conversion_signals.has_login":
      if (!supported(analysis.conversion_signals.has_login)) return false;
      analysis.conversion_signals.has_login = field;
      return true;
    case "digital_capabilities.api":
      if (!supported(analysis.digital_capabilities.api)) return false;
      analysis.digital_capabilities.api = field;
      return true;
    case "digital_capabilities.documentation":
      if (!supported(analysis.digital_capabilities.documentation)) return false;
      analysis.digital_capabilities.documentation = field;
      return true;
    case "digital_capabilities.developer_platform":
      if (!supported(analysis.digital_capabilities.developer_platform)) return false;
      analysis.digital_capabilities.developer_platform = field;
      return true;
    case "digital_capabilities.mobile_app":
      if (!supported(analysis.digital_capabilities.mobile_app)) return false;
      analysis.digital_capabilities.mobile_app = field;
      return true;
    case "social.linkedin":
      if (analysis.social.linkedin) return false;
      if (typeof candidate.value !== "string") return false;
      analysis.social.linkedin = candidate.value;
      return true;
    case "social.facebook":
      if (analysis.social.facebook) return false;
      if (typeof candidate.value !== "string") return false;
      analysis.social.facebook = candidate.value;
      return true;
    case "social.instagram":
      if (analysis.social.instagram) return false;
      if (typeof candidate.value !== "string") return false;
      analysis.social.instagram = candidate.value;
      return true;
    case "social.x":
      if (analysis.social.x) return false;
      if (typeof candidate.value !== "string") return false;
      analysis.social.x = candidate.value;
      return true;
    case "social.youtube":
      if (analysis.social.youtube) return false;
      if (typeof candidate.value !== "string") return false;
      analysis.social.youtube = candidate.value;
      return true;
    case "social.github":
      if (analysis.social.github) return false;
      if (typeof candidate.value !== "string") return false;
      analysis.social.github = candidate.value;
      return true;
  }
}

function addSourceBackedFallbacks(result: BusinessAnalysis, pages: PageContent[]): BusinessAnalysis {
  if (!result.identity) return result;
  const candidates = fallbackIdentityEvidence(pages);
  const missingCandidates = candidates.filter(({ field }) => {
    const path = field.split(".")[1] as keyof BusinessAnalysis["identity"];
    return result.identity[path].status === "UNKNOWN";
  });
  const serviceCandidate = result.offerings?.services?.length ? null : fallbackService(pages);
  const linkCandidates = fallbackLinkEvidence(pages);
  if (missingCandidates.length === 0 && !serviceCandidate && linkCandidates.length === 0) return result;

  const enriched = {
    ...result,
    identity: { ...result.identity },
    offerings: {
      ...result.offerings,
      services: [...(result.offerings?.services ?? [])],
    },
    commercial: { ...result.commercial },
    conversion_signals: { ...result.conversion_signals },
    digital_capabilities: { ...result.digital_capabilities },
    social: { ...result.social },
    evidence: [...result.evidence],
  };
  for (const candidate of missingCandidates) {
    const evidenceId = `source_${candidate.field.split(".").at(-1)}`;
    const path = candidate.field.split(".")[1] as keyof BusinessAnalysis["identity"];
    enriched.identity[path] = {
      value: candidate.value,
      status: candidate.status,
      confidence: candidate.status === "FACT" ? 0.9 : 0.78,
      evidence_ids: [evidenceId],
    } as BusinessAnalysis["identity"][typeof path];
    enriched.evidence.push({
      id: evidenceId,
      field: candidate.field,
      status: candidate.status,
      confidence: candidate.status === "FACT" ? 0.9 : 0.78,
      quote: candidate.quote,
      source_url: candidate.sourceUrl,
      source_page_type: "website page",
      reason: candidate.reason,
    });
  }
  if (serviceCandidate) {
    const evidenceId = "source_primary_service";
    const confidence = 0.9;
    enriched.offerings.services.push({
      name: serviceCandidate.name,
      description: null,
      status: "FACT",
      confidence,
      evidence_ids: [evidenceId],
    });
    enriched.evidence.push({
      id: evidenceId,
      field: "offerings.services.0.name",
      status: "FACT",
      confidence,
      quote: serviceCandidate.quote,
      source_url: serviceCandidate.sourceUrl,
      source_page_type: "website page",
      reason: "This offering category appears verbatim in the page content.",
    });
  }
  for (const [index, candidate] of linkCandidates.entries()) {
    const evidenceId = `source_link_${index}`;
    if (!applyLinkFallback(enriched, candidate, evidenceId)) continue;
    enriched.evidence.push({
      id: evidenceId,
      field: candidate.field,
      status: "FACT",
      confidence: 0.82,
      quote: candidate.quote,
      source_url: candidate.sourceUrl,
      source_page_type: "homepage",
      reason: `The fetched page links to ${candidate.quote}, directly indicating this capability or profile link.`,
    });
  }
  const validated = validateBusinessAnalysis(enriched, new Map(pages.map((page) => [
    page.url,
    [
      page.title,
      page.description,
      page.metadataText,
      page.text,
      ...page.observations.links.flatMap(({ url: linkUrl, label }) => [label, linkUrl]),
    ].filter(Boolean).join("\n"),
  ])));
  validated.analysis_quality.warnings = [
    ...validated.analysis_quality.warnings,
    "Some identity fields were recovered from exact page titles or metadata because Gemini did not provide verifiable claims for them.",
  ].slice(0, 20);
  return validated;
}

export function discoverPages(homeHtml: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const $ = cheerio.load(homeHtml);
  const candidates: Array<{ url: string; score: number }> = [];
  const seen = new Set([baseUrl]);
  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    try {
      const target = new URL(href, base);
      if (target.origin !== base.origin || !["http:", "https:"].includes(target.protocol)) return;
      target.hash = "";
      const normalized = target.toString();
      if (seen.has(normalized)) return;
      seen.add(normalized);
      const label = $(element).text().replace(/\s+/g, " ").trim().slice(0, 120);
      const score = pagePriority(target.pathname, label);
      if (score > 0) candidates.push({ url: normalized, score });
    } catch {
      return;
    }
  });
  return candidates.sort((left, right) => right.score - left.score)
    .slice(0, Math.max(0, appConfig.analysis.maxPages - 1))
    .map(({ url }) => url);
}

export async function analyzeWebsite(url: URL): Promise<AnalyzedWebsite> {
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), appConfig.analysis.totalTimeoutMs);
  const pages: PageContent[] = [];
  let totalBytes = 0;
  let pagesFailed = 0;
  let pagesTruncated = 0;
  try {
    const home = await fetchSafeHtml(
      url,
      appConfig.analysis.maxPageBytes,
      appConfig.analysis.fetchTimeoutMs,
      controller.signal,
    );
    totalBytes += home.bytes;
    if (home.truncated) pagesTruncated += 1;
    pages.push(extractPage(home.html, home.url));

    const discoveredPages = discoverPages(home.html, home.url);
    for (let offset = 0; offset < discoveredPages.length;) {
      const remainingBytes = appConfig.analysis.maxTotalBytes - totalBytes;
      if (pages.length >= appConfig.analysis.maxPages || remainingBytes <= 0) break;
      const pageCount = Math.min(
        secondaryPageConcurrency,
        discoveredPages.length - offset,
        Math.max(1, Math.ceil(remainingBytes / appConfig.analysis.maxPageBytes)),
      );
      const pageByteLimit = Math.min(
        appConfig.analysis.maxPageBytes,
        Math.floor(remainingBytes / pageCount),
      );
      const batch = discoveredPages.slice(offset, offset + pageCount);
      offset += batch.length;
      const outcomes = await Promise.all(batch.map(async (pageUrl) => {
        try {
          return {
            page: await fetchSafeHtml(
              pageUrl,
              pageByteLimit,
              appConfig.analysis.fetchTimeoutMs,
              controller.signal,
            ),
          };
        } catch (error) {
          return { error };
        }
      }));
      for (const outcome of outcomes) {
        if ("error" in outcome) {
          if (controller.signal.aborted) throw new ApiError("TIMEOUT", "The analysis exceeded its total time limit.");
          if (outcome.error instanceof ApiError && ["UNSAFE_URL", "INVALID_URL"].includes(outcome.error.code)) {
            throw outcome.error;
          }
          pagesFailed += 1;
          continue;
        }
        totalBytes += outcome.page.bytes;
        if (outcome.page.truncated) pagesTruncated += 1;
        pages.push(extractPage(outcome.page.html, outcome.page.url));
      }
    }

    const readableContent = pages
      .map((page) => [page.title, page.description, page.text].filter(Boolean).join("\n"))
      .join("\n")
      .trim();
    if (readableContent.length < 40) {
      throw new ApiError("SITE_BLOCKED", "The website did not provide enough readable content.");
    }
    const analysis = await analyzeWithGemini(pages, controller.signal);
    analysis.result = addSourceBackedFallbacks(analysis.result, pages);
    const canonicalUrl = pages[0]?.url ?? url.toString();
    analysis.result.request = {
      ...analysis.result.request,
      input_url: url.toString(),
      canonical_url: canonicalUrl,
      domain: new URL(canonicalUrl).hostname,
      pages_analyzed: pages.length,
    };
    analysis.result.analysis_quality.pages_successfully_read = pages.length;
    analysis.result.analysis_quality.pages_failed = pagesFailed;
    const warnings = [...analysis.result.analysis_quality.warnings];
    if (pagesFailed > 0) warnings.push(`${pagesFailed} discovered page${pagesFailed === 1 ? "" : "s"} could not be read.`);
    if (pagesTruncated > 0) warnings.push(
      `${pagesTruncated} page${pagesTruncated === 1 ? "" : "s"} exceeded the response limit; analysis used the available page content.`,
    );
    analysis.result.analysis_quality.warnings = warnings.slice(0, 20);
    analysis.pagesAnalyzed = pages.length;
    return analysis;
  } catch (error) {
    if (controller.signal.aborted) throw new ApiError("TIMEOUT", "The analysis exceeded its total time limit.");
    throw error;
  } finally {
    clearTimeout(deadline);
  }
}