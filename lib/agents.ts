import { countryPolicyProfiles } from "@/lib/mock-data";
import {
  buildAiSuggestedTerms,
  buildSearchProfile,
  filterEvidenceByCountries,
  mockEvidenceRecords,
  preferredSourceOptions,
  toQueryBuilderOutput
} from "@/lib/mock-evidence";
import { EvidenceRecord } from "@/lib/pillar6-schema";
import {
  AgentResult,
  AuditCitationItem,
  AuditCitationOutput,
  CandidateSource,
  ComparisonAgentResult,
  ComparisonRow,
  CountryPolicyProfile,
  DemoNarrative,
  DocumentReaderOutput,
  IndicatorMappingOutput,
  IntentArbiterOutput,
  LegalReasonerOutput,
  MainlineAgentResults,
  MappedEvidenceItem,
  Pillar6IndicatorEnum,
  PolicyAnalysisResult,
  QueryBuilderOutput,
  ReasoningUncertaintyLevel,
  RelevanceFilterOutput,
  RiskCostQuantifierOutput,
  ReportAgentResult,
  ResearchAgentResult,
  RiskLevel,
  RiskSummary,
  SupportingAgentResults,
  SupportedCountry,
  TenAgentId,
  WorkflowAgentTrace,
  WorkflowResult
} from "@/lib/types";
import { getAnalysisProvider } from "@/lib/server/provider-adapter";
import { resolveEvidenceContext } from "@/lib/server/source-pipeline";

const SOURCE_BASIS = [
  "UN ESCAP RDTII initiative structure",
  "ESCAP RDTII 2.1 Guide, Pillar 6 scoring logic",
  "ESCAP coverage of Pillar 6: cross-border data policies"
];

const ALL_PILLAR6_INDICATORS: Pillar6IndicatorEnum[] = [
  "P6_1_BAN_LOCAL_PROCESSING",
  "P6_2_LOCAL_STORAGE",
  "P6_3_INFRASTRUCTURE",
  "P6_4_CONDITIONAL_FLOW",
  "P6_5_BINDING_COMMITMENT"
];

const TEN_AGENT_ORDER: TenAgentId[] = [
  "intent-arbiter",
  "query-builder",
  "source-discovery",
  "document-reader",
  "relevance-filter",
  "indicator-mapping",
  "legal-reasoner",
  "risk-cost-quantifier",
  "audit-citation",
  "legal-review-export"
];

