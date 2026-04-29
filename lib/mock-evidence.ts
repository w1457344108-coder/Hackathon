import { CountryPolicyProfile, SupportedCountry } from "@/lib/types";
import {
  EvidenceRecord,
  PipelineAgentStage,
  Pillar6IndicatorCardData,
  Pillar6IndicatorId,
  PreferredSourceType,
  SearchProfileJson
} from "@/lib/pillar6-schema";

const indicatorDefinitions: Array<{
  id: Pillar6IndicatorId;
  title: string;
  shortLabel: string;
  description: string;
  scoreField: Pillar6IndicatorCardData["scoreField"];
}> = [
  {
    id: "ban-local-processing",
    title: "Ban and local processing requirements",
    shortLabel: "Local Processing",
    description:
      "Tracks whether a jurisdiction restricts offshore processing or requires sensitive data to be processed locally.",
    scoreField: "banLocalProcessing"
  },
  {
    id: "local-storage",
    title: "Local storage requirements",
    shortLabel: "Local Storage",
    description:
      "Shows whether personal, important, or sector-specific data must be stored within the jurisdiction.",
    scoreField: "localStorage"
  },
  {
    id: "infrastructure",
    title: "Infrastructure requirements",
    shortLabel: "Infrastructure",
    description:
      "Captures market access conditions that depend on local servers, routing architecture, or domestic infrastructure.",
    scoreField: "infrastructureRequirement"
  },
  {
    id: "conditional-flow",
    title: "Conditional flow regimes",
    shortLabel: "Conditional Flows",
    description:
      "Measures how strongly cross-border transfers depend on approvals, assessments, contracts, or adequacy tools.",
    scoreField: "conditionalFlowRegime"
  },
  {
    id: "binding-commitments",
    title: "Binding commitments on data transfer",
    shortLabel: "Binding Commitments",
    description:
      "Highlights whether international commitments support freer data flows or leave a gap in transfer guarantees.",
    scoreField: "bindingAgreementGap"
  }
];

const severityFromScore = (score: number): Pillar6IndicatorCardData["severity"] => {
  if (score >= 0.75) {
    return "Restrictive";
  }

  if (score >= 0.25) {
    return "Managed";
  }

  return "Open";
};

const noteFromIndicator = (country: string, title: string, score: number) => {
  if (score >= 0.75) {
    return `${country} shows high-friction signals for "${title}" in this demo evidence model.`;
  }

  if (score >= 0.25) {
    return `${country} appears conditionally open on "${title}", but still needs legal verification before conclusions are final.`;
  }

  return `${country} looks comparatively open on "${title}" in the current mock profile.`;
};

export function buildPillar6IndicatorCards(
  profile: CountryPolicyProfile
): Pillar6IndicatorCardData[] {
  return indicatorDefinitions.map((definition) => {
    const score = profile.rdtiiStyleScore[definition.scoreField];

    return {
      ...definition,
      score,
      severity: severityFromScore(score),
      analystNote: noteFromIndicator(profile.country, definition.title, score)
    };
  });
}

export const preferredSourceOptions: PreferredSourceType[] = [
  "Official legislation portal",
  "Regulator guidance",
  "International agreement database",
  "Case law database",
  "Government ministry website"
];

export const pipelineStages: PipelineAgentStage[] = [
  {
    id: "query-builder",
    name: "Query Builder Agent",
    purpose: "Converts plain-language legal research goals into structured multilingual search logic.",
    output: "Search Profile JSON and query strings"
  },
  {
    id: "source-discovery",
    name: "Source Discovery Agent",
    purpose: "Finds likely statutes, regulator portals, and treaty materials worth checking first.",
    output: "Candidate source inventory"
  },
  {
    id: "document-reader",
    name: "Document Reader Agent",
    purpose: "Reads target documents and segments provisions relevant to cross-border data transfer.",
    output: "Passage set with source anchors"
  },
  {
    id: "relevance-filter",
    name: "Relevance Filter Agent",
    purpose: "Filters out low-value clauses and keeps only evidence linked to Pillar 6 indicators.",
    output: "Shortlisted evidence snippets"
  },
  {
    id: "indicator-mapping",
    name: "Indicator Mapping Agent",
    purpose: "Maps each legal snippet to a specific Pillar 6 indicator and tentative scoring direction.",
    output: "Indicator-aligned evidence mapping"
  },
  {
    id: "citation-evidence",
    name: "Citation & Evidence Agent",
    purpose: "Produces precise citations, source URLs, discovery tags, and traceable excerpt packaging.",
    output: "Review-ready evidence records"
  },
  {
    id: "legal-review",
    name: "Legal Review Agent",
    purpose: "Surfaces ambiguity, flags over-extraction risk, and records reviewer notes for human validation.",
    output: "Reviewed evidence queue"
  },
  {
    id: "report-export",
    name: "Report & Export Agent",
    purpose: "Packages the reviewed evidence into analytical summaries and export formats.",
    output: "JSON, CSV, and Markdown deliverables"
  }
];

