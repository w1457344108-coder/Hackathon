import type { EvidenceRecord } from "./pillar6-schema";

export type SupportedCountry =
  | "China"
  | "Singapore"
  | "Japan"
  | "European Union"
  | "United States";

export type RiskLevel = "Low" | "Moderate" | "High";

export type AgentStatus = "idle" | "running" | "completed" | "error";

export type LegalTaskType =
  | "regulation-interpretation"
  | "case-analysis"
  | "forward-looking-advisory";

export type PillarId = "P6" | "P7";

export type Pillar6IndicatorEnum =
  | "P6_1_BAN_LOCAL_PROCESSING"
  | "P6_2_LOCAL_STORAGE"
  | "P6_3_INFRASTRUCTURE"
  | "P6_4_CONDITIONAL_FLOW"
  | "P6_5_BINDING_COMMITMENT";

export type PreferredSourceType =
  | "Official legislation portal"
  | "Regulator guidance"
  | "Government ministry website"
  | "International agreement database"
  | "RDTII / UN ESCAP source";

export type SearchQueryPriority = "High" | "Medium";

export type SearchQueryLanguage = "English" | "Local + English";

export type SearchQueryReviewStatus =
  | "Suggested"
  | "Approved"
  | "Needs Revision"
  | "Rejected";

export type SourceAuthorityLevel = "Primary" | "Supporting";

export type SourceJurisdictionMatch = "Direct" | "Regional / Comparative";

export type SourceRetrievalStatus = "Ready for Reading" | "Needs Human Check";

export interface AgentResult<T> {
  status: "success" | "error";
  agentId: WorkflowAgentId;
  data: T | null;
  message: string;
  downstreamAgent?: WorkflowAgentId;
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
  taskType: LegalTaskType;
  userQuery: string;
  uploadedDocuments?: Array<{
    fileName: string;
    sizeBytes: number;
    characterCount: number;
  }>;
}

export type WorkflowAgentId =
  | "intent-arbiter"
  | "query-builder"
  | "document-reader"
  | "indicator-mapping"
  | "legal-reasoner"
  | "rebuttal-agent"
  | "risk-cost-quantifier"
  | "audit-citation"
  | "legal-review-export";

export interface AgentHumanReviewGate {
  required: boolean;
  reviewerRole: "law-student" | "none";
  action:
    | "Confirm Pillar 6 scope before retrieval"
    | "Confirm analysis scope"
    | "Revise search terms before discovery"
    | "Confirm parsing quality"
    | "Approve indicator mapping"
    | "Review legal conclusion"
    | "Review rebuttal findings"
    | "Review business impact"
    | "Approve citation chain"
    | "Confirm export package";
}

export interface WorkflowAgentTrace {
  agentId: WorkflowAgentId;
  name: string;
  inputSummary: string;
  outputSummary: string;
  evidenceIds: string[];
  humanReviewGate: AgentHumanReviewGate;
  nextAgent: WorkflowAgentId | null;
}

export interface IntentArbiterOutput {
  normalizedIntent: string;
  workflowMode: LegalTaskType;
  taskType: LegalTaskType;
  selectedPillarId: PillarId;
  selectedIndicatorId: string;
  businessScenario: string;
  scopeConfirmed: boolean;
  focusIndicators: string[];
}

export interface QueryPlanItem {
  queryId: string;
  jurisdiction: string;
  indicatorCode: Pillar6IndicatorEnum;
  indicatorLabel: string;
  targetSourceType: PreferredSourceType;
  priority: SearchQueryPriority;
  languageHint: SearchQueryLanguage;
  mustTerms: string[];
  shouldTerms: string[];
  excludeTerms: string[];
  queryText: string;
  whyThisQuery: string;
  reviewerStatus: SearchQueryReviewStatus;
  reviewerNote: string;
}

export interface QueryBuilderOutput {
  normalizedIntent: string;
  sourcePriorityOrder: PreferredSourceType[];
  queryPlan: QueryPlanItem[];
  searchQueries: string[];
  targetIndicators: Pillar6IndicatorEnum[];
  reviewChecklist: string[];
}

export interface CandidateSource {
  sourceId: string;
  evidenceId: string;
  queryId?: string;
  indicatorId?: string;
  title: string;
  jurisdiction: string;
  sourceType: PreferredSourceType | string;
  sourceUrl: string;
  relevanceNote: string;
  authorityLevel?: SourceAuthorityLevel;
  jurisdictionMatch?: SourceJurisdictionMatch;
  discoveryReason?: string;
  retrievalStatus?: SourceRetrievalStatus;
  matchedTerms?: string[];
}

export interface SourceDiscoveryOutput {
  candidateSources: CandidateSource[];
}

