import { AgentMeta } from "@/types/agent-schema";

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
    id: "risk-cost-quantifier",
    name: "Risk & Cost Quantifier Agent",
    layer: "Strategic Control & Reasoning Layer",
    role: "Translates reasoned legal findings into practical business friction, compliance burden, and operational risk signals with uncertainty handling.",
    input: "Reasoned legal conclusions, transfer constraints, approval gates, localization obligations, and review flags.",
    output: "Structured risk summary, business cost drivers, uncertainty level, and business impact narrative.",
    status: "Ready",
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
    role: "Transforms scoped Pillar 6 intent into a structured query plan with indicator targets, source priorities, and reviewable search expressions.",
    input: "Normalized intent, target jurisdiction, business scenario, legal terms, and exclusions.",
    output: "Search profile JSON, structured query plan, and retrieval query strings.",
    status: "Mock",
    agent_type: "supporting",
    owner_track: "my-supporting"
  },
  {
    id: "source-discovery",
    name: "Source Discovery Agent",
    layer: "Input & Discovery Layer",
    role: "Routes reviewed query-plan items to official statutes, regulator guidance, ministry portals, treaty databases, and RDTII references for Pillar 6 evidence discovery.",
    input: "Query plan, search profile JSON, source preferences, and jurisdictional retrieval priorities.",
    output: "Traceable candidate source inventory with authority ranking, query linkage, and retrieval status.",
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