const agentNames: Record<TenAgentId, string> = {
  "intent-arbiter": "Intent Arbiter Agent",
  "query-builder": "Query Builder Agent",
  "source-discovery": "Source Discovery Agent",
  "document-reader": "Document Reader Agent",
  "relevance-filter": "Relevance Filter Agent",
  "indicator-mapping": "Indicator Mapping Agent",
  "legal-reasoner": "Legal Reasoner Agent",
  "risk-cost-quantifier": "Risk & Cost Quantifier Agent",
  "audit-citation": "Audit View & Citation Agent",
  "legal-review-export": "Legal Review & Export Agent"
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getEvidenceRecord(evidenceId: string, evidenceRecords: EvidenceRecord[]) {
  return evidenceRecords.find((record) => record.evidenceId === evidenceId);
}

function dedupeStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function buildLegalFindingsFallback(
  mappedEvidence: MappedEvidenceItem[],
  evidenceRecords: EvidenceRecord[]
): LegalReasonerOutput {
  return {
    legalFindings: mappedEvidence.flatMap((item) => {
      const record = getEvidenceRecord(item.evidenceId, evidenceRecords);

      if (!record) {
        return [];
      }

      return [
        {
          conclusionId: `CON-${record.evidenceId}`,
          jurisdiction: record.country,
          indicatorId: item.indicatorId,
          conclusion: record.aiExtraction,
          legalEffect: record.riskImplication,
          evidenceIds: [record.evidenceId]
        }
      ];
    })
  };
}

function buildRelevanceReason(indicatorId: Pillar6IndicatorEnum) {
  switch (indicatorId) {
    case "P6_1_BAN_LOCAL_PROCESSING":
      return "Directly addresses local processing or offshore processing restrictions.";
    case "P6_2_LOCAL_STORAGE":
      return "Directly addresses domestic storage or localization obligations.";
    case "P6_3_INFRASTRUCTURE":
      return "Directly affects infrastructure design, hosting, or regulator-access architecture.";
    case "P6_4_CONDITIONAL_FLOW":
      return "Directly describes transfer conditions, approvals, or safeguard gates.";
    case "P6_5_BINDING_COMMITMENT":
      return "Directly describes treaty or agreement-based support for cross-border data flows.";
  }
}

function getRelevanceBand(record: (typeof mockEvidenceRecords)[number]) {
  if (
    record.indicatorCode === "P6_3_INFRASTRUCTURE" ||
    record.reviewStatus === "Pending Review" ||
    record.confidence < 0.75
  ) {
    return "Borderline" as const;
  }

  return "Direct Match" as const;
}

function buildRelevanceReviewerPrompt(record: (typeof mockEvidenceRecords)[number]) {
  if (record.indicatorCode === "P6_3_INFRASTRUCTURE") {
    return "Confirm this passage really affects cross-border infrastructure design, not only domestic supervision.";
  }

  if (record.reviewStatus !== "Approved") {
    return "Spot-check whether this passage should stay in scope before using it in audit or export.";
  }

  return "This passage is a strong Pillar 6 fit and can move into audit packaging.";
}

function getCostDrivers(
  findings: LegalReasonerOutput["legalFindings"],
  evidenceRecords: EvidenceRecord[]
) {
  const drivers = new Set<string>();

  findings.forEach((finding) => {
    switch (finding.indicatorId) {
      case "P6_1_BAN_LOCAL_PROCESSING":
        drivers.add("local processing architecture");
        drivers.add("duplicated operating model");
        break;
      case "P6_2_LOCAL_STORAGE":
        drivers.add("domestic storage infrastructure");
        drivers.add("data residency controls");
        break;
      case "P6_3_INFRASTRUCTURE":
        drivers.add("cloud and hosting redesign");
        drivers.add("regulator-access engineering");
        break;
      case "P6_4_CONDITIONAL_FLOW":
        drivers.add("approval preparation burden");
        drivers.add("transfer assessment lead time");
        break;
      case "P6_5_BINDING_COMMITMENT":
        drivers.add("treaty exception analysis");
        drivers.add("cross-border governance documentation");
        break;
    }

    if (
      finding.evidenceIds.some(
        (evidenceId) => getEvidenceRecord(evidenceId, evidenceRecords)?.reviewStatus !== "Approved"
      )
    ) {
      drivers.add("additional legal review time");
    }
  });

  return [...drivers];
}

function needsHumanReview(
  findings: LegalReasonerOutput["legalFindings"],
  evidenceRecords: EvidenceRecord[]
) {
  return findings.some((finding) =>
    finding.evidenceIds.some(
      (evidenceId) => getEvidenceRecord(evidenceId, evidenceRecords)?.reviewStatus !== "Approved"
    )
  );
}

function getUncertaintyLevel(
  findings: LegalReasonerOutput["legalFindings"],
  evidenceRecords: EvidenceRecord[]
): ReasoningUncertaintyLevel {
  if (needsHumanReview(findings, evidenceRecords)) {
    return "High";
  }

  if (
    findings.some(
      (finding) =>
        finding.indicatorId === "P6_3_INFRASTRUCTURE" ||
        finding.indicatorId === "P6_4_CONDITIONAL_FLOW"
    )
  ) {
    return "Moderate";
  }

  return "Low";
}

function buildTraceabilityNote(reviewStatus: string, humanReviewNeeded: boolean) {
  if (humanReviewNeeded) {
    return "The evidence chain is linked, but a reviewer should confirm the excerpt and citation before export.";
  }

  if (reviewStatus !== "Approved") {
    return "The legal text is linked successfully, but the underlying evidence record still needs reviewer confirmation.";
  }

  return "The legal claim, source text, and citation are fully linked for reviewer inspection.";
}

function summarizeOperationalImpact(
  findings: LegalReasonerOutput["legalFindings"],
  riskLevel: RiskLevel,
  uncertaintyLevel: ReasoningUncertaintyLevel
) {
  const dominantIndicators = [...new Set(findings.map((finding) => finding.indicatorId))];
  const summary = `The current legal findings indicate a ${riskLevel.toLowerCase()} operational risk posture across ${dominantIndicators.length} Pillar 6 indicator area${dominantIndicators.length === 1 ? "" : "s"}.`;
  const qualifier =
    uncertaintyLevel === "High"
      ? " Several conclusions still need human confirmation before business teams should rely on them."
      : uncertaintyLevel === "Moderate"
        ? " Business planning can proceed, but teams should validate exceptions and trigger conditions."
        : " The resulting risk picture is relatively stable for planning and cost discussion.";

  return `${summary}${qualifier}`;
}

function success<T>(
  agentId: AgentResult<T>["agentId"],
  data: T,
  message: string,
  downstreamAgent?: AgentResult<T>["downstreamAgent"]
): AgentResult<T> {
  return {
    status: "success",
    agentId,
    data,
    message,
    downstreamAgent
  };
}

function getCountryProfile(country: SupportedCountry): CountryPolicyProfile {
  return structuredClone(countryPolicyProfiles[country]);
}

function toRiskLabel(restrictionScore: number): RiskLevel {
  if (restrictionScore >= 70) {
    return "High";
  }

  if (restrictionScore >= 45) {
    return "Moderate";
  }

  return "Low";
}

function calculateRestrictionScore(profile: CountryPolicyProfile) {
  const rdtii =
    profile.rdtiiStyleScore.banLocalProcessing * 38 +
    profile.rdtiiStyleScore.localStorage * 12 +
    profile.rdtiiStyleScore.infrastructureRequirement * 31 +
    profile.rdtiiStyleScore.conditionalFlowRegime * 12 +
    profile.rdtiiStyleScore.bindingAgreementGap * 8;

  return Math.min(100, Math.round(rdtii));
}

function compareMetricRows(
  countryA: CountryPolicyProfile,
  countryB: CountryPolicyProfile
): ComparisonRow[] {
  return [
    {
      metric: "Transfer model",
      countryA: countryA.dataTransferPolicy,
      countryB: countryB.dataTransferPolicy,
      insight: "This row explains how each market frames outbound or inbound data movement in the current analysis."
    },
    {
      metric: "Localization",
      countryA: countryA.localizationRules,
      countryB: countryB.localizationRules,
      insight: "Localization friction is usually the fastest way to spot infrastructure and operating cost gaps."
    },
    {
      metric: "Approval mechanism",
      countryA: countryA.approvalMechanism,
      countryB: countryB.approvalMechanism,
      insight: "Approval intensity reveals how much legal review and pre-launch sequencing a team may need."
    },
    {
      metric: "Business impact",
      countryA: countryA.businessImpact,
      countryB: countryB.businessImpact,
      insight: "This is an operating-cost proxy that a product or expansion team can act on quickly."
    },
    {
      metric: "Openness score",
      countryA: `${countryA.opennessScore}/100`,
      countryB: `${countryB.opennessScore}/100`,
      insight: "Higher openness scores suggest less friction for cross-border digital scaling."
    },
    {
      metric: "Risk level",
      countryA: countryA.riskLevel,
      countryB: countryB.riskLevel,
      insight: "The risk level combines policy restrictiveness with likely compliance complexity in the current analysis."
    }
  ];
}

export async function researchAgent(country: SupportedCountry): Promise<CountryPolicyProfile> {
  await wait(700);
  return getCountryProfile(country);
}

export async function policyAnalysisAgent(
  data: CountryPolicyProfile
): Promise<PolicyAnalysisResult> {
  await wait(900);

  const restrictionScore = calculateRestrictionScore(data);
  const riskLevel = toRiskLabel(restrictionScore);
  const complianceBurden =
    restrictionScore >= 70 ? "Heavy" : restrictionScore >= 45 ? "Managed" : "Lean";

  return {
    country: data.country,
    riskLevel,
    restrictionScore,
    opennessScore: data.opennessScore,
    complianceBurden,
    executiveSummary: `${data.country} shows a ${riskLevel.toLowerCase()}-risk cross-border data posture, combining an openness score of ${data.opennessScore}/100 with a restrictiveness score of ${restrictionScore}/100.`,
    strengths: [
      `Privacy framework signal: ${data.privacyFramework}`,
      `Strategic outlook: ${data.strategicOutlook}`
    ],
    watchpoints: [
      `Transfer friction: ${data.dataTransferPolicy}`,
      `Localization watchpoint: ${data.localizationRules}`,
      `Approval watchpoint: ${data.approvalMechanism}`
    ],
    recommendedActions: [
      "Map data categories before selecting cloud or routing architecture.",
      "Document transfer logic and third-party handling before market launch.",
      "Use a phased compliance checklist instead of treating cross-border data as a single issue."
    ]
  };
}

export async function comparisonAgent(
  countryA: SupportedCountry,
  countryB: SupportedCountry
): Promise<ComparisonAgentResult> {
  await wait(850);

  const profileA = getCountryProfile(countryA);
  const profileB = getCountryProfile(countryB);

  return {
    comparedCountries: [countryA, countryB],
    headline: `${countryA} and ${countryB} differ most clearly on transfer openness, localization expectations, and approval intensity.`,
    winnerOnOpenness:
      profileA.opennessScore >= profileB.opennessScore ? profileA.country : profileB.country,
    higherRiskCountry:
      calculateRestrictionScore(profileA) >= calculateRestrictionScore(profileB)
        ? profileA.country
        : profileB.country,
    rows: compareMetricRows(profileA, profileB)
  };
}

export async function reportAgent(results: {
  research: ResearchAgentResult;
  policyAnalysis: PolicyAnalysisResult[];
  comparison: ComparisonAgentResult | null;
}): Promise<ReportAgentResult> {
  await wait(800);

  const highestRiskScore = Math.max(...results.policyAnalysis.map((item) => item.restrictionScore));
  const overallRisk = toRiskLabel(highestRiskScore);
  const comparisonTable = results.comparison?.rows ?? [];
  const primaryAnalysis = results.policyAnalysis[0];
  const provider = getAnalysisProvider();
  const fallbackNarrative = results.comparison
    ? `The multi-agent workflow indicates that ${results.comparison.higherRiskCountry} carries the heavier cross-border compliance load in this scenario, while ${results.comparison.winnerOnOpenness} appears more open for scalable digital operations. ${primaryAnalysis.executiveSummary}`
    : `The workflow indicates a ${overallRisk.toLowerCase()}-risk posture for ${primaryAnalysis.country}. ${primaryAnalysis.executiveSummary}`;
  const fallbackRecommendations = [
    "Design market entry plans around the strictest transfer pathway rather than the average case.",
    "Separate privacy, localization, and approval obligations into different workstreams for faster execution.",
    "Prioritize interoperable markets for pilot launches, then expand into higher-friction jurisdictions with localized controls.",
    "Keep structured agent outputs so that providers and evidence pipelines can be swapped without breaking the review UI."
  ];

  const structuredReport = await provider.generateStructuredObject<{
    title: string;
    finalNarrative: string;
    policyRecommendations: string[];
  }>({
    schemaName: "pillar6_report",
    schemaDescription: "Judge-facing Pillar 6 report summary for the current analysis run.",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "finalNarrative", "policyRecommendations"],
      properties: {
        title: { type: "string" },
        finalNarrative: { type: "string" },
        policyRecommendations: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    instructions:
      "Produce a concise, evidence-aware report summary for a Pillar 6 cross-border data policy analysis. Do not invent jurisdictions, evidence, or source claims.",
    input: JSON.stringify({
      researchSummary: results.research.summary,
      policyAnalysis: results.policyAnalysis,
      comparison: results.comparison,
      overallRisk
    }),
    fallback: {
      title: "Cross-Border Data Policy Multi-Agent Report",
      finalNarrative: fallbackNarrative,
      policyRecommendations: fallbackRecommendations
    }
  });

  return {
    title: structuredReport.object.title,
    overallRisk,
    finalNarrative: structuredReport.object.finalNarrative,
    comparisonTable,
    policyRecommendations: structuredReport.object.policyRecommendations
  };
}

export function intentArbiterAgent(input: {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  userQuery: string;
}): AgentResult<IntentArbiterOutput> {
  const workflowMode = input.countryB ? "cross-jurisdiction" : "single-jurisdiction";
  const focusIndicators = ALL_PILLAR6_INDICATORS.filter((indicator) => {
    const query = `${input.userQuery} ${input.businessScenario}`.toLowerCase();

    if (query.includes("storage") || query.includes("localization")) {
      return indicator === "P6_2_LOCAL_STORAGE" || indicator === "P6_3_INFRASTRUCTURE";
    }

    if (query.includes("agreement") || query.includes("commitment")) {
      return indicator === "P6_5_BINDING_COMMITMENT";
    }

    if (query.includes("approval") || query.includes("condition") || query.includes("transfer")) {
      return indicator === "P6_4_CONDITIONAL_FLOW";
    }

    return true;
  });

  return success(
    "intent-arbiter",
    {
      normalizedIntent: `Assess ${input.businessScenario} cross-border data policy constraints for ${input.countryA}${
        input.countryB ? ` and ${input.countryB}` : ""
      } under Pillar 6.`,
      workflowMode,
      pillar6ScopeConfirmed: true,
      focusIndicators: focusIndicators.length ? focusIndicators : ALL_PILLAR6_INDICATORS
    },
    "Intent normalized and constrained to Pillar 6.",
    "source-discovery"
  );
}

export function sourceDiscoveryAgent(input: {
  evidenceRecords: EvidenceRecord[];
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  focusIndicators: Pillar6IndicatorEnum[];
}): AgentResult<{ candidateSources: CandidateSource[] }> {
  const candidateSources = filterEvidenceByCountries(
    input.evidenceRecords,
    input.countryA,
    input.countryB ?? ""
  )
    .filter((record) => input.focusIndicators.includes(record.indicatorCode))
    .map((record) => ({
      sourceId: `SRC-${record.evidenceId}`,
      evidenceId: record.evidenceId,
      title: record.lawTitle,
      jurisdiction: record.country,
      sourceType: record.sourceType,
      sourceUrl: record.sourceUrl,
      relevanceNote: `Candidate source for ${record.indicatorCode} based on ${record.discoveryTags.join(
        ", "
      )}.`
    }));

  return success(
    "source-discovery",
    { candidateSources },
    "Candidate legal sources selected from the current Pillar 6 evidence set.",
    "document-reader"
  );
}

export function documentReaderAgent(input: {
  evidenceRecords: EvidenceRecord[];
  candidateSources: CandidateSource[];
}): AgentResult<DocumentReaderOutput> {
  const passages = input.candidateSources.flatMap((source) => {
    const record = input.evidenceRecords.find((item) => item.evidenceId === source.evidenceId);

    if (!record) {
      return [];
    }

    return [
      {
        evidenceId: record.evidenceId,
        sourceId: source.sourceId,
        lawTitle: record.lawTitle,
        citationRef: record.citation,
        sourceUrl: record.sourceUrl,
        text: record.originalLegalText
      }
    ];
  });

  return success(
    "document-reader",
    { passages },
    "Candidate sources normalized into citation-ready legal passages.",
    "indicator-mapping"
  );
}

export function indicatorMappingAgent(input: {
  evidenceRecords: EvidenceRecord[];
  passages: DocumentReaderOutput["passages"];
}): AgentResult<IndicatorMappingOutput> {
  const mappedEvidence: MappedEvidenceItem[] = input.passages.flatMap((passage) => {
    const record = input.evidenceRecords.find((item) => item.evidenceId === passage.evidenceId);

    if (!record) {
      return [];
    }

    return [
      {
        evidenceId: record.evidenceId,
        indicatorId: record.indicatorCode,
        mappingReason: record.mappingRationale,
        citationRef: record.citation
      }
    ];
  });

  return success(
    "indicator-mapping",
    { mappedEvidence },
    "Legal passages mapped to canonical Pillar 6 indicator codes.",
    "legal-reasoner"
  );
}

export async function legalReasonerAgent(input: {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  userQuery: string;
  evidenceRecords: EvidenceRecord[];
  mappedEvidence: MappedEvidenceItem[];
}): Promise<AgentResult<LegalReasonerOutput>> {
  const provider = getAnalysisProvider();
  const evidencePayload = input.mappedEvidence.flatMap((item) => {
    const record = getEvidenceRecord(item.evidenceId, input.evidenceRecords);

    if (!record) {
      return [];
    }

    return [
      {
        evidenceId: record.evidenceId,
        jurisdiction: record.country,
        indicatorId: item.indicatorId,
        lawTitle: record.lawTitle,
        citationRef: record.citation,
        sourceUrl: record.sourceUrl,
        excerpt: record.verbatimSnippet,
        analystNote: record.aiExtraction,
        legalEffectHint: record.riskImplication,
        mappingReason: item.mappingReason,
        reviewStatus: record.reviewStatus,
        confidence: record.confidence
      }
    ];
  });

  const fallback = buildLegalFindingsFallback(input.mappedEvidence, input.evidenceRecords);
  const structuredReasoning = await provider.generateStructuredObject<LegalReasonerOutput>({
    schemaName: "pillar6_legal_findings",
    schemaDescription: "Structured Pillar 6 legal findings grounded in retrieved evidence.",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["legalFindings"],
      properties: {
        legalFindings: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "conclusionId",
              "jurisdiction",
              "indicatorId",
              "conclusion",
              "legalEffect",
              "evidenceIds"
            ],
            properties: {
              conclusionId: { type: "string" },
              jurisdiction: { type: "string" },
              indicatorId: {
                type: "string",
                enum: ALL_PILLAR6_INDICATORS
              },
              conclusion: { type: "string" },
              legalEffect: { type: "string" },
              evidenceIds: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        }
      }
    },
    instructions:
      "You are a legal-analysis agent for UN ESCAP RDTII Pillar 6. Produce cautious, evidence-bound conclusions only from the supplied evidence. If evidence is ambiguous, say so in the conclusion or legal effect rather than overstating certainty.",
    input: JSON.stringify({
      countries: dedupeStrings([input.countryA, input.countryB ?? ""]),
      businessScenario: input.businessScenario,
      userQuery: input.userQuery,
      mappedEvidence: evidencePayload
    }),
    fallback
  });
  const legalFindings = structuredReasoning.object.legalFindings.flatMap((finding, index) => {
    const validEvidenceIds = finding.evidenceIds.filter((evidenceId) =>
      input.evidenceRecords.some((record) => record.evidenceId === evidenceId)
    );
    const fallbackFinding = fallback.legalFindings[index];
    const normalizedEvidenceIds =
      validEvidenceIds.length > 0 ? validEvidenceIds : fallbackFinding?.evidenceIds ?? [];

    if (normalizedEvidenceIds.length === 0) {
      return [];
    }

    return [
      {
        ...finding,
        conclusionId: finding.conclusionId || fallbackFinding?.conclusionId || `CON-${index + 1}`,
        jurisdiction: finding.jurisdiction || fallbackFinding?.jurisdiction || input.countryA,
        legalEffect: finding.legalEffect || fallbackFinding?.legalEffect || "",
        conclusion: finding.conclusion || fallbackFinding?.conclusion || "",
        evidenceIds: normalizedEvidenceIds
      }
    ];
  });

  return success(
    "legal-reasoner",
    {
      legalFindings: legalFindings.length > 0 ? legalFindings : fallback.legalFindings
    },
    "Evidence-backed legal findings generated for downstream risk and audit agents.",
    "risk-cost-quantifier"
  );
}