export const mockEvidenceRecords: EvidenceRecord[] = [
  {
    country: "China",
    pillar: "Pillar 6",
    indicator: "Conditional flow regimes",
    lawTitle: "Mock Personal Information Export Compliance Notice",
    citation: "Art. 12",
    verbatimSnippet:
      "\"Outbound transfer of important datasets shall complete the designated security review before the transfer is activated.\"",
    sourceUrl: "https://example.gov.cn/mock-export-notice",
    sourceType: "Regulator Guidance",
    discoveryTags: ["security assessment", "cross-border transfer", "important data"],
    confidence: 0.92,
    reviewStatus: "Approved",
    reviewerNote:
      "Strong Pillar 6 signal. Reviewer agrees this supports a conditional transfer regime classification.",
    originalLegalText:
      "Outbound transfer of important datasets shall complete the designated security review before the transfer is activated. Operators shall retain the review record and associated transfer dossier.",
    aiExtraction:
      "Transfer is allowed only after a formal security review, which creates an ex ante approval gate for cross-border data movement.",
    pillar6Mapping:
      "Maps to Conditional flow regimes because the transfer pathway depends on a formal review before execution."
  },
  {
    country: "China",
    pillar: "Pillar 6",
    indicator: "Local storage requirements",
    lawTitle: "Mock Critical Information Infrastructure Data Rule",
    citation: "Sec. 5",
    verbatimSnippet:
      "\"Critical operators shall store covered operational and personal data within domestic territory unless a lawful exception applies.\"",
    sourceUrl: "https://example.gov.cn/mock-cii-rule",
    sourceType: "Statute",
    discoveryTags: ["local storage", "critical infrastructure", "personal data"],
    confidence: 0.95,
    reviewStatus: "Approved",
    reviewerNote:
      "Direct localization wording. Very useful teaching example for local storage classification.",
    originalLegalText:
      "Critical operators shall store covered operational and personal data within domestic territory unless a lawful exception applies and the exception has been documented in compliance records.",
    aiExtraction:
      "Covered data must be stored domestically, with only limited exception pathways.",
    pillar6Mapping:
      "Maps to Local storage requirements because the obligation explicitly anchors data storage inside the jurisdiction."
  },
  {
    country: "Singapore",
    pillar: "Pillar 6",
    indicator: "Binding commitments on data transfer",
    lawTitle: "Mock Digital Economy Cooperation Chapter",
    citation: "Chapter 8, Art. 4",
    verbatimSnippet:
      "\"The Parties shall allow covered data to move across borders for the conduct of business, subject to legitimate public policy safeguards.\"",
    sourceUrl: "https://example.gov.sg/mock-digital-agreement",
    sourceType: "International Agreement",
    discoveryTags: ["trade agreement", "cross-border data", "binding commitment"],
    confidence: 0.89,
    reviewStatus: "Approved",
    reviewerNote:
      "Good example for students because it contrasts international openness language with domestic safeguards.",
    originalLegalText:
      "The Parties shall allow covered data to move across borders for the conduct of business, subject to legitimate public policy safeguards that are not applied in a disguised trade-restrictive manner.",
    aiExtraction:
      "This text shows a positive binding commitment supporting data transfers for commercial activity.",
    pillar6Mapping:
      "Maps to Binding commitments on data transfer because it creates a treaty-level openness commitment."
  },
  {
    country: "Singapore",
    pillar: "Pillar 6",
    indicator: "Conditional flow regimes",
    lawTitle: "Mock Accountability Transfer Guidance",
    citation: "Para. 17",
    verbatimSnippet:
      "\"An organization transferring personal data overseas remains responsible for ensuring a comparable standard of protection.\"",
    sourceUrl: "https://example.pdpc.gov.sg/mock-guidance",
    sourceType: "Regulator Guidance",
    discoveryTags: ["accountability", "overseas transfer", "protection standard"],
    confidence: 0.83,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Likely a conditional flow signal, but students should verify whether the guidance is binding or interpretive only.",
    originalLegalText:
      "An organization transferring personal data overseas remains responsible for ensuring a comparable standard of protection and should document the basis for that conclusion.",
    aiExtraction:
      "Transfers are generally allowed, but exporters must prove comparable protection.",
    pillar6Mapping:
      "Maps to Conditional flow regimes because transfer permission is tied to a safeguards test rather than a blanket ban."
  },
  {
    country: "European Union",
    pillar: "Pillar 6",
    indicator: "Conditional flow regimes",
    lawTitle: "Mock Adequacy and Safeguards Regulation",
    citation: "Art. 44-46",
    verbatimSnippet:
      "\"Transfers to a third country may take place where an adequacy finding exists or where appropriate safeguards are in place.\"",
    sourceUrl: "https://example.europa.eu/mock-transfer-regulation",
    sourceType: "Statute",
    discoveryTags: ["adequacy", "appropriate safeguards", "third country transfer"],
    confidence: 0.94,
    reviewStatus: "Approved",
    reviewerNote:
      "Canonical conditional transfer example. High-confidence mapping for Pillar 6.",
    originalLegalText:
      "Transfers to a third country may take place where an adequacy finding exists or where appropriate safeguards are in place and enforceable rights remain available to the data subject.",
    aiExtraction:
      "Transfer is possible, but only through adequacy or safeguard mechanisms.",
    pillar6Mapping:
      "Maps to Conditional flow regimes because permissibility depends on a recognized legal transfer mechanism."
  },
  {
    country: "Japan",
    pillar: "Pillar 6",
    indicator: "Binding commitments on data transfer",
    lawTitle: "Mock Regional Digital Trade Commitment",
    citation: "Annex 3, Clause 7",
    verbatimSnippet:
      "\"Each Party shall endeavor to refrain from requiring the use of local computing facilities as a condition for conducting business.\"",
    sourceUrl: "https://example.meti.go.jp/mock-regional-commitment",
    sourceType: "International Agreement",
    discoveryTags: ["local computing facilities", "trade commitment", "market access"],
    confidence: 0.78,
    reviewStatus: "Needs Revision",
    reviewerNote:
      "The clause is softer than a hard prohibition. Keep it, but annotate that the obligation may be phrased as an endeavor.",
    originalLegalText:
      "Each Party shall endeavor to refrain from requiring the use of local computing facilities as a condition for conducting business, except where legitimate public policy objectives justify otherwise.",
    aiExtraction:
      "This suggests a pro-flow treaty orientation, but the language is softer than a strict binding ban on localization requirements.",
    pillar6Mapping:
      "Maps to Binding commitments on data transfer, with a caution note on legal force and exceptions."
  },
  {
    country: "United States",
    pillar: "Pillar 6",
    indicator: "Infrastructure requirements",
    lawTitle: "Mock Sectoral Cloud Hosting Advisory",
    citation: "Advisory Note 9",
    verbatimSnippet:
      "\"Covered institutions should ensure regulated records remain accessible to supervisory authorities without technical barriers.\"",
    sourceUrl: "https://example.gov.us/mock-cloud-advisory",
    sourceType: "Policy Notice",
    discoveryTags: ["supervisory access", "cloud hosting", "sectoral infrastructure"],
    confidence: 0.62,
    reviewStatus: "Pending Review",
    reviewerNote:
      "This may affect infrastructure design, but students should verify whether it is truly a localization or only an access obligation.",
    originalLegalText:
      "Covered institutions should ensure regulated records remain accessible to supervisory authorities without technical barriers, including in cloud-based operating models.",
    aiExtraction:
      "The text may influence infrastructure design, though it does not clearly impose a local server mandate.",
    pillar6Mapping:
      "Tentatively maps to Infrastructure requirements because the legal concern is about architecture and regulator access, not direct transfer prohibition."
  }
];

