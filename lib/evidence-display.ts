import type { EvidenceRecord } from "@/lib/pillar6-schema";

const PILLAR_6_SCORE_ROW_PATTERN =
  /Pillar\s*6[:.]\s*Cross-border data policies\s*([0-9.]+)\s*(-?\d+%)\s*(-?\d+%)/i;
const GUIDE_TOC_PATTERN =
  /Pillar\s*6[.:]\s*Cross-border data policies\s*\.{2,}\s*(\d+)/i;
const PILLAR_6_SENTENCE_PATTERN =
  /(Pillar\s*6[.:]?\s*Cross-border data policies[^.]*\.[^.]*\.)/i;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function describeRelativeComplexity(value: string, baselineLabel: string) {
  const normalized = value.trim();
  const magnitude = Number.parseInt(normalized.replace("%", ""), 10);

  if (Number.isNaN(magnitude)) {
    return `${normalized} relative to the ${baselineLabel}.`;
  }

  if (magnitude === 0) {
    return `Matches the ${baselineLabel}.`;
  }

  const direction = magnitude > 0 ? "higher" : "lower";
  return `${Math.abs(magnitude)}% ${direction} complexity than the ${baselineLabel}.`;
}

function formatPillar6ScoreRow(snippet: string) {
  const match = snippet.match(PILLAR_6_SCORE_ROW_PATTERN);

  if (!match) {
    return null;
  }

  const [, score, asiaPacificDifference, subregionalDifference] = match;

  return [
    `Pillar 6 score: ${score}`,
    describeRelativeComplexity(asiaPacificDifference, "Asia-Pacific average"),
    describeRelativeComplexity(subregionalDifference, "subregional average")
  ].join("\n");
}

function formatGuideTocReference(snippet: string) {
  const match = snippet.match(GUIDE_TOC_PATTERN);

  if (!match) {
    return null;
  }

  return `Guide section reference: Pillar 6, Cross-border data policies, begins on guide page ${match[1]}.`;
}

function formatPillar6Sentence(snippet: string) {
  const match = snippet.match(PILLAR_6_SENTENCE_PATTERN);

  if (!match) {
    return null;
  }

  return normalizeWhitespace(match[1]);
}

export function formatEvidenceSnippetForDisplay(
  record: Pick<EvidenceRecord, "verbatimSnippet" | "lawTitle">
) {
  const normalizedSnippet = normalizeWhitespace(record.verbatimSnippet);

  if (!normalizedSnippet) {
    return "";
  }

  const scoreRowSummary = formatPillar6ScoreRow(normalizedSnippet);
  if (scoreRowSummary) {
    return scoreRowSummary;
  }

  const tocSummary = formatGuideTocReference(normalizedSnippet);
  if (tocSummary) {
    return tocSummary;
  }

  const pillar6Sentence = formatPillar6Sentence(normalizedSnippet);
  if (pillar6Sentence) {
    return pillar6Sentence;
  }

  return normalizedSnippet;
}