export async function runMainlineAgents(input: {
  evidenceRecords: EvidenceRecord[];
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  userQuery: string;
}): Promise<MainlineAgentResults> {
  const intentArbiter = intentArbiterAgent(input);
  const sourceDiscovery = sourceDiscoveryAgent({
    evidenceRecords: input.evidenceRecords,
    countryA: input.countryA,
    countryB: input.countryB,
    focusIndicators: intentArbiter.data?.focusIndicators ?? ALL_PILLAR6_INDICATORS
  });
  const documentReader = documentReaderAgent({
    evidenceRecords: input.evidenceRecords,
    candidateSources: sourceDiscovery.data?.candidateSources ?? []
  });
  const indicatorMapping = indicatorMappingAgent({
    evidenceRecords: input.evidenceRecords,
    passages: documentReader.data?.passages ?? []
  });
  const legalReasoner = await legalReasonerAgent({
    countryA: input.countryA,
    countryB: input.countryB,
    businessScenario: input.businessScenario,
    userQuery: input.userQuery,
    evidenceRecords: input.evidenceRecords,
    mappedEvidence: indicatorMapping.data?.mappedEvidence ?? []
  });

  return {
    intentArbiter,
    sourceDiscovery,
    documentReader,
    indicatorMapping,
    legalReasoner
  };
}

