import * as cheerio from "cheerio";
import { appConfig } from "@/lib/shared/config";
import { ApiError } from "@/lib/shared/errors";
import { fetchSafeHtml } from "@/lib/server/url-safety";
import { analyzeWithGemini } from "@/lib/server/gemini";
import type { BusinessAnalysis } from "@/lib/shared/analysis-schema";

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

const pageKeywords = ["about", "company", "contact", "service", "product", "pricing", "price", "book", "booking", "appointment", "faq"];

export function extractPage(html: string, url: string): PageContent {
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim().slice(0, 300);
  const description = $('meta[name="description"]').attr("content")?.trim().slice(0, 500) ?? "";
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
  }).slice(0, 80);
  const bookingLinkDetected = links.some(({ url: link }) => /book|booking|appointment|schedule/i.test(link));
  const whatsappLinkDetected = links.some(({ url: link }) => /wa\.me|whatsapp\.com/i.test(link));
  $("script, style, noscript, svg, iframe").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 18_000);
  return {
    url,
    title,
    description,
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
      const label = `${target.pathname} ${$(element).text()}`.toLowerCase();
      const score = pageKeywords.reduce((total, keyword) => total + Number(label.includes(keyword)), 0);
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
  try {
    const home = await fetchSafeHtml(
      url,
      appConfig.analysis.maxPageBytes,
      appConfig.analysis.fetchTimeoutMs,
      controller.signal,
    );
    totalBytes += home.bytes;
    pages.push(extractPage(home.html, home.url));

    for (const pageUrl of discoverPages(home.html, home.url)) {
      const remainingBytes = appConfig.analysis.maxTotalBytes - totalBytes;
      if (pages.length >= appConfig.analysis.maxPages || remainingBytes <= 0) break;
      try {
        const page = await fetchSafeHtml(
          pageUrl,
          Math.min(appConfig.analysis.maxPageBytes, remainingBytes),
          appConfig.analysis.fetchTimeoutMs,
          controller.signal,
        );
        totalBytes += page.bytes;
        pages.push(extractPage(page.html, page.url));
      } catch (error) {
        if (controller.signal.aborted) throw new ApiError("TIMEOUT", "The analysis exceeded its total time limit.");
        if (error instanceof ApiError && ["UNSAFE_URL", "INVALID_URL"].includes(error.code)) throw error;
        pagesFailed += 1;
      }
    }

    if (!pages[0]?.text || pages[0].text.length < 40) {
      throw new ApiError("SITE_BLOCKED", "The website did not provide enough readable content.");
    }
    const analysis = await analyzeWithGemini(pages, controller.signal);
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
    if (pagesFailed > 0) {
      analysis.result.analysis_quality.warnings = [
        ...analysis.result.analysis_quality.warnings,
        `${pagesFailed} discovered page${pagesFailed === 1 ? "" : "s"} could not be read.`,
      ].slice(0, 20);
    }
    analysis.pagesAnalyzed = pages.length;
    return analysis;
  } catch (error) {
    if (controller.signal.aborted) throw new ApiError("TIMEOUT", "The analysis exceeded its total time limit.");
    throw error;
  } finally {
    clearTimeout(deadline);
  }
}