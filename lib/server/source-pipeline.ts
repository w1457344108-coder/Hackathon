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
  isPdf: boolean;
};

type ExcerptContext = {
  excerpt: string;
  supportingText: string;
  anchorIndex: number;
  pageNumber: number | null;
  sentenceNumber: number | null;
};

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as PdfParseFn;

const ALLOWED_SOURCE_HOSTS = new Set([
  "www.npc.gov.cn",
  "npc.gov.cn",
  "www.cac.gov.cn",
  "cac.gov.cn",
  "www.pdpc.gov.sg",
  "pdpc.gov.sg",
  "sso.agc.gov.sg",
  "www.ppc.go.jp",
  "ppc.go.jp",
  "eur-lex.europa.eu",
  "www.commerce.gov",
  "commerce.gov",
  "www.dataprivacyframework.gov",
  "dataprivacyframework.gov"
]);

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
  return `${source.country}: ${source.title} — ${source.sourceUrl}`;
}

function getSourceStrength(entry: CuratedSourceRecord): SourceStrength {
  if (entry.sourceType === "Statute") {
    return "country-profile";
  }

  if (entry.sourceType === "Policy Notice" || entry.sourceType === "Official Portal") {
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
  switch (entry.sourceType) {
    case "Statute":
      return "statute text";
    case "Regulator Guidance":
      return "regulator guidance";
    case "Policy Notice":
      return "official policy notice";
    case "Official Portal":
      return "official portal";
    case "International Agreement":
      return "international agreement";
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

function formatSourceLocator(
  entry: CuratedSourceRecord,
  pageNumber: number | null,
  sentenceNumber: number | null,
  isPdf: boolean
) {
  if (pageNumber !== null) {
    if (isPdf) {
      return sentenceNumber !== null
        ? `PDF page ${pageNumber}, sentence ${sentenceNumber}`
        : `PDF page ${pageNumber}`;
    }

    return sentenceNumber !== null
      ? `Web source sentence ${sentenceNumber}`
      : "Web source paragraph";
  }

  return "Sentence-level fallback excerpt";
}

function getReviewNote(
  entry: CuratedSourceRecord,
  foundLiveExcerpt: boolean,
  pageNumber: number | null,
  isPdf: boolean
) {
  const locatorNote =
    pageNumber !== null
      ? isPdf
        ? ` Locator: PDF page ${pageNumber}.`
        : " Locator: live source sentence or paragraph extracted from the web page."
      : "";

  if (foundLiveExcerpt) {
    return `${entry.reviewerNote} Source strength: ${getSourceStrengthLabel(entry)}.${locatorNote} Live retrieval succeeded.`;
  }

  return `${entry.reviewerNote} Source strength: ${getSourceStrengthLabel(entry)}.${locatorNote} Live retrieval fell back to curated excerpt text.`;
}

function ensureAllowedSourceUrl(sourceUrl: string) {
  const host = new URL(sourceUrl).host;

  if (!ALLOWED_SOURCE_HOSTS.has(host)) {
    throw new Error(`Source host ${host} is outside the official-source allowlist.`);
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
    .map((page) => page.trim())
    .filter(Boolean);

  if (byFormFeed.length > 0) {
    return byFormFeed;
  }

  const singlePage = rawText.trim();
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
    resolvedUrl,
    isPdf: true
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
    resolvedUrl,
    isPdf: false
  };
}

function extractExcerptFromPage(pageText: string, hint: string) {
  const normalizedPageText = collapseWhitespace(pageText);
  const index = normalizedPageText.indexOf(hint);

  if (index === -1) {
    return null;
  }

  const start = Math.max(0, index - 120);
  const end = Math.min(normalizedPageText.length, index + hint.length + 260);

  return {
    excerpt: collapseWhitespace(normalizedPageText.slice(start, end)),
    anchorIndex: index
  };
}

function normalizeLines(pageText: string) {
  return pageText
    .split(/\r?\n/)
    .map((line) => collapseWhitespace(line))
    .filter(Boolean);
}

function isTableLikeText(text: string) {
  const pillarMatches = text.match(/Pillar\s+\d+/gi)?.length ?? 0;
  const percentMatches = text.match(/-?\d+%/g)?.length ?? 0;
  const numericChunks = text.match(/\b\d+(?:\.\d+)?\b/g)?.length ?? 0;
  const hasDenseSeparators =
    text.includes("Table:") ||
    text.includes("Index score") ||
    /\.{5,}/.test(text);

  return (
    pillarMatches >= 2 ||
    percentMatches >= 3 ||
    numericChunks >= 10 ||
    hasDenseSeparators
  );
}

function getMentionedPillars(text: string) {
  return [...text.matchAll(/Pillar\s+(\d+)/gi)]
    .map((match) => Number.parseInt(match[1] ?? "", 10))
    .filter((value) => Number.isFinite(value));
}

function extractPillar6OnlySegment(text: string) {
  const candidates = [
    /Pillar\s*6[:.]\s*Cross-border data policies[^.?!]{0,240}(?:[.?!]|$)/i,
    /Pillar\s*6\s+deals with cross-border data policies[^.?!]{0,240}(?:[.?!]|$)/i,
    /cross-border data policies[^.?!]{0,240}(?:[.?!]|$)/i
  ];

  for (const pattern of candidates) {
    const match = text.match(pattern);

    if (match?.[0]) {
      return collapseWhitespace(match[0]);
    }
  }

  return null;
}

function sanitizePillar6Excerpt(text: string) {
  const normalized = collapseWhitespace(text.replace(/[•♦]/g, " "));

  if (!normalized) {
    return null;
  }

  if (!/Pillar\s*6|cross-border data policies/i.test(normalized)) {
    return null;
  }

  const pillarNumbers = getMentionedPillars(normalized);
  const mentionsOtherPillars = pillarNumbers.some((value) => value !== 6);

  if (isTableLikeText(normalized) || mentionsOtherPillars) {
    const pillar6OnlySegment = extractPillar6OnlySegment(normalized);

    if (!pillar6OnlySegment || isTableLikeText(pillar6OnlySegment)) {
      return null;
    }

    return pillar6OnlySegment;
  }

  return normalized;
}

function extractParagraphContext(pageText: string, hint: string) {
  const lines = normalizeLines(pageText);
  const normalizedHint = hint.toLowerCase();

  for (const [lineIndex, line] of lines.entries()) {
    if (!line.toLowerCase().includes(normalizedHint)) {
      continue;
    }

    const currentLineIsTable = isTableLikeText(line);
    const previousLine = lines[lineIndex - 1];
    const nextLine = lines[lineIndex + 1];
    const followingLine = lines[lineIndex + 2];

    const excerptLines = [
      previousLine && !isTableLikeText(previousLine) ? previousLine : null,
      currentLineIsTable
        ? collapseWhitespace(line.slice(Math.max(0, line.toLowerCase().indexOf(normalizedHint))))
        : line,
      nextLine && !isTableLikeText(nextLine) ? nextLine : null,
      followingLine && !isTableLikeText(followingLine) ? followingLine : null
    ].filter(Boolean) as string[];

    if (!excerptLines.length) {
      continue;
    }

    const excerpt = sanitizePillar6Excerpt(excerptLines.join("\n"));

    if (!excerpt) {
      continue;
    }

    return {
      excerpt,
      sentenceNumber: lineIndex + 1
    };
  }

  return null;
}

function splitIntoSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => collapseWhitespace(sentence))
    .filter(Boolean);
}

function extractSentenceContext(pageText: string, hint: string) {
  const sentences = splitIntoSentences(collapseWhitespace(pageText));
  const normalizedHint = hint.toLowerCase();

  for (const [sentenceIndex, sentence] of sentences.entries()) {
    if (!sentence.toLowerCase().includes(normalizedHint)) {
      continue;
    }

    const excerptSentences = [
      sentences[sentenceIndex - 1],
      sentence,
      sentences[sentenceIndex + 1]
    ].filter(Boolean) as string[];
    const excerpt = sanitizePillar6Excerpt(excerptSentences.join(" "));

    if (!excerpt) {
      continue;
    }

    return {
      excerpt,
      sentenceNumber: sentenceIndex + 1
    };
  }

  return null;
}

function extractExcerptContext(
  fullText: string,
  pages: string[],
  excerptHints: string[],
  fallback: string
): ExcerptContext {
  const normalizedText = collapseWhitespace(fullText);

  for (const hint of excerptHints) {
    for (const [pageIndex, pageText] of pages.entries()) {
      const paragraphMatch = extractParagraphContext(pageText, hint);

      if (paragraphMatch) {
        return {
          excerpt: paragraphMatch.excerpt,
          supportingText: paragraphMatch.excerpt,
          anchorIndex: normalizedText.indexOf(hint),
          pageNumber: pageIndex + 1,
          sentenceNumber: paragraphMatch.sentenceNumber
        };
      }

      const sentenceMatch = extractSentenceContext(pageText, hint);

      if (sentenceMatch) {
        return {
          excerpt: sentenceMatch.excerpt,
          supportingText: sentenceMatch.excerpt,
          anchorIndex: normalizedText.indexOf(hint),
          pageNumber: pageIndex + 1,
          sentenceNumber: sentenceMatch.sentenceNumber
        };
      }

      const pageMatch = extractExcerptFromPage(pageText, hint);

      if (pageMatch) {
        const excerpt = sanitizePillar6Excerpt(pageMatch.excerpt);

        if (!excerpt) {
          continue;
        }

        return {
          excerpt,
          supportingText: excerpt,
          anchorIndex: normalizedText.indexOf(hint),
          pageNumber: pageIndex + 1,
          sentenceNumber: null
        };
      }
    }

    const index = normalizedText.indexOf(hint);

    if (index !== -1) {
      const start = Math.max(0, index - 120);
      const end = Math.min(normalizedText.length, index + hint.length + 260);
      const excerpt = sanitizePillar6Excerpt(normalizedText.slice(start, end));

      if (!excerpt) {
        continue;
      }

      return {
        excerpt,
        supportingText: excerpt,
        anchorIndex: index,
        pageNumber: null,
        sentenceNumber: null
      };
    }
  }

  return {
    excerpt: fallback,
    supportingText: fallback,
    anchorIndex: -1,
    pageNumber: null,
    sentenceNumber: null
  };
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
    const originalLegalText = excerptContext.supportingText;

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
      sourceLocator: formatSourceLocator(
        entry,
        excerptContext.pageNumber,
        excerptContext.sentenceNumber,
        liveSource.isPdf
      ),
      sourceStrength: getSourceStrength(entry),
      traceabilityTier: getTraceabilityTier(entry, excerptContext.pageNumber),
      sourceType: entry.sourceType,
      discoveryTags: entry.discoveryTags,
      confidence: entry.confidence,
      reviewStatus: entry.reviewStatus,
      reviewerNote: getReviewNote(entry, true, excerptContext.pageNumber, liveSource.isPdf),
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
      sourceLocator: formatSourceLocator(entry, null, null, entry.sourceUrl.toLowerCase().endsWith(".pdf")),
      sourceStrength: getSourceStrength(entry),
      traceabilityTier: getTraceabilityTier(entry, null),
      sourceType: entry.sourceType,
      discoveryTags: entry.discoveryTags,
      confidence: entry.confidence,
      reviewStatus: entry.reviewStatus,
      reviewerNote: getReviewNote(
        entry,
        false,
        null,
        entry.sourceUrl.toLowerCase().endsWith(".pdf")
      ),
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
      ...curatedSources.map((source) => toSourceBasisLabel(source))
    ],
    realEvidenceCount: realEvidenceRecords.length,
    fallbackEvidenceCount: fallbackEvidenceRecords.length
  };
}