export function queryBuilderAgent(input: {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  userQuery: string;
  intent: IntentArbiterOutput;
}): AgentResult<QueryBuilderOutput> {
  const preferredSources = preferredSourceOptions.filter((source) => {
    if (input.intent.focusIndicators.includes("P6_5_BINDING_COMMITMENT")) {
      return true;
    }

    return source !== "International agreement database";
  });

  const profile = buildSearchProfile({
    jurisdiction: input.countryA,
    businessScenario: input.businessScenario,
    plainLanguageQuery: input.userQuery,
    aiGeneratedTerms: buildAiSuggestedTerms(input.countryA, input.businessScenario),
    lawStudentTerms: input.countryB
      ? `${input.countryB} transfer pathway, comparison evidence`
      : "transfer mechanism, regulator approval",
    exclusionTerms: "tax data, telecom tariffs, customs duty",
    preferredSources,
    focusIndicators: input.intent.focusIndicators,
    normalizedIntent: input.intent.normalizedIntent
  });

  return success(
    "query-builder",
    toQueryBuilderOutput(profile),
    "Structured query plan prepared for supporting review and search tuning.",
    "source-discovery"
  );
}

export function relevanceFilterAgent(input: {
  evidenceRecords: EvidenceRecord[];
  focusIndicators: Pillar6IndicatorEnum[];
  passages: DocumentReaderOutput["passages"];
}): AgentResult<RelevanceFilterOutput> {
  const filteredOutEvidenceIds: string[] = [];
  const shortlistedPassages = input.passages.flatMap((passage) => {
    const record = getEvidenceRecord(passage.evidenceId, input.evidenceRecords);

    if (!record || !input.focusIndicators.includes(record.indicatorCode)) {
      filteredOutEvidenceIds.push(passage.evidenceId);
      return [];
    }

    const relevanceBand = getRelevanceBand(record);
    const humanReviewNeeded = relevanceBand === "Borderline" || record.reviewStatus !== "Approved";

    return [
      {
        evidenceId: passage.evidenceId,
        sourceId: passage.sourceId,
        jurisdiction: record.country,
        indicatorId: record.indicatorCode,
        lawTitle: passage.lawTitle,
        citationRef: passage.citationRef,
        sourceUrl: passage.sourceUrl,
        sourceType: record.sourceType,
        text: passage.text,
        relevanceReason: buildRelevanceReason(record.indicatorCode),
        relevanceBand,
        humanReviewNeeded,
        reviewerPrompt: buildRelevanceReviewerPrompt(record)
      }
    ];
  });

  return success(
    "relevance-filter",
    {
      shortlistedPassages,
      filteredOutEvidenceIds,
      reviewSummary: {
        shortlistedCount: shortlistedPassages.length,
        filteredOutCount: filteredOutEvidenceIds.length,
        humanReviewCount: shortlistedPassages.filter((item) => item.humanReviewNeeded).length
      },
      reviewerChecklist: [
        "Confirm every shortlisted passage still belongs to Pillar 6 rather than general privacy compliance.",
        "Escalate borderline infrastructure or supervision passages to human review before export.",
        "Only pass fully understood passages into the final audit and export package."
      ]
    },
    "Mainline passages filtered down to transfer-relevant Pillar 6 evidence.",
    "indicator-mapping"
  );
}

