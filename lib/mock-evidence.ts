import type {
  CandidateSource,
  CountryPolicyProfile,
  Pillar6IndicatorEnum,
  PreferredSourceType,
  QueryBuilderOutput,
  QueryPlanItem,
  SupportedCountry
} from "@/lib/types";
import type {
  EvidenceRecord,
  PipelineAgentStage,
  Pillar6IndicatorCardData,
  Pillar6IndicatorCode,
  Pillar6IndicatorId,
  SourceDiscoveryResult,
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
  "Government ministry website",
  "International agreement database",
  "RDTII / UN ESCAP source"
];

function splitTerms(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const jurisdictionTermMap: Record<string, string[]> = {
  China: ["security assessment", "important data export", "cross-border transfer"],
  Singapore: ["comparable protection", "overseas transfer", "accountability standard"],
  "European Union": ["third country transfer", "appropriate safeguards", "adequacy decision"],
  Japan: ["foreign transfer consent", "equivalent protection", "outsourcing transfer"]
};

const indicatorQueryBlueprints: Array<{
  id: Pillar6IndicatorId;
  code: Pillar6IndicatorCode;
  label: string;
  mustTerms: string[];
  sourceStrategy: PreferredSourceType[];
}> = [
  {
    id: "ban-local-processing",
    code: "P6_1_BAN_LOCAL_PROCESSING",
    label: "Ban and local processing requirements",
    mustTerms: ["local processing", "offshore processing restriction", "domestic processing"],
    sourceStrategy: ["Official legislation portal", "Government ministry website"]
  },
  {
    id: "local-storage",
    code: "P6_2_LOCAL_STORAGE",
    label: "Local storage requirements",
    mustTerms: ["local storage", "data localization", "domestic storage"],
    sourceStrategy: ["Official legislation portal", "Regulator guidance"]
  },
  {
    id: "infrastructure",
    code: "P6_3_INFRASTRUCTURE",
    label: "Infrastructure requirements",
    mustTerms: ["local server", "infrastructure requirement", "regulator access"],
    sourceStrategy: ["Government ministry website", "Regulator guidance"]
  },
  {
    id: "conditional-flow",
    code: "P6_4_CONDITIONAL_FLOW",
    label: "Conditional flow regimes",
    mustTerms: ["cross-border transfer approval", "security assessment", "transfer mechanism"],
    sourceStrategy: ["Regulator guidance", "Official legislation portal"]
  },
  {
    id: "binding-commitments",
    code: "P6_5_BINDING_COMMITMENT",
    label: "Binding commitments on data transfer",
    mustTerms: ["digital trade agreement", "cross-border data flow commitment", "treaty obligation"],
    sourceStrategy: ["International agreement database", "RDTII / UN ESCAP source"]
  }
];

function getScenarioTerms(businessScenario: string) {
  const scenario = businessScenario.toLowerCase();

  return [
    scenario.includes("fintech") ? "payment data transfer" : null,
    scenario.includes("e-commerce") ? "merchant data export" : null,
    scenario.includes("cloud") ? "cross-border cloud hosting" : null,
    scenario.includes("health") ? "sensitive health data transfer" : null,
    businessScenario.trim() ? businessScenario.trim() : null
  ].filter(Boolean) as string[];
}

function getJurisdictionTerms(jurisdiction: string) {
  return (
    jurisdictionTermMap[jurisdiction] ?? [
      "cross-border data flow",
      "transfer condition",
      "regulatory openness"
    ]
  );
}

function getSourceTerms(sourceType: PreferredSourceType) {
  switch (sourceType) {
    case "Official legislation portal":
      return ["official law", "statute", "regulation"];
    case "Regulator guidance":
      return ["official guidance", "regulator notice", "compliance guidance"];
    case "Government ministry website":
      return ["ministry notice", "government circular", "official website"];
    case "International agreement database":
      return ["digital trade agreement", "FTA", "international commitment"];
    case "RDTII / UN ESCAP source":
      return ["RDTII", "UN ESCAP", "regulatory database"];
  }

  return [];
}

function getLanguageHint(jurisdiction: string): QueryPlanItem["languageHint"] {
  return jurisdiction === "China" || jurisdiction === "Japan" ? "Local + English" : "English";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getJurisdictionSlug(jurisdiction: string) {
  const slugs: Record<string, string> = {
    China: "cn",
    Singapore: "sg",
    Japan: "jp",
    "European Union": "eu",
    "United States": "us"
  };

  return slugs[jurisdiction] ?? slugify(jurisdiction);
}

function getSourceUrl(jurisdiction: string, sourceType: PreferredSourceType, indicatorLabel: string) {
  const jurisdictionSlug = getJurisdictionSlug(jurisdiction);
  const indicatorSlug = slugify(indicatorLabel);

  switch (sourceType) {
    case "Official legislation portal":
      return `https://laws.example.${jurisdictionSlug}/${indicatorSlug}`;
    case "Regulator guidance":
      return `https://regulator.example.${jurisdictionSlug}/${indicatorSlug}`;
    case "Government ministry website":
      return `https://ministry.example.${jurisdictionSlug}/${indicatorSlug}`;
    case "International agreement database":
      return `https://treaties.example.org/${jurisdictionSlug}/${indicatorSlug}`;
    case "RDTII / UN ESCAP source":
      return `https://rdtii.example.org/${jurisdictionSlug}/${indicatorSlug}`;
  }
}

function getSourceTitle(jurisdiction: string, sourceType: PreferredSourceType, indicatorLabel: string) {
  switch (sourceType) {
    case "Official legislation portal":
      return `${jurisdiction} ${indicatorLabel} Regulation Portal`;
    case "Regulator guidance":
      return `${jurisdiction} ${indicatorLabel} Compliance Guidance`;
    case "Government ministry website":
      return `${jurisdiction} ${indicatorLabel} Ministry Notice`;
    case "International agreement database":
      return `${jurisdiction} ${indicatorLabel} Treaty Database Entry`;
    case "RDTII / UN ESCAP source":
      return `${jurisdiction} RDTII Pillar 6 ${indicatorLabel} Reference`;
  }
}

function getAuthorityLevel(sourceType: PreferredSourceType): CandidateSource["authorityLevel"] {
  return sourceType === "RDTII / UN ESCAP source" ? "Supporting" : "Primary";
}

function getJurisdictionMatch(sourceType: PreferredSourceType): CandidateSource["jurisdictionMatch"] {
  return sourceType === "RDTII / UN ESCAP source" ||
    sourceType === "International agreement database"
    ? "Regional / Comparative"
    : "Direct";
}

function getRetrievalStatus(
  sourceType: PreferredSourceType,
  priority: QueryPlanItem["priority"]
): CandidateSource["retrievalStatus"] {
  if (sourceType === "RDTII / UN ESCAP source" || priority === "Medium") {
    return "Needs Human Check";
  }

  return "Ready for Reading";
}

function matchesPreferredSourceType(record: EvidenceRecord, sourceType: PreferredSourceType) {
  switch (sourceType) {
    case "Official legislation portal":
      return record.sourceType === "Statute" || record.sourceType === "Official Portal";
    case "Regulator guidance":
      return record.sourceType === "Regulator Guidance" || record.sourceType === "Policy Notice";
    case "Government ministry website":
      return record.sourceType === "Official Portal" || record.sourceType === "Policy Notice";
    case "International agreement database":
      return record.sourceType === "International Agreement";
    case "RDTII / UN ESCAP source":
      return true;
  }
}

function isPillar6ScopedQuery(query: QueryPlanItem) {
  const offTopicMarkers = [
    "consumer rights",
    "general privacy",
    "tax data",
    "telecom tariffs",
    "customs duty"
  ];
  const searchableTerms = [...query.mustTerms, ...query.shouldTerms].join(" ").toLowerCase();

  return !offTopicMarkers.some((term) => searchableTerms.includes(term));
}

export function buildAiSuggestedTerms(jurisdiction: string, businessScenario: string) {
  return [
    ...new Set([
      ...getJurisdictionTerms(jurisdiction),
      ...getScenarioTerms(businessScenario),
      "data localization"
    ])
  ].join(", ");
}

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
    purpose:
      "Executes reviewed query-plan items against the right authority channel and returns traceable candidate sources first.",
    output: "Authority-ranked candidate source inventory"
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
    evidenceId: "EV-CHN-001",
    country: "China",
    pillar: "Pillar 6",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
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
      "Maps to Conditional flow regimes because the transfer pathway depends on a formal review before execution.",
    mappingRationale:
      "The clause does not ban transfer outright, but it conditions transfer on a prior security review. That is the core structure of a Pillar 6 conditional flow regime signal.",
    riskImplication:
      "High compliance friction for exporters because deal timelines and operational launch plans may be delayed by pre-transfer review requirements."
  },
  {
    evidenceId: "EV-CHN-002",
    country: "China",
    pillar: "Pillar 6",
    indicator: "Local storage requirements",
    indicatorCode: "P6_2_LOCAL_STORAGE",
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
      "Maps to Local storage requirements because the obligation explicitly anchors data storage inside the jurisdiction.",
    mappingRationale:
      "The text directly imposes an in-country storage obligation. That is a strong fit for the Pillar 6 local storage indicator rather than a softer transfer condition.",
    riskImplication:
      "Businesses may need duplicated storage architecture, local vendors, or region-specific compliance controls before launch."
  },
  {
    evidenceId: "EV-SGP-001",
    country: "Singapore",
    pillar: "Pillar 6",
    indicator: "Binding commitments on data transfer",
    indicatorCode: "P6_5_BINDING_COMMITMENT",
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
      "Maps to Binding commitments on data transfer because it creates a treaty-level openness commitment.",
    mappingRationale:
      "The provision uses treaty-style commitment language and explicitly addresses cross-border movement of covered data, which aligns with the binding commitment indicator.",
    riskImplication:
      "Lower transfer friction for firms relying on regional data operations, although domestic safeguard exceptions still need legal review."
  },
  {
    evidenceId: "EV-SGP-002",
    country: "Singapore",
    pillar: "Pillar 6",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
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
      "Maps to Conditional flow regimes because transfer permission is tied to a safeguards test rather than a blanket ban.",
    mappingRationale:
      "The text keeps transfers open in principle but ties legality to a safeguards-based accountability standard, which is characteristic of conditional transfer rules.",
    riskImplication:
      "Moderate compliance burden because organizations must document equivalence and maintain internal justification for cross-border flows."
  },
  {
    evidenceId: "EV-EU-001",
    country: "European Union",
    pillar: "Pillar 6",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
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
      "Maps to Conditional flow regimes because permissibility depends on a recognized legal transfer mechanism.",
    mappingRationale:
      "This is a textbook example of transfer conditionality: cross-border movement depends on adequacy decisions or substitute safeguards rather than default permissibility.",
    riskImplication:
      "Operational risk is manageable but documentation, contracting, and transfer impact analysis can increase legal review cost."
  },
  {
    evidenceId: "EV-JPN-001",
    country: "Japan",
    pillar: "Pillar 6",
    indicator: "Binding commitments on data transfer",
    indicatorCode: "P6_5_BINDING_COMMITMENT",
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
      "Maps to Binding commitments on data transfer, with a caution note on legal force and exceptions.",
    mappingRationale:
      "The clause still belongs in the commitment bucket because it addresses localization-related obligations at agreement level, but its softer wording reduces certainty.",
    riskImplication:
      "Useful pro-flow signal for business planning, but legal teams should treat it as a qualified commitment rather than a complete shield from local infrastructure demands."
  },
  {
    evidenceId: "EV-USA-001",
    country: "United States",
    pillar: "Pillar 6",
    indicator: "Infrastructure requirements",
    indicatorCode: "P6_3_INFRASTRUCTURE",
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
      "Tentatively maps to Infrastructure requirements because the legal concern is about architecture and regulator access, not direct transfer prohibition.",
    mappingRationale:
      "The provision is best treated as an infrastructure signal because it shapes system design and supervisory access expectations, even without explicit localization language.",
    riskImplication:
      "Potential architecture and vendor risk if cloud environments cannot satisfy regulator access expectations in practice."
  }
];

