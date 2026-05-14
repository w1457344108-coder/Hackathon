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
    id: "rebuttal-agent",
    name: "Rebuttal Review Agent",
    layer: "Strategic Control & Reasoning Layer",
    role: "Challenges each legal conclusion against cited evidence and flags overclaims, weak support, or missing citation chains before export.",
    input: "Legal findings, cited evidence IDs, source passages, reviewer status, and citation metadata.",
    output: "Supported / weakly supported / unsupported review results with rebuttal notes and suggested revisions.",
    status: "API-ready",
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
    status: "Ready",
    agent_type: "supporting",
    owner_track: "my-supporting"
  },
  {
    id: "document-reader",
    name: "Document Reader Agent",
    layer: "Input & Discovery Layer",
    role: "Structures the scoped demo evidence set into readable passages suitable for legal extraction.",
    input: "Resolved evidence records, source URLs, legal texts, PDF pages, and uploaded context.",
    output: "Normalized passages, section anchors, and machine-readable legal text segments.",
    status: "API-ready",
    agent_type: "mainline",
    owner_track: "teammate-mainline"
  },
  {
    id: "indicator-mapping",
    name: "Indicator Mapping Agent",
    layer: "Filtering, Mapping & Review Layer",
    role: "Matches citation-ready passages against the five RDTII Pillar 6 indicators with explicit mapping logic.",
    input: "Citation-ready snippets, Pillar 6 indicator definitions, and jurisdiction context.",
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