export function riskCostQuantifierAgent(input: {
  evidenceRecords: EvidenceRecord[];
  jurisdiction: SupportedCountry;
  legalFindings: LegalReasonerOutput["legalFindings"];
}): AgentResult<RiskCostQuantifierOutput> {
  const highestRiskFinding = input.legalFindings.reduce<number>((current, finding) => {
    const score =
      finding.indicatorId === "P6_1_BAN_LOCAL_PROCESSING" ||
      finding.indicatorId === "P6_2_LOCAL_STORAGE"
        ? 3
        : finding.indicatorId === "P6_3_INFRASTRUCTURE" ||
            finding.indicatorId === "P6_4_CONDITIONAL_FLOW"
          ? 2
          : 1;
    const reviewPenalty = finding.evidenceIds.some(
      (evidenceId) => getEvidenceRecord(evidenceId, input.evidenceRecords)?.reviewStatus !== "Approved"
    )
      ? 1
      : 0;

    return Math.max(current, score + reviewPenalty);
  }, 0);

  const riskLevel: RiskLevel =
    highestRiskFinding >= 4 ? "High" : highestRiskFinding >= 2 ? "Moderate" : "Low";
  const uncertaintyLevel = getUncertaintyLevel(input.legalFindings, input.evidenceRecords);
  const riskSummary: RiskSummary = {
    riskLevel,
    businessCostDrivers: getCostDrivers(input.legalFindings, input.evidenceRecords),
    operationalImpact: summarizeOperationalImpact(
      input.legalFindings,
      riskLevel,
      uncertaintyLevel
    ),
    uncertaintyLevel,
    humanReviewNeeded: needsHumanReview(input.legalFindings, input.evidenceRecords)
  };

  return success(
    "risk-cost-quantifier",
    { riskSummary },
    "Mainline legal findings translated into business-facing risk and cost signals.",
    "audit-citation"
  );
}

