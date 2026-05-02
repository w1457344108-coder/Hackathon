import { createRequire } from "node:module";
import type {
  EvidenceRecord,
  Pillar6IndicatorCode
} from "../pillar6-schema";
import type { SupportedCountry } from "../types";
import { filterEvidenceByCountries, mockEvidenceRecords } from "../mock-evidence";
import { getCuratedSourcesForCountries } from "./source-registry";
import type { CuratedSourceRecord } from "./source-registry";

type PdfParseResult = {
  text?: string;
};

type PdfParseFn = (buffer: Buffer) => Promise<PdfParseResult>;

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as PdfParseFn;

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

function getReviewNote(entry: CuratedSourceRecord, foundLiveExcerpt: boolean) {
  if (foundLiveExcerpt) {
    return `${entry.reviewerNote} Live retrieval succeeded.`;
  }

  return `${entry.reviewerNote} Live retrieval fell back to curated excerpt text.`;
}

async function fetchSourceResponse(sourceUrl: string) {
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

async function parsePdfText(response: Response) {
  const arrayBuffer = await response.arrayBuffer();
  const parsed = await pdfParse(Buffer.from(arrayBuffer));
  return collapseWhitespace(parsed.text ?? "");
}

async function fetchSourceText(sourceUrl: string) {
  const response = await fetchSourceResponse(sourceUrl);
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/pdf") || sourceUrl.toLowerCase().endsWith(".pdf")) {
    return parsePdfText(response);
  }

  if (contentType.includes("text/html") || contentType.includes("text/plain")) {
    return stripHtml(await response.text());
  }

  return collapseWhitespace(await response.text());
}

function extractExcerptContext(fullText: string, excerptHints: string[], fallback: string) {
  const normalizedText = collapseWhitespace(fullText);

  for (const hint of excerptHints) {
    const index = normalizedText.indexOf(hint);

    if (index === -1) {
      continue;
    }

    const start = Math.max(0, index - 120);
    const end = Math.min(normalizedText.length, index + hint.length + 260);
    return {
      excerpt: collapseWhitespace(normalizedText.slice(start, end)),
      anchorIndex: index
    };
  }

  return {
    excerpt: fallback,
    anchorIndex: -1
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
    const liveText = await fetchSourceText(entry.sourceUrl);
    const excerptContext = extractExcerptContext(liveText, entry.excerptHints, entry.excerptFallback);
    const originalLegalText =
      liveText.length > 200
        ? extractOriginalTextWindow(liveText, excerptContext.anchorIndex)
        : liveText;

    return {
      evidenceId: `EV-${entry.id}`,
      country: entry.country,
      pillar: "Pillar 6",
      indicator: mapIndicatorLabel(entry.indicatorCode),
      indicatorCode: entry.indicatorCode,
      lawTitle: entry.title,
      citation: entry.citation,
      verbatimSnippet: excerptContext.excerpt,
      sourceUrl: entry.sourceUrl,
      sourceType: entry.sourceType,
      discoveryTags: entry.discoveryTags,
      confidence: entry.confidence,
      reviewStatus: entry.reviewStatus,
      reviewerNote: getReviewNote(entry, true),
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
      sourceType: entry.sourceType,
      discoveryTags: entry.discoveryTags,
      confidence: entry.confidence,
      reviewStatus: entry.reviewStatus,
      reviewerNote: getReviewNote(entry, false),
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
      sourceBasis: ["Mock evidence fallback only"],
      realEvidenceCount: 0,
      fallbackEvidenceCount: fallbackEvidenceRecords.length
    };
  }

  return {
    evidenceRecords,
    sourceMode: fallbackEvidenceRecords.length > 0 ? "hybrid" : "real",
    sourceBasis: [
      "Competition-designated source set: UN ESCAP RCDTRA portal and RDTII 2.1 guide",
      ...curatedSources.map((source) => toSourceBasisLabel(source))
    ],
    realEvidenceCount: realEvidenceRecords.length,
    fallbackEvidenceCount: fallbackEvidenceRecords.length
  };
}
