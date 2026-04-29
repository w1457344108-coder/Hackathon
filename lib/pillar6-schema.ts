import { CountryPolicyProfile } from "@/lib/types";

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

export type PreferredSourceType =
  | "Official legislation portal"
  | "Regulator guidance"
  | "Government ministry website"
  | "International agreement database"
  | "RDTII / UN ESCAP source";

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

export type Pillar6IndicatorCode =
  | "P6_1_BAN_LOCAL_PROCESSING"
  | "P6_2_LOCAL_STORAGE"
  | "P6_3_INFRASTRUCTURE"
  | "P6_4_CONDITIONAL_FLOW"
  | "P6_5_BINDING_COMMITMENT";

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

export interface SearchProfileJson {
  jurisdiction: string;
  business_scenario: string;
  user_query: string;
  ai_generated_terms: string[];
  law_student_terms: string[];
  exclusion_terms: string[];
  preferred_sources: PreferredSourceType[];
  pillar6_indicator_targets: string[];
  search_queries: string[];
  review_checklist: string[];
  generated_at: string;
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