export function auditCitationAgent(input: {
  evidenceRecords: EvidenceRecord[];
  shortlistedPassages: RelevanceFilterOutput["shortlistedPassages"];
  legalFindings: LegalReasonerOutput["legalFindings"];
}): AgentResult<AuditCitationOutput> {
  const auditItems: AuditCitationItem[] = input.legalFindings.flatMap((finding) => {
    const evidenceId = finding.evidenceIds[0];
    const shortlistItem = input.shortlistedPassages.find((item) => item.evidenceId === evidenceId);
    const record = evidenceId ? getEvidenceRecord(evidenceId, input.evidenceRecords) : null;

    if (!shortlistItem || !record) {
      return [];
    }

    const humanReviewNeeded =
      shortlistItem.humanReviewNeeded || record.reviewStatus !== "Approved";
    const traceabilityStatus = humanReviewNeeded ? "Needs Human Review" : "Complete";

    return [
      {
        evidenceId,
        sourceId: shortlistItem.sourceId,
        conclusionId: finding.conclusionId,
        jurisdiction: record.country,
        indicatorId: finding.indicatorId,
        lawTitle: shortlistItem.lawTitle,
        citationRef: shortlistItem.citationRef,
        sourceUrl: shortlistItem.sourceUrl,
        originalLegalText: shortlistItem.text,
        verbatimSnippet: record.verbatimSnippet,
        extractedClaim: finding.conclusion,
        legalEffect: finding.legalEffect,
        relevanceReason: shortlistItem.relevanceReason,
        traceabilityStatus,
        traceabilityNote: buildTraceabilityNote(record.reviewStatus, humanReviewNeeded),
        humanReviewNeeded,
        reviewerNote: record.reviewerNote,
        reviewStatus: record.reviewStatus
      }
    ];
  });

  return success(
    "audit-citation",
    {
      auditItems,
      coverageSummary: {
        totalFindings: input.legalFindings.length,
        linkedFindings: auditItems.length,
        needsReviewCount: auditItems.filter((item) => item.humanReviewNeeded).length
      }
    },
    "Mainline findings stitched back to legal text, citations, and reviewer context.",
    "legal-review-export"
  );
}

export function legalReviewExportAgent(input: {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  auditItems: AuditCitationItem[];
  riskSummary: RiskSummary;
  comparison: ComparisonAgentResult | null;
}): AgentResult<{
  finalReport: string;
  judgeSummary: string;
  exportReadiness: "Ready for Judge Review" | "Needs Human Review";
  reviewSummary: {
    approvedCount: number;
    needsRevisionCount: number;
    rejectedCount: number;
    humanReviewCount: number;
  };
  exportJson: Record<string, unknown>;
  exportCsvRows: Array<Record<string, string | number>>;
  exportMarkdown: string;
}> {
  const mappedIndicators = [...new Set(input.auditItems.map((item) => item.indicatorId))];
  const approvedCount = input.auditItems.filter((item) => item.reviewStatus === "Approved").length;
  const needsRevisionCount = input.auditItems.filter(
    (item) => item.reviewStatus === "Needs Revision"
  ).length;
  const rejectedCount = input.auditItems.filter((item) => item.reviewStatus === "Rejected").length;
  const humanReviewCount = input.auditItems.filter((item) => item.humanReviewNeeded).length;
  const exportReadiness =
    humanReviewCount > 0 || needsRevisionCount > 0 || rejectedCount > 0
      ? "Needs Human Review"
      : "Ready for Judge Review";
  const finalReport = input.comparison
    ? `${input.businessScenario} scenario review across ${input.countryA} and ${input.countryB} indicates ${input.riskSummary.riskLevel.toLowerCase()} risk with ${mappedIndicators.length} mapped Pillar 6 indicator areas.`
    : `${input.businessScenario} scenario review for ${input.countryA} indicates ${input.riskSummary.riskLevel.toLowerCase()} risk with ${mappedIndicators.length} mapped Pillar 6 indicator areas.`;
  const judgeSummary = `${finalReport} ${approvedCount} evidence item(s) are approved for presentation, while ${humanReviewCount} item(s) still need human legal review.`;
  const reviewSummary = {
    approvedCount,
    needsRevisionCount,
    rejectedCount,
    humanReviewCount
  };
  const exportJson = {
    scope: "Pillar 6",
    jurisdictions: [input.countryA, input.countryB].filter(Boolean),
    mappedIndicators,
    exportReadiness,
    reviewSummary,
    riskSummary: input.riskSummary,
    auditItems: input.auditItems
  };
  const exportCsvRows = input.auditItems.map((item) => ({
    evidenceId: item.evidenceId,
    citationRef: item.citationRef,
    indicatorId: item.indicatorId,
    reviewStatus: item.reviewStatus,
    traceabilityStatus: item.traceabilityStatus,
    riskLevel: input.riskSummary.riskLevel
  }));
  const exportMarkdown = [
    "# Pillar 6 Review Package",
    "",
    `- Scenario: ${input.businessScenario}`,
    `- Primary jurisdiction: ${input.countryA}`,
    input.countryB ? `- Comparison jurisdiction: ${input.countryB}` : null,
    `- Risk level: ${input.riskSummary.riskLevel}`,
    `- Uncertainty: ${input.riskSummary.uncertaintyLevel}`,
    `- Export readiness: ${exportReadiness}`,
    "",
    "## Review Summary",
    `- Approved: ${approvedCount}`,
    `- Needs revision: ${needsRevisionCount}`,
    `- Rejected: ${rejectedCount}`,
    `- Human review needed: ${humanReviewCount}`,
    "",
    "## Audit Items",
    ...input.auditItems.flatMap((item) => [
      `### ${item.lawTitle} (${item.citationRef})`,
      `- Indicator: ${item.indicatorId}`,
      `- Review status: ${item.reviewStatus}`,
      `- Traceability status: ${item.traceabilityStatus}`,
      `- Source URL: ${item.sourceUrl}`,
      "",
      item.verbatimSnippet,
      "",
      `AI claim: ${item.extractedClaim}`,
      `Legal effect: ${item.legalEffect}`,
      `Traceability note: ${item.traceabilityNote}`,
      `Reviewer note: ${item.reviewerNote}`,
      ""
    ])
  ]
    .filter(Boolean)
    .join("\n");

  return success(
    "legal-review-export",
    {
      finalReport,
      judgeSummary,
      exportReadiness,
      reviewSummary,
      exportJson,
      exportCsvRows,
      exportMarkdown
    },
    "Audit chain and reviewer context packaged into export-ready deliverables."
  );
}