export const buildSearchProfile = (
  input: {
    jurisdiction: string;
    businessScenario: string;
    plainLanguageQuery: string;
    aiGeneratedTerms: string;
    lawStudentTerms: string;
    exclusionTerms: string;
    preferredSources: PreferredSourceType[];
    focusIndicators?: Pillar6IndicatorEnum[];
    normalizedIntent?: string;
  }
): SearchProfileJson => {
  const aiGeneratedTerms = splitTerms(input.aiGeneratedTerms);
  const lawStudentTerms = splitTerms(input.lawStudentTerms);
  const exclusionTerms = splitTerms(input.exclusionTerms);
  const baseTerms = [...aiGeneratedTerms, ...lawStudentTerms].filter(Boolean);
  const scenarioTerms = getScenarioTerms(input.businessScenario);
  const jurisdictionTerms = getJurisdictionTerms(input.jurisdiction);
  const selectedIndicators =
    input.focusIndicators && input.focusIndicators.length > 0
      ? indicatorQueryBlueprints.filter((item) => input.focusIndicators?.includes(item.code))
      : indicatorQueryBlueprints;
  const indicatorTargets = selectedIndicators.map((item) => item.code);
  const sourcePriorityOrder =
    input.preferredSources.length > 0 ? input.preferredSources : preferredSourceOptions;
  const queryPlan: QueryPlanItem[] = [];

  selectedIndicators.forEach((indicator, indicatorIndex) => {
    const prioritizedSources = sourcePriorityOrder.filter((source) =>
      indicator.sourceStrategy.includes(source)
    );
    const selectedSources =
      prioritizedSources.length > 0 ? prioritizedSources : [indicator.sourceStrategy[0]];

    selectedSources.slice(0, 2).forEach((sourceType, sourceIndex) => {
      const mustTerms = [...new Set([input.jurisdiction, ...indicator.mustTerms])];
      const shouldTerms = [
        ...new Set([
          ...jurisdictionTerms,
          ...scenarioTerms,
          ...baseTerms,
          ...getSourceTerms(sourceType)
        ])
      ];
      const exclusionSuffix = exclusionTerms.map((term) => `-${term}`).join(" ");
      const queryText = [
        input.jurisdiction,
        input.businessScenario,
        `"${indicator.label}"`,
        mustTerms.join(" "),
        shouldTerms.length > 0 ? `(${shouldTerms.join(" OR ")})` : null,
        exclusionSuffix || null
      ]
        .filter(Boolean)
        .join(" ");

      queryPlan.push({
        queryId: `QB-${indicatorIndex + 1}-${sourceIndex + 1}`,
        jurisdiction: input.jurisdiction,
        indicatorCode: indicator.code,
        indicatorLabel: indicator.label,
        targetSourceType: sourceType,
        priority: sourceIndex === 0 ? "High" : "Medium",
        languageHint: getLanguageHint(input.jurisdiction),
        mustTerms,
        shouldTerms,
        excludeTerms: exclusionTerms,
        queryText,
        whyThisQuery: `Targets ${indicator.label} first through ${sourceType.toLowerCase()} so the downstream source discovery step can prioritize authoritative Pillar 6 evidence.`,
        reviewerStatus: "Suggested",
        reviewerNote: ""
      });
    });
  });

  return {
    jurisdiction: input.jurisdiction,
    businessScenario: input.businessScenario,
    normalizedIntent:
      input.normalizedIntent ??
      `Find Pillar 6 evidence for ${input.businessScenario} operations in ${input.jurisdiction}, limited to cross-border transfer, localization, infrastructure, conditional flow, and binding commitments.`,
    userQuery: input.plainLanguageQuery,
    aiGeneratedTerms,
    lawStudentTerms,
    exclusionTerms,
    preferredSources: input.preferredSources,
    sourcePriorityOrder,
    pillar6IndicatorTargets: indicatorTargets,
    queryPlan,
    searchQueries: queryPlan.map((item) => item.queryText),
    reviewChecklist: [
      "Confirm the source is official, current, and relevant to cross-border data transfers.",
      "Check whether the text is binding law, regulator guidance, ministry material, or international commitment.",
      "Let law students approve, revise, or reject each query before finalizing the retrieval plan.",
      "Extract verbatim language before scoring or summarizing a Pillar 6 indicator.",
      "Record uncertainty where the text affects architecture or supervision but not explicit transfer bans.",
      "Keep the search limited to Pillar 6 and avoid drifting into general domestic privacy compliance."
    ],
    generatedAt: new Date().toISOString()
  };
};