export interface LegalPassage {
  passageId: string;
  evidenceId: string;
  sourceId: string;
  lawTitle: string;
  jurisdiction: string;
  pillarId: PillarId;
  indicatorId: string;
  citationRef: string;
  sourceUrl: string;
  text: string;
}

export interface DocumentReaderOutput {
  passages: LegalPassage[];
}

export interface MappedEvidenceItem {
  evidenceId: string;
  passageId: string;
  pillarId: PillarId;
  indicatorId: string;
  mappingReason: string;
  citationRef: string;
}

export interface IndicatorMappingOutput {
  mappedEvidence: MappedEvidenceItem[];
}

export interface LegalFinding {
  conclusionId: string;
  jurisdiction: string;
  pillarId: PillarId;
  indicatorId: string;
  conclusion: string;
  legalEffect: string;
  evidenceIds: string[];
  passageIds: string[];
}

export interface LegalReasonerOutput {
  legalFindings: LegalFinding[];
}

export type RebuttalReviewStatus = "Supported" | "Weakly Supported" | "Unsupported";

export type RebuttalIssueType =
  | "Missing Citation"
  | "Overclaim"
  | "Wrong Indicator"
  | "Insufficient Evidence";

export interface RebuttalReviewItem {
  conclusionId: string;
  status: RebuttalReviewStatus;
  issueType?: RebuttalIssueType;
  rebuttalNote: string;
  citedEvidenceIds: string[];
  suggestedRevision?: string;
}

export interface RebuttalAgentOutput {
  reviews: RebuttalReviewItem[];
  summary: {
    supportedCount: number;
    weaklySupportedCount: number;
    unsupportedCount: number;
    humanReviewNeeded: boolean;
  };
}

export type ReasoningUncertaintyLevel = "Low" | "Moderate" | "High";

export interface RiskSummary {
  riskLevel: RiskLevel;
  riskSummary: string;
  businessImpactSummary: string;
  businessCostDrivers?: string[];
  operationalImpact?: string;
  uncertaintyLevel: ReasoningUncertaintyLevel;
  humanReviewNeeded: boolean;
}

export interface RiskCostQuantifierOutput {
  riskSummary: RiskSummary;
}

export interface AuditCitationItem {
  evidenceId: string;
  sourceId: string;
  conclusionId: string;
  jurisdiction: string;
  indicatorId: string;
  pillarId?: PillarId;
  passageId?: string;
  lawTitle: string;
  citationRef: string;
  sourceUrl: string;
  sourceLocator?: string;
  sourceStrength?: "country-profile" | "database-entrypoint" | "methodology-support";
  traceabilityTier?: "page-level" | "entrypoint-level";
  originalLegalText: string;
  verbatimSnippet: string;
  extractedClaim: string;
  legalEffect: string;
  relevanceReason: string;
  traceabilityStatus: "Complete" | "Needs Human Review";
  traceabilityNote: string;
  humanReviewNeeded: boolean;
  reviewerNote: string;
  reviewStatus: string;
}

export interface AuditCitationOutput {
  auditItems: AuditCitationItem[];
  coverageSummary: {
    totalFindings: number;
    linkedFindings: number;
    needsReviewCount: number;
  };
}

export interface LegalReviewExportOutput {
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
}

export interface MainlineAgentResults {
  intentArbiter: AgentResult<IntentArbiterOutput>;
  documentReader: AgentResult<DocumentReaderOutput>;
  indicatorMapping: AgentResult<IndicatorMappingOutput>;
  legalReasoner: AgentResult<LegalReasonerOutput>;
}

export interface SupportingAgentResults {
  queryBuilder: AgentResult<QueryBuilderOutput>;
  rebuttalAgent: AgentResult<RebuttalAgentOutput>;
  riskCostQuantifier: AgentResult<RiskCostQuantifierOutput>;
  auditCitation: AgentResult<AuditCitationOutput>;
  legalReviewExport: AgentResult<LegalReviewExportOutput>;
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
  analysisRunId: string | null;
  providerId: string;
  providerModel: string | null;
  evidenceSourceMode: "real" | "mock" | "hybrid";
  evidenceRecords: EvidenceRecord[];
  input: WorkflowInput;
  research: ResearchAgentResult;
  policyAnalysis: PolicyAnalysisResult[];
  comparison: ComparisonAgentResult | null;
  report: ReportAgentResult;
  mainlineAgentResults: MainlineAgentResults;
  supportingAgentResults: SupportingAgentResults;
  agentTrace: WorkflowAgentTrace[];
  demoNarrative: DemoNarrative;
  generatedAt: string;
}

export interface ReportAgentResult {
  title: string;
  overallRisk: RiskLevel;
  finalNarrative: string;
  modeSections?: Array<{
    heading: string;
    body: string;
  }>;
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
