import { countryPolicyProfiles } from "@/lib/mock-data";
import { filterEvidenceByCountries, mockEvidenceRecords } from "@/lib/mock-evidence";
import {
  AgentResult,
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
  ReportAgentResult,
  ResearchAgentResult,
  RiskLevel,
  SupportedCountry,
  TenAgentId,
  WorkflowAgentTrace,
  WorkflowResult
} from "@/lib/types";

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
      insight: "This row explains how each market frames outbound or inbound data movement in the demo."
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
      insight: "The risk level combines policy restrictiveness with likely compliance complexity in this demo."
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
    executiveSummary: `${data.country} shows a ${riskLevel.toLowerCase()}-risk cross-border data posture in this demo, combining an openness score of ${data.opennessScore}/100 with a restrictiveness score of ${restrictionScore}/100.`,
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

  const finalNarrative = results.comparison
    ? `The multi-agent workflow indicates that ${results.comparison.higherRiskCountry} carries the heavier cross-border compliance load in this scenario, while ${results.comparison.winnerOnOpenness} appears more open for scalable digital operations. ${primaryAnalysis.executiveSummary}`
    : `The workflow indicates a ${overallRisk.toLowerCase()}-risk posture for ${primaryAnalysis.country}. ${primaryAnalysis.executiveSummary}`;

  return {
    title: "Cross-Border Data Policy Multi-Agent Report",
    overallRisk,
    finalNarrative,
    comparisonTable,
    policyRecommendations: [
      "Design market entry plans around the strictest transfer pathway rather than the average case.",
      "Separate privacy, localization, and approval obligations into different workstreams for faster execution.",
      "Prioritize interoperable markets for pilot launches, then expand into higher-friction jurisdictions with localized controls.",
      "Keep this demo ready for an OpenAI-powered upgrade by preserving structured agent inputs and outputs."
    ]
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
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  focusIndicators: Pillar6IndicatorEnum[];
}): AgentResult<{ candidateSources: CandidateSource[] }> {
  const candidateSources = filterEvidenceByCountries(
    mockEvidenceRecords,
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
    "Candidate legal sources selected from Pillar 6 mock evidence.",
    "document-reader"
  );
}

export function documentReaderAgent(input: {
  candidateSources: CandidateSource[];
}): AgentResult<DocumentReaderOutput> {
  const passages = input.candidateSources.flatMap((source) => {
    const record = mockEvidenceRecords.find((item) => item.evidenceId === source.evidenceId);

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
  passages: DocumentReaderOutput["passages"];
}): AgentResult<IndicatorMappingOutput> {
  const mappedEvidence: MappedEvidenceItem[] = input.passages.flatMap((passage) => {
    const record = mockEvidenceRecords.find((item) => item.evidenceId === passage.evidenceId);

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

export function legalReasonerAgent(input: {
  mappedEvidence: MappedEvidenceItem[];
}): AgentResult<LegalReasonerOutput> {
  const legalFindings = input.mappedEvidence.flatMap((item) => {
    const record = mockEvidenceRecords.find((evidence) => evidence.evidenceId === item.evidenceId);

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
  });

  return success(
    "legal-reasoner",
    { legalFindings },
    "Evidence-backed legal findings generated for downstream risk and audit agents.",
    "risk-cost-quantifier"
  );
}

export function runMainlineAgents(input: {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  userQuery: string;
}): MainlineAgentResults {
  const intentArbiter = intentArbiterAgent(input);
  const sourceDiscovery = sourceDiscoveryAgent({
    countryA: input.countryA,
    countryB: input.countryB,
    focusIndicators: intentArbiter.data?.focusIndicators ?? ALL_PILLAR6_INDICATORS
  });
  const documentReader = documentReaderAgent({
    candidateSources: sourceDiscovery.data?.candidateSources ?? []
  });
  const indicatorMapping = indicatorMappingAgent({
    passages: documentReader.data?.passages ?? []
  });
  const legalReasoner = legalReasonerAgent({
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

function nextAgent(agentId: TenAgentId): TenAgentId | null {
  const index = TEN_AGENT_ORDER.indexOf(agentId);

  return TEN_AGENT_ORDER[index + 1] ?? null;
}

function buildTenAgentTrace(input: {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  userQuery: string;
  policyAnalysis: PolicyAnalysisResult[];
}): WorkflowAgentTrace[] {
  const countries = [input.countryA, input.countryB].filter(Boolean).join(" and ");
  const evidenceIds = filterEvidenceByCountries(
    mockEvidenceRecords,
    input.countryA,
    input.countryB ?? ""
  ).map((record) => record.evidenceId);
  const approvedEvidenceIds = filterEvidenceByCountries(
    mockEvidenceRecords,
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
      inputSummary: "Legal conclusions with transfer gates, localization signals, and commitments.",
      outputSummary: `Summarizes risk as ${input.policyAnalysis
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
  const mainlineAgentResults = runMainlineAgents({
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
    sourceBasis: SOURCE_BASIS
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

  return {
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
    agentTrace: buildTenAgentTrace({
      countryA,
      countryB,
      businessScenario,
      userQuery,
      policyAnalysis
    }),
    demoNarrative: buildDemoNarrative({
      countryA,
      countryB,
      businessScenario
    }),
    generatedAt: new Date().toISOString()
  };
}
