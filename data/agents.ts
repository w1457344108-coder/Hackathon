import { AgentMeta, AgentLayer } from "@/types/agent-schema";

export const pillar6Agents: AgentMeta[] = [
  {
    id: "intent-arbiter",
    name: "Intent Arbiter Agent",
    layer: "Strategic Control & Reasoning Layer",
    role: "Classifies the user's legal-policy intent and routes the request into the correct Pillar 6 path.",
    input: "Jurisdiction request, comparison mode, user objective, Pillar 6 task scope.",
    output: "Normalized workflow intent, routing decision, and execution brief for downstream agents.",
    status: "API-ready",
    agent_type: "mainline",
    owner_track: "teammate-mainline"
  },
  {
    id: "legal-reasoner",
    name: "Legal Reasoner Agent",
    layer: "Strategic Control & Reasoning Layer",
    role: "Applies if-then legal logic to evaluate how the extracted rule affects cross-border data flow conditions.",
    input: "Mapped provisions, transfer conditions, indicator candidates, and evidence flags.",
    output: "Reasoned interpretation of transfer restrictions, obligations, and legal consequence paths.",
    status: "API-ready",
    agent_type: "mainline",
    owner_track: "teammate-mainline"
  },
  {
    id: "pillar6-context-memory",
    name: "Pillar 6 Context Memory Agent",
    layer: "Strategic Control & Reasoning Layer",
    role: "Maintains Pillar 6-specific context so later agents reuse prior assumptions, evidence anchors, and unresolved issues.",
    input: "Workflow state, intermediate reasoning, indicator traces, and unresolved ambiguity notes.",
    output: "Shared contextual memory object for consistent downstream analysis.",
    status: "Mock",
    agent_type: "supporting",
    owner_track: "my-supporting"
  },
  {
    id: "risk-cost-quantifier",
    name: "Risk & Cost Quantifier Agent",
    layer: "Strategic Control & Reasoning Layer",
    role: "Translates legal restrictions into practical business friction, compliance burden, and operational risk signals.",
    input: "Reasoned legal conclusions, transfer constraints, approval gates, and localization obligations.",
    output: "Structured risk tier, compliance cost notes, and business impact narrative.",
    status: "Mock",
    agent_type: "supporting",
    owner_track: "my-supporting"
  },
  {
    id: "legal-review-export",
    name: "Legal Review & Export Agent",
    layer: "Strategic Control & Reasoning Layer",
    role: "Packages reviewed findings into judge-facing outputs, export bundles, and final policy analysis deliverables.",
    input: "Validated evidence records, risk signals, review notes, and comparison summaries.",
    output: "Export-ready report package, Markdown/JSON/CSV artifacts, and review summary.",
    status: "API-ready",
    agent_type: "supporting",
    owner_track: "my-supporting"
  },
  {
    id: "query-builder",
    name: "Query Builder Agent",
    layer: "Input & Discovery Layer",
    role: "Expands legal keywords and search expressions for cross-border transfer, localization, approvals, and commitments.",
    input: "Plain-language question, target jurisdiction, known legal terms, and exclusions.",
    output: "Search profile JSON, multilingual keyword set, and retrieval query strings.",
    status: "Mock",
    agent_type: "supporting",
    owner_track: "my-supporting"
  },
  {
    id: "source-discovery",
    name: "Source Discovery Agent",
    layer: "Input & Discovery Layer",
    role: "Discovers statutes, regulator notices, treaty texts, and official portals relevant to Pillar 6 evidence collection.",
    input: "Search profile JSON, source preferences, and jurisdictional retrieval plan.",
    output: "Candidate source inventory with source-type ranking and retrieval targets.",
    status: "API-ready",
    agent_type: "mainline",
    owner_track: "teammate-mainline"
  },
  {
    id: "document-reader",
    name: "Document Reader Agent",
    layer: "Input & Discovery Layer",
    role: "Structures raw source material into readable passages suitable for legal extraction, including PDF/OCR handling.",
    input: "Source URLs, downloaded legal texts, PDF pages, scanned notices, and OCR output.",
    output: "Normalized passages, section anchors, and machine-readable legal text segments.",
    status: "Ready",
    agent_type: "mainline",
    owner_track: "teammate-mainline"
  },
  {
    id: "relevance-filter",
    name: "Relevance Filter Agent",
    layer: "Filtering, Mapping & Review Layer",
    role: "Removes non-Pillar 6 material and keeps only clauses tied to transfer conditions, localization, commitments, or approvals.",
    input: "Parsed legal passages, metadata tags, and transfer-focused search objectives.",
    output: "Shortlisted evidence snippets with relevance decisions and discard rationale.",
    status: "Ready",
    agent_type: "supporting",
    owner_track: "my-supporting"
  },
  {
    id: "indicator-mapping",
    name: "Indicator Mapping Agent",
    layer: "Filtering, Mapping & Review Layer",
    role: "Matches shortlisted passages against the five RDTII Pillar 6 indicators with explicit mapping logic.",
    input: "Shortlisted snippets, Pillar 6 indicator definitions, and jurisdiction context.",
    output: "Indicator-level evidence mapping with score direction and justification.",
    status: "Ready",
    agent_type: "mainline",
    owner_track: "teammate-mainline"
  },
  {
    id: "audit-citation",
    name: "Audit View & Citation Agent",
    layer: "Filtering, Mapping & Review Layer",
    role: "Binds each extracted claim to the original legal text, source URL, citation string, and audit-facing review trail.",
    input: "Mapped evidence items, source anchors, original text spans, and reviewer comments.",
    output: "Audit-ready citation objects and traceable evidence chain for UI review.",
    status: "Ready",
    agent_type: "supporting",
    owner_track: "my-supporting"
  }
];

export const architectureRows: Array<{
  layer: AgentLayer;
  title: string;
  summary: string;
  agentIds: string[];
}> = [
  {
    layer: "Strategic Control & Reasoning Layer",
    title: "Strategic Control & Reasoning Layer",
    summary:
      "Controls legal routing, reasoning continuity, impact quantification, and final packaging for a Pillar 6 policy analysis run.",
    agentIds: [
      "intent-arbiter",
      "legal-reasoner",
      "pillar6-context-memory",
      "risk-cost-quantifier",
      "legal-review-export"
    ]
  },
  {
    layer: "Input & Discovery Layer",
    title: "Input & Discovery Layer",
    summary:
      "Builds search instructions, finds official legal sources, and structures raw legal documents for machine review.",
    agentIds: ["query-builder", "source-discovery", "document-reader"]
  },
  {
    layer: "Filtering, Mapping & Review Layer",
    title: "Filtering, Mapping & Review Layer",
    summary:
      "Filters legal text, maps evidence to RDTII Pillar 6 indicators, and binds every claim to a citation trail.",
    agentIds: ["relevance-filter", "indicator-mapping", "audit-citation"]
  }
];