export function buildSourceDiscoveryCandidates(
  profile: SearchProfileJson,
  countries?: SupportedCountry[]
): SourceDiscoveryResult {
  const eligibleRecords =
    countries && countries.length > 0
      ? mockEvidenceRecords.filter((record) => countries.includes(record.country as SupportedCountry))
      : mockEvidenceRecords.filter((record) => record.country === profile.jurisdiction);

  const candidateSources: CandidateSource[] = profile.queryPlan
    .filter((query) => query.reviewerStatus !== "Rejected")
    .filter(isPillar6ScopedQuery)
    .flatMap((query) =>
      eligibleRecords
        .filter((record) => record.indicatorCode === query.indicatorCode)
        .filter((record) => matchesPreferredSourceType(record, query.targetSourceType))
        .map((record) => ({
          sourceId: `SRC-${record.evidenceId}`,
          evidenceId: record.evidenceId,
          queryId: query.queryId,
          indicatorId: query.indicatorCode,
          title: record.lawTitle,
          jurisdiction: record.country,
          sourceType: query.targetSourceType,
          sourceUrl: record.sourceUrl,
          relevanceNote: `${record.indicator} evidence matched from ${query.queryId}.`,
          authorityLevel: getAuthorityLevel(query.targetSourceType),
          jurisdictionMatch:
            record.country === query.jurisdiction ? "Direct" : getJurisdictionMatch(query.targetSourceType),
          discoveryReason: `Matched ${record.evidenceId} to ${query.queryId} because ${record.indicatorCode} and ${query.targetSourceType.toLowerCase()} align with the query plan.`,
          retrievalStatus: getRetrievalStatus(query.targetSourceType, query.priority),
          matchedTerms: [...record.discoveryTags, ...query.mustTerms].slice(0, 6)
        }))
    )
    .filter(
      (source, index, collection) =>
        collection.findIndex((item) => item.evidenceId === source.evidenceId) === index
    )
    .slice(0, 8);

  return {
    jurisdiction: profile.jurisdiction,
    candidateSources
  };
}

export function toQueryBuilderOutput(profile: SearchProfileJson): QueryBuilderOutput {
  return {
    normalizedIntent: profile.normalizedIntent,
    sourcePriorityOrder: profile.sourcePriorityOrder,
    queryPlan: profile.queryPlan,
    searchQueries: profile.searchQueries,
    targetIndicators: profile.pillar6IndicatorTargets,
    reviewChecklist: profile.reviewChecklist
  };
}

export function filterEvidenceByCountries(
  records: EvidenceRecord[],
  countryA: SupportedCountry,
  countryB?: SupportedCountry | ""
) {
  return records.filter((record) =>
    record.country === countryA || (countryB ? record.country === countryB : false)
  );
}