export const buildSearchProfile = (
  input: {
    jurisdiction: string;
    plainLanguageQuery: string;
    legalTerms: string;
    synonyms: string;
    exclusionTerms: string;
    preferredSources: PreferredSourceType[];
  }
): SearchProfileJson => {
  const splitTerms = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const legalTerms = splitTerms(input.legalTerms);
  const synonyms = splitTerms(input.synonyms);
  const exclusionTerms = splitTerms(input.exclusionTerms);
  const indicatorTargets = indicatorDefinitions.map((item) => item.title);
  const baseTerms = [...legalTerms, ...synonyms].filter(Boolean);

  const searchQueries = [
    `${input.jurisdiction} cross-border data transfer ${input.plainLanguageQuery}`.trim(),
    `${input.jurisdiction} (${baseTerms.join(" OR ") || "data transfer"}) official guidance`,
    `${input.jurisdiction} (${indicatorTargets.slice(0, 2).join(" OR ")}) site:gov`
  ];

  return {
    jurisdiction: input.jurisdiction,
    pillar: "Pillar 6: Cross-Border Data Policies",
    objective: input.plainLanguageQuery,
    legalTerms,
    synonyms,
    exclusionTerms,
    preferredSources: input.preferredSources,
    indicatorTargets,
    searchQueries,
    reviewChecklist: [
      "Confirm the source is official, current, and relevant to cross-border data transfers.",
      "Check whether the text is binding law, regulator guidance, or treaty language.",
      "Extract verbatim language before scoring or summarizing an indicator.",
      "Record uncertainty where the text affects architecture or supervision but not explicit transfer bans."
    ],
    generatedAt: new Date().toISOString()
  };
};

export function filterEvidenceByCountries(
  records: EvidenceRecord[],
  countryA: SupportedCountry,
  countryB?: SupportedCountry | ""
) {
  return records.filter((record) =>
    record.country === countryA || (countryB ? record.country === countryB : false)
  );
}
