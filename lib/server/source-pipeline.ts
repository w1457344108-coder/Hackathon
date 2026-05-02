import { createRequire } from "node:module";
import type { EvidenceRecord, Pillar6IndicatorCode } from "../pillar6-schema";
import type { SupportedCountry } from "../types";
import { filterEvidenceByCountries, mockEvidenceRecords } from "../mock-evidence";
import { getCuratedSourcesForCountries } from "./source-registry";
import type { CuratedSourceRecord } from "./source-registry";

type PdfParseResult = {
  text?: string;
};

type PdfParseFn = (buffer: Buffer) => Promise<PdfParseResult>;

type SourceStrength = NonNullable<EvidenceRecord["sourceStrength"]>;
type TraceabilityTier = NonNullable<EvidenceRecord["traceabilityTier"]>;

type ParsedSourceText = {
  text: string;
  pages: string[];
  resolvedUrl: string;
};

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as PdfParseFn;

const ALLOWED_SOURCE_HOSTS = new Set(["www.unescap.org", "unescap.org", "dtri.uneca.org"]);

export type EvidenceSourceMode = "real" | "mock" | "hybrid";

export interface ResolvedEvidenceContext {
  evidenceRecords: EvidenceRecord[];
  sourceMode: EvidenceSourceMode;
  sourceBasis: string[];
  realEvidenceCount: number;
  fallbackEvidenceCount: number;
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripHtml(value: string) {
  return collapseWhitespace(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&#39;/gi, "'")
      .replace(/&quot;/gi, '"')
  );
}

function toSourceBasisLabel(source: CuratedSourceRecord) {
  return `${source.country}: ${source.title} (${new URL(source.sourceUrl).host})`;
}

function getSourceStrength(entry: CuratedSourceRecord): SourceStrength {
  if (entry.title.includes("Economy Profile")) {
    return "country-profile";
  }

  if (entry.title.includes("Regulatory Database")) {
    return "database-entrypoint";
  }

  return "methodology-support";
}

function getTraceabilityTier(entry: CuratedSourceRecord, pageNumber: number | null): TraceabilityTier {
  if (pageNumber !== null) {
    return "page-level";
  }

  if (getSourceStrength(entry) === "database-entrypoint") {
    return "entrypoint-level";
  }

  return "page-level";
}

function getSourceStrengthLabel(entry: CuratedSourceRecord) {
  switch (getSourceStrength(entry)) {
    case "country-profile":
      return "country profile";
    case "database-entrypoint":
      return "database entrypoint";
    case "methodology-support":
      return "methodology support";
  }
}

function mapIndicatorLabel(indicatorCode: Pillar6IndicatorCode) {
  switch (indicatorCode) {
    case "P6_1_BAN_LOCAL_PROCESSING":
      return "Ban and local processing requirements";
    case "P6_2_LOCAL_STORAGE":
      return "Local storage requirements";
    case "P6_3_INFRASTRUCTURE":
      return "Infrastructure requirements";
    case "P6_4_CONDITIONAL_FLOW":
      return "Conditional flow regimes";
    case "P6_5_BINDING_COMMITMENT":
      return "Binding commitments on data transfer";
  }
}

function formatSourceLocator(entry: CuratedSourceRecord, pageNumber: number | null) {
  if (pageNumber !== null) {
    return `Page ${pageNumber}`;
  }

  if (entry.title.includes("Regulatory Database")) {
    return `Pillar 6 economy entry for ${entry.country}`;
  }

  if (entry.title.includes("Economy Profile")) {
    return "Pillar 6 section in economy profile";
  }

  return "Pillar 6 methodology section";
}

function getReviewNote(
  entry: CuratedSourceRecord,
  foundLiveExcerpt: boolean,
  pageNumber: number | null
) {
  const locatorNote = pageNumber !== null ? ` Locator: page ${pageNumber}.` : "";

  if (foundLiveExcerpt) {
    return `${entry.reviewerNote} Source strength: ${getSourceStrengthLabel(entry)}.${locatorNote} Live retrieval succeeded.`;
  }

  return `${entry.reviewerNote} Source strength: ${getSourceStrengthLabel(entry)}.${locatorNote} Live retrieval fell back to curated excerpt text.`;
}

function ensureAllowedSourceUrl(sourceUrl: string) {
  const host = new URL(sourceUrl).host;

  if (!ALLOWED_SOURCE_HOSTS.has(host)) {
    throw new Error(`Source host ${host} is outside the competition-designated source set.`);
  }
}

async function fetchSourceResponse(sourceUrl: string) {
  ensureAllowedSourceUrl(sourceUrl);

  const response = await fetch(sourceUrl, {
    headers: {
      "User-Agent": "CrossBorderDataPolicyMultiAgentAnalyst/1.0"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Source fetch failed with status ${response.status}.`);
  }

  return response;
}

function splitPdfPages(rawText: string) {
  const byFormFeed = rawText
    .split("\f")
    .map((page) => collapseWhitespace(page))
    .filter(Boolean);

  if (byFormFeed.length > 0) {
    return byFormFeed;
  }

  const singlePage = collapseWhitespace(rawText);
  return singlePage ? [singlePage] : [];
}

async function parsePdfText(response: Response, resolvedUrl: string): Promise<ParsedSourceText> {
  const arrayBuffer = await response.arrayBuffer();
  const parsed = await pdfParse(Buffer.from(arrayBuffer));
  const rawText = parsed.text ?? "";
  const pages = splitPdfPages(rawText);

  return {
    text: collapseWhitespace(rawText),
    pages,
    resolvedUrl
  };
}

async function fetchSourceText(sourceUrl: string): Promise<ParsedSourceText> {
  const response = await fetchSourceResponse(sourceUrl);
  const contentType = response.headers.get("content-type") ?? "";
  const resolvedUrl = response.url || sourceUrl;

  if (contentType.includes("application/pdf") || sourceUrl.toLowerCase().endsWith(".pdf")) {
    return parsePdfText(response, resolvedUrl);
  }

  const text = contentType.includes("text/html") || contentType.includes("text/plain")
    ? stripHtml(await response.text())
    : collapseWhitespace(await response.text());

  return {
    text,
    pages: text ? [text] : [],
    resolvedUrl
  };
}

function extractExcerptFromPage(pageText: string, hint: string) {
  const index = pageText.indexOf(hint);

  if (index === -1) {
    return null;
  }

  const start = Math.max(0, index - 120);
  const end = Math.min(pageText.length, index + hint.length + 260);

  return {
    excerpt: collapseWhitespace(pageText.slice(start, end)),
    anchorIndex: index
  };
}

function extractExcerptContext(
  fullText: string,
  pages: string[],
  excerptHints: string[],
  fallback: string
) {
  const normalizedText = collapseWhitespace(fullText);

  for (const hint of excerptHints) {
    for (const [pageIndex, pageText] of pages.entries()) {
      const pageMatch = extractExcerptFromPage(pageText, hint);

      if (pageMatch) {
        return {
          excerpt: pageMatch.excerpt,
          anchorIndex: normalizedText.indexOf(hint),
          pageNumber: pageIndex + 1
        };
      }
    }

    const index = normalizedText.indexOf(hint);

    if (index !== -1) {
      const start = Math.max(0, index - 120);
      const end = Math.min(normalizedText.length, index + hint.length + 260);

      return {
        excerpt: collapseWhitespace(normalizedText.slice(start, end)),
        anchorIndex: index,
        pageNumber: null
      };
    }
  }

  return {
    excerpt: fallback,
    anchorIndex: -1,
    pageNumber: null
  };
}

function extractOriginalTextWindow(fullText: string, anchorIndex: number) {
  if (anchorIndex < 0) {
    return fullText.slice(0, Math.min(1800, fullText.length));
  }

  const start = Math.max(0, anchorIndex - 240);
  const end = Math.min(fullText.length, anchorIndex + 1560);
  return collapseWhitespace(fullText.slice(start, end));
}

async function resolveCuratedEvidenceRecord(entry: CuratedSourceRecord): Promise<EvidenceRecord> {
  try {
    const liveSource = await fetchSourceText(entry.sourceUrl);
    const excerptContext = extractExcerptContext(
      liveSource.text,
      liveSource.pages,
      entry.excerptHints,
      entry.excerptFallback
    );
    const originalLegalText =
      liveSource.text.length > 200
        ? extractOriginalTextWindow(liveSource.text, excerptContext.anchorIndex)
        : liveSource.text;

    return {
      evidenceId: `EV-${entry.id}`,
      country: entry.country,
      pillar: "Pillar 6",
      indicator: mapIndicatorLabel(entry.indicatorCode),
      indicatorCode: entry.indicatorCode,
      lawTitle: entry.title,
      citation: entry.citation,
      verbatimSnippet: excerptContext.excerpt,
      sourceUrl: liveSource.resolvedUrl,
      sourceLocator: formatSourceLocator(entry, excerptContext.pageNumber),
      sourceStrength: getSourceStrength(entry),
      traceabilityTier: getTraceabilityTier(entry, excerptContext.pageNumber),
      sourceType: entry.sourceType,
      discoveryTags: entry.discoveryTags,
      confidence: entry.confidence,
      reviewStatus: entry.reviewStatus,
      reviewerNote: getReviewNote(entry, true, excerptContext.pageNumber),
      originalLegalText,
      aiExtraction: entry.aiExtractionFallback,
      pillar6Mapping: entry.pillar6Mapping,
      mappingRationale: entry.mappingRationale,
      riskImplication: entry.riskImplication
    };
  } catch {
    return {
      evidenceId: `EV-${entry.id}`,
      country: entry.country,
      pillar: "Pillar 6",
      indicator: mapIndicatorLabel(entry.indicatorCode),
      indicatorCode: entry.indicatorCode,
      lawTitle: entry.title,
      citation: entry.citation,
      verbatimSnippet: entry.excerptFallback,
      sourceUrl: entry.sourceUrl,
      sourceLocator: formatSourceLocator(entry, null),
      sourceStrength: getSourceStrength(entry),
      traceabilityTier: getTraceabilityTier(entry, null),
      sourceType: entry.sourceType,
      discoveryTags: entry.discoveryTags,
      confidence: entry.confidence,
      reviewStatus: entry.reviewStatus,
      reviewerNote: getReviewNote(entry, false, null),
      originalLegalText: entry.originalTextFallback,
      aiExtraction: entry.aiExtractionFallback,
      pillar6Mapping: entry.pillar6Mapping,
      mappingRationale: entry.mappingRationale,
      riskImplication: entry.riskImplication
    };
  }
}

function getRequestedCountries(countryA: SupportedCountry, countryB?: SupportedCountry | null) {
  return [countryA, countryB].filter(Boolean) as SupportedCountry[];
}

export async function resolveEvidenceContext(
  countryA: SupportedCountry,
  countryB?: SupportedCountry | null
): Promise<ResolvedEvidenceContext> {
  const requestedCountries = getRequestedCountries(countryA, countryB);
  const curatedSources = getCuratedSourcesForCountries(requestedCountries);
  const realEvidenceRecords = await Promise.all(
    curatedSources.map((source) => resolveCuratedEvidenceRecord(source))
  );
  const coveredCountries = new Set(realEvidenceRecords.map((record) => record.country as SupportedCountry));
  const fallbackEvidenceRecords = filterEvidenceByCountries(mockEvidenceRecords, countryA, countryB ?? "").filter(
    (record) => !coveredCountries.has(record.country as SupportedCountry)
  );
  const evidenceRecords = [...realEvidenceRecords, ...fallbackEvidenceRecords];

  if (realEvidenceRecords.length === 0) {
    return {
      evidenceRecords: fallbackEvidenceRecords,
      sourceMode: "mock",
      sourceBasis: ["Fallback evidence set only"],
      realEvidenceCount: 0,
      fallbackEvidenceCount: fallbackEvidenceRecords.length
    };
  }

  return {
    evidenceRecords,
    sourceMode: fallbackEvidenceRecords.length > 0 ? "hybrid" : "real",
    sourceBasis: [
      "Competition-designated source set from ai_hackathon.pptx: ESCAP RCDTRA portal, RDTII 2.1 guide, and official RDTII files hosted under dtri.uneca.org",
      ...curatedSources.map((source) => toSourceBasisLabel(source))
    ],
    realEvidenceCount: realEvidenceRecords.length,
    fallbackEvidenceCount: fallbackEvidenceRecords.length
  };
}
