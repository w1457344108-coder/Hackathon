export type SupportedCountry =
  | "China"
  | "Singapore"
  | "Japan"
  | "European Union"
  | "United States";

export type RiskLevel = "Low" | "Moderate" | "High";

export type AgentStatus = "idle" | "running" | "completed" | "error";

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
}

export interface WorkflowResult {
  input: WorkflowInput;
  research: ResearchAgentResult;
  policyAnalysis: PolicyAnalysisResult[];
  comparison: ComparisonAgentResult | null;
  report: ReportAgentResult;
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
