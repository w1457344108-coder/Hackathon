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
  | "International agreement database"
  | "Case law database"
  | "Government ministry website";

export type EvidenceSourceType =
  | "Official Portal"
  | "Statute"
  | "Regulator Guidance"
  | "International Agreement"
  | "Policy Notice";

export type EvidenceReviewStatus = "Pending Review" | "Approved" | "Needs Revision";

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
  plainLanguageQuery: string;
  legalTerms: string;
  synonyms: string;
  exclusionTerms: string;
  preferredSources: PreferredSourceType[];
}

export interface SearchProfileJson {
  jurisdiction: string;
  pillar: "Pillar 6: Cross-Border Data Policies";
  objective: string;
  legalTerms: string[];
  synonyms: string[];
  exclusionTerms: string[];
  preferredSources: PreferredSourceType[];
  indicatorTargets: string[];
  searchQueries: string[];
  reviewChecklist: string[];
  generatedAt: string;
}

export interface PipelineAgentStage {
  id: string;
  name: string;
  purpose: string;
  output: string;
}

export interface EvidenceRecord {
  country: string;
  pillar: string;
  indicator: string;
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
}
