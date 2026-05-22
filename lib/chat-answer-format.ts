type AnswerMode = "regulation" | "case" | "advisory";

interface DisplayEvidenceRecord {
  lawTitle?: string;
  citation?: string;
  sourceUrl?: string;
  sourceLocator?: string;
  sourceType?: string;
  verbatimSnippet?: string;
  country?: string;
}

interface DisplayLegalFinding {
  conclusion?: string;
  legalEffect?: string;
}

interface DisplayWorkflowResult {
  analysisRunId?: string | null;
  providerId?: string;
  providerModel?: string | null;
  evidenceSourceMode?: "real" | "mock" | "hybrid";
  report?: {
    finalNarrative?: string;
    overallRisk?: string;
  };
  evidenceRecords?: ReadonlyArray<DisplayEvidenceRecord>;
  supportingAgentResults?: {
    legalReviewExport?: {
      data?: {
        exportReadiness?: string;
        exportJson?: Record<string, unknown>;
      } | null;
    };
  };
  mainlineAgentResults?: {
    legalReasoner?: {
      data?: {
        legalFindings?: ReadonlyArray<DisplayLegalFinding>;
      } | null;
    };
  };
}

export function formatBackendAnswerMarkdown(result: DisplayWorkflowResult, _mode: AnswerMode) {
  const narrative =
    result.report?.finalNarrative?.trim() ||
    "The workflow completed, but no final narrative was returned.";
  const evidenceRecords = result.evidenceRecords ?? [];
  const primaryEvidence = evidenceRecords[0];
  const legalFindings =
    result.mainlineAgentResults?.legalReasoner?.data?.legalFindings ?? [];
  let sectionNumber = getNextSectionNumber(narrative);

  const evidenceSection = primaryEvidence
    ? [
        `${sectionNumber++}. Evidence Passage`,
        `- Citation: ${primaryEvidence.citation || primaryEvidence.lawTitle || "Primary source"}`,
        primaryEvidence.country ? `- Jurisdiction: ${primaryEvidence.country}` : null,
        primaryEvidence.sourceType ? `- Source type: ${primaryEvidence.sourceType}` : null,
        primaryEvidence.sourceLocator ? `- Locator: ${primaryEvidence.sourceLocator}` : null,
        primaryEvidence.verbatimSnippet
          ? `- Exact passage: ${normalizeWhitespace(primaryEvidence.verbatimSnippet)}`
          : null,
        primaryEvidence.sourceUrl ? `- URL: ${primaryEvidence.sourceUrl}` : null
      ]
        .filter(Boolean)
        .join("\n")
    : null;

  const impactSection = [
    `${sectionNumber++}. Compliance Impact`,
    ...(
      legalFindings.length
        ? legalFindings.slice(0, 3).flatMap((finding, index) => [
            `- Finding ${index + 1}: ${finding.conclusion || "No conclusion returned."}`,
            finding.legalEffect ? `  Effect: ${finding.legalEffect}` : null
          ])
        : ["- Finding 1: Review the answer summary and evidence passage before relying on the output."]
    ).filter(Boolean)
  ].join("\n");

  const sourceSection = evidenceRecords.length
    ? [
        `${sectionNumber++}. Source URLs Used`,
        ...uniqueEvidenceSources(evidenceRecords)
          .slice(0, 5)
          .map((record) => {
            const title = record.lawTitle || record.citation || record.sourceUrl || "Official source";
            return record.sourceUrl
              ? `- [${escapeMarkdownLinkText(title)}](${record.sourceUrl})`
              : `- ${title}`;
          })
      ].join("\n")
    : null;

  return [
    narrative,
    evidenceSection,
    impactSection,
    sourceSection
  ]
    .filter(Boolean)
    .join("\n\n");
}

function getNextSectionNumber(content: string) {
  const headingNumbers = Array.from(content.matchAll(/^\s*(\d+)\.\s+/gm)).map((match) =>
    Number(match[1])
  );

  return headingNumbers.length ? Math.max(...headingNumbers) + 1 : 1;
}

function uniqueEvidenceSources(records: ReadonlyArray<DisplayEvidenceRecord>) {
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = record.sourceUrl || record.lawTitle || record.citation;
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function escapeMarkdownLinkText(value: string) {
  return value.replace(/[[\]]/g, "");
}
