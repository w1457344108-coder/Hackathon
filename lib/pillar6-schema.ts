import type {
  CandidateSource,
  CountryPolicyProfile,
  Pillar6IndicatorEnum,
  PreferredSourceType,
  QueryPlanItem,
  SearchQueryLanguage,
  SearchQueryPriority,
  SearchQueryReviewStatus,
  SourceAuthorityLevel,
  SourceJurisdictionMatch,
  SourceRetrievalStatus
} from "@/lib/types";

export type Pillar6IndicatorId =
  | "ban-local-processing"
  | "local-storage"
  | "infrastructure"
  | "conditional-flow"
  | "binding-commitments";

export type Pillar6IndicatorScoreField =
  | keyof Pick<
      CountryPolicyProfile["rdtiiStyleScore"],
      | "banLocalProcessing"
      | "localStorage"
      | "infrastructureRequirement"
      | "conditionalFlowRegime"
      | "bindingAgreementGap"
    >;

export type EvidenceSourceType =
  | "Official Portal"
  | "Statute"
  | "Regulator Guidance"
  | "International Agreement"
  | "Policy Notice";

export type EvidenceReviewStatus =
  | "Pending Review"
  | "Approved"
  | "Needs Revision"
  | "Rejected";

export type Pillar6IndicatorCode = Pillar6IndicatorEnum;

export interface Pillar6IndicatorCardData {
  id: Pillar6IndicatorId;
  title: string;
  shortLabel: string;
  description: string;
  scoreField: Pillar6IndicatorScoreField;
  score: number;
  severity: "Open" | "Managed" | "Restrictive";
  analystNote: string;
}

export interface LegalSearchWorkspaceInput {
  jurisdiction: string;
  businessScenario: string;
  plainLanguageQuery: string;
  aiGeneratedTerms: string;
  lawStudentTerms: string;
  exclusionTerms: string;
  preferredSources: PreferredSourceType[];
}

export type SearchQueryPlan = QueryPlanItem;

export interface SearchProfileJson {
  jurisdiction: string;
  businessScenario: string;
  normalizedIntent: string;
  userQuery: string;
  aiGeneratedTerms: string[];
  lawStudentTerms: string[];
  exclusionTerms: string[];
  preferredSources: PreferredSourceType[];
  pillar6IndicatorTargets: Pillar6IndicatorCode[];
  sourcePriorityOrder: PreferredSourceType[];
  queryPlan: SearchQueryPlan[];
  searchQueries: string[];
  reviewChecklist: string[];
  generatedAt: string;
}

export interface SourceDiscoveryResult {
  jurisdiction: string;
  candidateSources: CandidateSource[];
}

export interface PipelineAgentStage {
  id: string;
  name: string;
  purpose: string;
  output: string;
}

export interface EvidenceRecord {
  evidenceId: string;
  country: string;
  pillar: string;
  indicator: string;
  indicatorCode: Pillar6IndicatorCode;
  lawTitle: string;
  citation: string;
  verbatimSnippet: string;
  sourceUrl: string;
  sourceLocator?: string;
  sourceStrength?:
    | "row-level-law"
    | "country-profile"
    | "database-entrypoint"
    | "methodology-support";
  traceabilityTier?: "page-level" | "entrypoint-level" | "law-url-level";
  sourceType: EvidenceSourceType;
  discoveryTags: string[];
  confidence: number;
  reviewStatus: EvidenceReviewStatus;
  reviewerNote: string;
  originalLegalText: string;
  aiExtraction: string;
  pillar6Mapping: string;
  mappingRationale: string;
  riskImplication: string;
}
