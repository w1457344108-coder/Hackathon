export type SupportedCountry =
  | "China"
  | "Singapore"
  | "Japan"
  | "European Union"
  | "United States";

export type RiskLevel = "Low" | "Moderate" | "High";

export type AgentStatus = "idle" | "running" | "completed" | "error";

export type Pillar6IndicatorEnum =
  | "P6_1_BAN_LOCAL_PROCESSING"
  | "P6_2_LOCAL_STORAGE"
  | "P6_3_INFRASTRUCTURE"
  | "P6_4_CONDITIONAL_FLOW"
  | "P6_5_BINDING_COMMITMENT";

export interface AgentResult<T> {
  status: "success" | "error";
  agentId: TenAgentId;
  data: T | null;
  message: string;
  downstreamAgent?: TenAgentId;
}

export interface RdtiiStyleScore {
  banLocalProcessing: 0 | 0.5 | 1;
  localStorage: 0 | 0.5 | 1;
  infrastructureRequirement: 0 | 1;
  conditionalFlowRegime: 0 | 0.5 | 1;
  bindingAgreementGap: 0 | 1;
}

export interface CountryPolicyProfile {
  country: SupportedCountry;
  region: string;
  dataTransferPolicy: string;
  localizationRules: string;
  privacyFramework: string;
  approvalMechanism: string;
  businessImpact: "Low" | "Medium" | "High";
  opennessScore: number;
  riskLevel: RiskLevel;
  rdtiiStyleScore: RdtiiStyleScore;
  internationalAgreements: string[];
  complianceNotes: string[];
  keySignals: string[];
  strategicOutlook: string;
  demoDisclaimer: string;
}

export interface ResearchAgentResult {
  profiles: CountryPolicyProfile[];
  summary: string;
  sourceBasis: string[];
}

export interface PolicyAnalysisResult {
  country: SupportedCountry;
  riskLevel: RiskLevel;
  restrictionScore: number;
  opennessScore: number;
  complianceBurden: "Lean" | "Managed" | "Heavy";
  executiveSummary: string;
  strengths: string[];
  watchpoints: string[];
  recommendedActions: string[];
}

export interface ComparisonRow {
  metric: string;
  countryA: string;
  countryB: string;
  insight: string;
}

export interface ComparisonAgentResult {
  comparedCountries: [SupportedCountry, SupportedCountry];
  headline: string;
  winnerOnOpenness: SupportedCountry;
  higherRiskCountry: SupportedCountry;
  rows: ComparisonRow[];
}

export interface WorkflowInput {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  userQuery: string;
}

export type TenAgentId =
  | "intent-arbiter"
  | "query-builder"
  | "source-discovery"
  | "document-reader"
  | "relevance-filter"
  | "indicator-mapping"
  | "legal-reasoner"
  | "risk-cost-quantifier"
  | "audit-citation"
  | "legal-review-export";

export interface AgentHumanReviewGate {
  required: boolean;
  reviewerRole: "law-student" | "none";
  action:
    | "Confirm Pillar 6 scope before retrieval"
    | "Revise search terms before discovery"
    | "Spot-check official source authority"
    | "Confirm parsing quality"
    | "Approve relevance shortlist"
    | "Approve indicator mapping"
    | "Review legal conclusion"
    | "Review business impact"
    | "Approve citation chain"
    | "Confirm export package";
}

export interface WorkflowAgentTrace {
  agentId: TenAgentId;
  name: string;
  inputSummary: string;
  outputSummary: string;
  evidenceIds: string[];
  humanReviewGate: AgentHumanReviewGate;
  nextAgent: TenAgentId | null;
}

export interface IntentArbiterOutput {
  normalizedIntent: string;
  workflowMode: "single-jurisdiction" | "cross-jurisdiction";
  pillar6ScopeConfirmed: true;
  focusIndicators: Pillar6IndicatorEnum[];
}

export interface CandidateSource {
  sourceId: string;
  evidenceId: string;
  title: string;
  jurisdiction: string;
  sourceType: string;
  sourceUrl: string;
  relevanceNote: string;
}

export interface SourceDiscoveryOutput {
  candidateSources: CandidateSource[];
}

export interface LegalPassage {
  evidenceId: string;
  sourceId: string;
  lawTitle: string;
  citationRef: string;
  sourceUrl: string;
  text: string;
}

export interface DocumentReaderOutput {
  passages: LegalPassage[];
}

export interface MappedEvidenceItem {
  evidenceId: string;
  indicatorId: Pillar6IndicatorEnum;
  mappingReason: string;
  citationRef: string;
}

export interface IndicatorMappingOutput {
  mappedEvidence: MappedEvidenceItem[];
}

export interface LegalFinding {
  conclusionId: string;
  jurisdiction: string;
  indicatorId: Pillar6IndicatorEnum;
  conclusion: string;
  legalEffect: string;
  evidenceIds: string[];
}

export interface LegalReasonerOutput {
  legalFindings: LegalFinding[];
}

export interface MainlineAgentResults {
  intentArbiter: AgentResult<IntentArbiterOutput>;
  sourceDiscovery: AgentResult<SourceDiscoveryOutput>;
  documentReader: AgentResult<DocumentReaderOutput>;
  indicatorMapping: AgentResult<IndicatorMappingOutput>;
  legalReasoner: AgentResult<LegalReasonerOutput>;
}

export interface DemoNarrative {
  title: string;
  scenario: string;
  primaryJurisdiction: SupportedCountry;
  comparisonJurisdiction: SupportedCountry | null;
  walkthrough: string[];
  successCriteria: string[];
}

export interface WorkflowResult {
  input: WorkflowInput;
  research: ResearchAgentResult;
  policyAnalysis: PolicyAnalysisResult[];
  comparison: ComparisonAgentResult | null;
  report: ReportAgentResult;
  mainlineAgentResults: MainlineAgentResults;
  agentTrace: WorkflowAgentTrace[];
  demoNarrative: DemoNarrative;
  generatedAt: string;
}

export interface ReportAgentResult {
  title: string;
  overallRisk: RiskLevel;
  finalNarrative: string;
  policyRecommendations: string[];
  comparisonTable: ComparisonRow[];
}

export type StreamEventName =
  | "workflow"
  | "research"
  | "policy"
  | "comparison"
  | "report"
  | "done"
  | "error";
