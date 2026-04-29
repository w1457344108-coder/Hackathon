export type AgentLayer =
  | "Strategic Control & Reasoning Layer"
  | "Input & Discovery Layer"
  | "Filtering, Mapping & Review Layer";

export type AgentType = "mainline" | "supporting";

export type AgentOwnerTrack = "teammate-mainline" | "my-supporting";

export type AgentStatus = "Ready" | "Mock" | "API-ready";

export type Pillar6IndicatorId =
  | "ban-local-processing"
  | "local-storage"
  | "infrastructure"
  | "conditional-flow"
  | "binding-commitments";

export interface AgentMeta {
  id: string;
  name: string;
  layer: AgentLayer;
  role: string;
  input: string;
  output: string;
  status: AgentStatus;
  agent_type: AgentType;
  owner_track: AgentOwnerTrack;
}

export interface AgentResult<T> {
  agentId: string;
  status: AgentStatus | "Error";
  payload: T | null;
  message: string;
  downstreamAgent?: string;
}

export interface EvidenceItem {
  country: string;
  indicator: string;
  lawTitle: string;
  citation: string;
  sourceUrl: string;
  sourceType: string;
  verbatimSnippet: string;
  discoveryTags: string[];
  confidence: number;
}

export interface AuditItem {
  citation: string;
  originalLegalText: string;
  extractedText: string;
  indicatorMapping: string;
  reviewerNote: string;
  reviewStatus: "Pending Review" | "Approved" | "Needs Revision";
}

export interface SearchProfile {
  jurisdiction: string;
  objective: string;
  legalTerms: string[];
  synonyms: string[];
  exclusionTerms: string[];
  preferredSources: string[];
  indicatorTargets: Pillar6IndicatorId[];
}

export type ReviewAction = "approve" | "request-revision" | "hold" | "export";