export function runSupportingAgents(input: {
  evidenceRecords: EvidenceRecord[];
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  userQuery: string;
  mainlineAgentResults: MainlineAgentResults;
  comparison: ComparisonAgentResult | null;
}): SupportingAgentResults {
  const intent =
    input.mainlineAgentResults.intentArbiter.data ?? {
      normalizedIntent: input.userQuery,
      workflowMode: input.countryB ? "cross-jurisdiction" : "single-jurisdiction",
      pillar6ScopeConfirmed: true,
      focusIndicators: ALL_PILLAR6_INDICATORS
    };

  const queryBuilder = queryBuilderAgent({
    countryA: input.countryA,
    countryB: input.countryB,
    businessScenario: input.businessScenario,
    userQuery: input.userQuery,
    intent
  });
  const relevanceFilter = relevanceFilterAgent({
    evidenceRecords: input.evidenceRecords,
    focusIndicators: intent.focusIndicators,
    passages: input.mainlineAgentResults.documentReader.data?.passages ?? []
  });
  const riskCostQuantifier = riskCostQuantifierAgent({
    evidenceRecords: input.evidenceRecords,
    jurisdiction: input.countryA,
    legalFindings: input.mainlineAgentResults.legalReasoner.data?.legalFindings ?? []
  });
  const auditCitation = auditCitationAgent({
    evidenceRecords: input.evidenceRecords,
    shortlistedPassages: relevanceFilter.data?.shortlistedPassages ?? [],
    legalFindings: input.mainlineAgentResults.legalReasoner.data?.legalFindings ?? []
  });
  const legalReviewExport = legalReviewExportAgent({
    countryA: input.countryA,
    countryB: input.countryB,
    businessScenario: input.businessScenario,
    auditItems: auditCitation.data?.auditItems ?? [],
    riskSummary:
      riskCostQuantifier.data?.riskSummary ?? {
        riskLevel: "Low",
        businessCostDrivers: [],
        operationalImpact: "No downstream legal findings were available for business-risk packaging.",
        uncertaintyLevel: "Low",
        humanReviewNeeded: false
      },
    comparison: input.comparison
  });

  return {
    queryBuilder,
    relevanceFilter,
    riskCostQuantifier,
    auditCitation,
    legalReviewExport
  };
}

function nextAgent(agentId: TenAgentId): TenAgentId | null {
  const index = TEN_AGENT_ORDER.indexOf(agentId);

  return TEN_AGENT_ORDER[index + 1] ?? null;
}

function buildTenAgentTrace(input: {
  evidenceRecords: EvidenceRecord[];
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  userQuery: string;
  policyAnalysis: PolicyAnalysisResult[];
  riskSummary?: RiskSummary | null;
}): WorkflowAgentTrace[] {
  const countries = [input.countryA, input.countryB].filter(Boolean).join(" and ");
  const evidenceIds = filterEvidenceByCountries(
    input.evidenceRecords,
    input.countryA,
    input.countryB ?? ""
  ).map((record) => record.evidenceId);
  const approvedEvidenceIds = filterEvidenceByCountries(
    input.evidenceRecords,
    input.countryA,
    input.countryB ?? ""
  )
    .filter((record) => record.reviewStatus === "Approved")
    .map((record) => record.evidenceId);

  return [
    {
      agentId: "intent-arbiter",
      name: agentNames["intent-arbiter"],
      inputSummary: `${countries} | ${input.businessScenario} | ${input.userQuery}`,
      outputSummary: "Classifies the request as a Pillar 6 cross-border data policy workflow.",
      evidenceIds: [],
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Confirm Pillar 6 scope before retrieval"
      },
      nextAgent: nextAgent("intent-arbiter")
    },
    {
      agentId: "query-builder",
      name: agentNames["query-builder"],
      inputSummary: "Normalized Pillar 6 intent, jurisdiction, scenario, and review terms.",
      outputSummary: "Builds search queries and lets law students revise specialist legal terms.",
      evidenceIds: [],
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Revise search terms before discovery"
      },
      nextAgent: nextAgent("query-builder")
    },
    {
      agentId: "source-discovery",
      name: agentNames["source-discovery"],
      inputSummary: "Search Profile JSON with preferred official source types.",
      outputSummary: "Ranks candidate statutes, regulator guidance, official portals, and treaties.",
      evidenceIds,
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Spot-check official source authority"
      },
      nextAgent: nextAgent("source-discovery")
    },
    {
      agentId: "document-reader",
      name: agentNames["document-reader"],
      inputSummary: "Candidate sources with URL, title, jurisdiction, and source type.",
      outputSummary: "Normalizes source text into citation-ready passages.",
      evidenceIds,
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Confirm parsing quality"
      },
      nextAgent: nextAgent("document-reader")
    },
    {
      agentId: "relevance-filter",
      name: agentNames["relevance-filter"],
      inputSummary: "Parsed passages plus Pillar 6 focus indicators.",
      outputSummary: "Removes domestic privacy-only material and keeps transfer-policy evidence.",
      evidenceIds,
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Approve relevance shortlist"
      },
      nextAgent: nextAgent("relevance-filter")
    },
    {
      agentId: "indicator-mapping",
      name: agentNames["indicator-mapping"],
      inputSummary: "Shortlisted evidence snippets and canonical Pillar 6 indicator enum.",
      outputSummary: "Maps every retained evidence item to one of the five Pillar 6 codes.",
      evidenceIds,
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Approve indicator mapping"
      },
      nextAgent: nextAgent("indicator-mapping")
    },
    {
      agentId: "legal-reasoner",
      name: agentNames["legal-reasoner"],
      inputSummary: "Mapped evidence, original text lookup, and jurisdiction context.",
      outputSummary: "Produces if-then legal conclusions bound to evidence IDs.",
      evidenceIds,
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Review legal conclusion"
      },
      nextAgent: nextAgent("legal-reasoner")
    },
    {
      agentId: "risk-cost-quantifier",
      name: agentNames["risk-cost-quantifier"],
      inputSummary:
        "Legal conclusions with transfer gates, localization signals, uncertainty levels, and review flags.",
      outputSummary: input.riskSummary
        ? `Summarizes risk as ${input.riskSummary.riskLevel} with ${input.riskSummary.businessCostDrivers.length} main cost driver(s).`
        : `Summarizes risk as ${input.policyAnalysis
            .map((item) => `${item.country}: ${item.riskLevel}`)
            .join(", ")}.`,
      evidenceIds,
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Review business impact"
      },
      nextAgent: nextAgent("risk-cost-quantifier")
    },
    {
      agentId: "audit-citation",
      name: agentNames["audit-citation"],
      inputSummary: "Risk findings plus evidence lookup with source URLs and citation anchors.",
      outputSummary: "Builds side-by-side audit items linking each AI claim to legal source text.",
      evidenceIds,
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Approve citation chain"
      },
      nextAgent: nextAgent("audit-citation")
    },
    {
      agentId: "legal-review-export",
      name: agentNames["legal-review-export"],
      inputSummary: "Approved audit items, reviewer notes, and risk summary.",
      outputSummary: "Packages JSON, CSV, and Markdown exports from reviewed Pillar 6 evidence.",
      evidenceIds: approvedEvidenceIds,
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Confirm export package"
      },
      nextAgent: nextAgent("legal-review-export")
    }
  ];
}

function buildDemoNarrative(input: {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
}): DemoNarrative {
  return {
    title: `${input.businessScenario} cross-border data transfer review`,
    scenario: `A ${input.businessScenario} team wants to understand whether data can move from ${input.countryA}${
      input.countryB ? ` to ${input.countryB}` : ""
    } while staying inside UN ESCAP RDTII Pillar 6 scope.`,
    primaryJurisdiction: input.countryA,
    comparisonJurisdiction: input.countryB ?? null,
    walkthrough: [
      "Start in Legal Search Workspace and generate a Search Profile JSON.",
      "Use the ten-agent trace to explain how evidence flows through discovery, filtering, mapping, reasoning, audit, and export.",
      "Open Evidence Audit View to compare original legal text with the AI claim and Pillar 6 mapping.",
      "Let a law student approve, revise, or reject the evidence before exporting the final package."
    ],
    successCriteria: [
      "All mapped evidence uses only the five canonical Pillar 6 indicator codes.",
      "Every legal conclusion can be traced to an evidence ID, source URL, and citation.",
      "The export bundle reflects reviewer status and reviewer notes."
    ]
  };
}

export async function runMultiAgentWorkflow(
  countryA: SupportedCountry,
  countryB?: SupportedCountry | null,
  options?: {
    businessScenario?: string;
    userQuery?: string;
  }
): Promise<WorkflowResult> {
  const businessScenario = options?.businessScenario ?? "fintech";
  const userQuery =
    options?.userQuery ??
    "Find legal evidence describing how cross-border data transfers are permitted, conditioned, or restricted.";
  const provider = getAnalysisProvider();
  const resolvedEvidence = await resolveEvidenceContext(countryA, countryB);
  const mainlineAgentResults = await runMainlineAgents({
    evidenceRecords: resolvedEvidence.evidenceRecords,
    countryA,
    countryB,
    businessScenario,
    userQuery
  });
  const firstProfile = await researchAgent(countryA);
  const secondProfile = countryB ? await researchAgent(countryB) : null;

  const research: ResearchAgentResult = {
    profiles: secondProfile ? [firstProfile, secondProfile] : [firstProfile],
    summary: secondProfile
      ? `Research Agent assembled a Pillar 6-aligned policy snapshot for ${countryA} and ${countryB}.`
      : `Research Agent assembled a Pillar 6-aligned policy snapshot for ${countryA}.`,
    sourceBasis: dedupeStrings([...SOURCE_BASIS, ...resolvedEvidence.sourceBasis])
  };

  const policyAnalysis = [
    await policyAnalysisAgent(firstProfile),
    ...(secondProfile ? [await policyAnalysisAgent(secondProfile)] : [])
  ];

  const comparison = countryB ? await comparisonAgent(countryA, countryB) : null;

  const report = await reportAgent({
    research,
    policyAnalysis,
    comparison
  });
  const supportingAgentResults = runSupportingAgents({
    evidenceRecords: resolvedEvidence.evidenceRecords,
    countryA,
    countryB,
    businessScenario,
    userQuery,
    mainlineAgentResults,
    comparison
  });

  return {
    analysisRunId: null,
    providerId: provider.id,
    providerModel: provider.model,
    evidenceSourceMode: resolvedEvidence.sourceMode,
    evidenceRecords: resolvedEvidence.evidenceRecords,
    input: {
      countryA,
      countryB,
      businessScenario,
      userQuery
    },
    research,
    policyAnalysis,
    comparison,
    report,
    mainlineAgentResults,
    supportingAgentResults,
    agentTrace: buildTenAgentTrace({
      evidenceRecords: resolvedEvidence.evidenceRecords,
      countryA,
      countryB,
      businessScenario,
      userQuery,
      policyAnalysis,
      riskSummary: supportingAgentResults.riskCostQuantifier.data?.riskSummary ?? null
    }),
    demoNarrative: buildDemoNarrative({
      countryA,
      countryB,
      businessScenario
    }),
    generatedAt: new Date().toISOString()
  };
}

export function applyReviewUpdateToWorkflowResult(
  workflowResult: WorkflowResult,
  reviewUpdate: {
    evidenceId: string;
    reviewStatus: EvidenceRecord["reviewStatus"];
    reviewerNote: string;
  }
): WorkflowResult {
  const nextEvidenceRecords = workflowResult.evidenceRecords.map((record) =>
    record.evidenceId === reviewUpdate.evidenceId
      ? {
          ...record,
          reviewStatus: reviewUpdate.reviewStatus,
          reviewerNote: reviewUpdate.reviewerNote
        }
      : record
  );

  const nextMainlineAgentResults = {
    ...workflowResult.mainlineAgentResults
  };
  const nextSupportingAgentResults = runSupportingAgents({
    evidenceRecords: nextEvidenceRecords,
    countryA: workflowResult.input.countryA,
    countryB: workflowResult.input.countryB,
    businessScenario: workflowResult.input.businessScenario,
    userQuery: workflowResult.input.userQuery,
    mainlineAgentResults: nextMainlineAgentResults,
    comparison: workflowResult.comparison
  });

  return {
    ...workflowResult,
    evidenceRecords: nextEvidenceRecords,
    supportingAgentResults: nextSupportingAgentResults,
    agentTrace: buildTenAgentTrace({
      evidenceRecords: nextEvidenceRecords,
      countryA: workflowResult.input.countryA,
      countryB: workflowResult.input.countryB,
      businessScenario: workflowResult.input.businessScenario,
      userQuery: workflowResult.input.userQuery,
      policyAnalysis: workflowResult.policyAnalysis,
      riskSummary: nextSupportingAgentResults.riskCostQuantifier.data?.riskSummary ?? null
    })
  };
}
