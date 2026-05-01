# Agent Parameter Contract

This document defines the shared parameter contract for the Ten-Agent Pillar 6 Architecture in the `Cross-Border Data Policy Multi-Agent Analyst` project. Its purpose is to ensure that multiple developers can implement or upgrade agents independently without breaking downstream integration.

The scope of this contract is strictly limited to **UN ESCAP RDTII Pillar 6: Cross-Border Data Policies**.

## 1. Global Rules

All agents must follow these rules:

- All inputs and outputs must be JSON-compatible objects.
- Every agent output must be wrapped in `AgentResult<T>`.
- Agents must not emit undefined or undocumented fields.
- Failure cases must use one unified error format.
- Every evidence object must retain either `sourceUrl` or `citationRef`.
- Every legal conclusion must bind to at least one `evidenceId`.
- The project processes only Pillar 6 and must not introduce Pillar 7 logic.

### Canonical field casing

The running Next.js app, TypeScript types, streaming API response, and mock orchestration code use **camelCase** as the canonical field casing. Examples: `evidenceId`, `sourceUrl`, `reviewStatus`, `agentTrace`, `humanReviewGate`.

Export adapters may convert selected fields to snake_case for downstream CSV or JSON consumers, but internal agent contracts should stay camelCase so UI components, mock data, and future API-backed agents share one naming convention.

### Human review gates

The current hackathon version treats law student review as a first-class orchestration step, not as an afterthought. Each agent trace item must identify whether a `humanReviewGate` is required, which reviewer role owns the gate, and what action must be completed before downstream output is trusted.

The required review checkpoints are:

1. Confirm Pillar 6 scope before retrieval.
2. Revise search terms before discovery.
3. Spot-check official source authority.
4. Confirm parsing quality.
5. Approve relevance shortlist.
6. Approve indicator mapping.
7. Review legal conclusion.
8. Review business impact.
9. Approve citation chain.
10. Confirm export package.

Reference wrapper:

```ts
interface AgentResult<T> {
  status: "success" | "error";
  agentId: string;
  data?: T;
  message?: string;
}
```

Shared evidence rules:

```ts
interface EvidenceRef {
  evidenceId: string;
  sourceUrl?: string;
  citationRef?: string;
}

interface LegalConclusionRef {
  conclusionId: string;
  evidenceIds: string[];
}
```

## 2. Global Failure Output

All agents must return the following failure payload:

```json
{
  "status": "error",
  "agentId": "string",
  "message": "string"
}
```

Type form:

```ts
interface GlobalFailureOutput {
  status: "error";
  agentId: string;
  message: string;
}
```

## 3. Pillar 6 Indicator Enum

All indicator mapping must use this canonical enum:

```ts
type Pillar6IndicatorEnum =
  | "P6_1_BAN_LOCAL_PROCESSING"
  | "P6_2_LOCAL_STORAGE"
  | "P6_3_INFRASTRUCTURE"
  | "P6_4_CONDITIONAL_FLOW"
  | "P6_5_BINDING_COMMITMENT";
```

Indicator meanings:

- `P6_1_BAN_LOCAL_PROCESSING`
- `P6_2_LOCAL_STORAGE`
- `P6_3_INFRASTRUCTURE`
- `P6_4_CONDITIONAL_FLOW`
- `P6_5_BINDING_COMMITMENT`

## 4. Agent-by-Agent Contract

### 4.1 Intent Arbiter Agent

- `agent_id`: `intent-arbiter`
- `input`

```ts
interface IntentArbiterInput {
  jurisdiction: string;
  comparison_jurisdiction?: string;
  user_query: string;
  requested_outputs?: string[];
}
```

- `output`

```ts
interface IntentArbiterOutput {
  normalized_intent: string;
  workflow_mode: "single-jurisdiction" | "cross-jurisdiction";
  pillar6_scope_confirmed: true;
  focus_indicators: Pillar6IndicatorEnum[];
}
```

- `required_fields`
  - `jurisdiction`
  - `user_query`
- `optional_fields`
  - `comparison_jurisdiction`
  - `requested_outputs`
- `downstream_agent`
  - `query-builder`

### 4.2 Query Builder Agent

- `agent_id`: `query-builder`
- `input`

```ts
interface QueryBuilderInput {
  jurisdiction: string;
  normalized_intent: string;
  focus_indicators: Pillar6IndicatorEnum[];
  legal_terms?: string[];
  synonyms?: string[];
  exclusion_terms?: string[];
}
```

- `output`

```ts
interface QueryBuilderOutput {
  search_queries: string[];
  preferred_source_types: string[];
  target_indicators: Pillar6IndicatorEnum[];
}
```

- `required_fields`
  - `jurisdiction`
  - `normalized_intent`
  - `focus_indicators`
- `optional_fields`
  - `legal_terms`
  - `synonyms`
  - `exclusion_terms`
- `downstream_agent`
  - `source-discovery`

### 4.3 Source Discovery Agent

- `agent_id`: `source-discovery`
- `input`

```ts
interface SourceDiscoveryInput {
  jurisdiction: string;
  search_queries: string[];
  preferred_source_types: string[];
}
```

- `output`

```ts
interface SourceDiscoveryOutput {
  candidate_sources: Array<{
    source_id: string;
    title: string;
    source_type: string;
    source_url: string;
    relevance_note: string;
  }>;
}
```

- `required_fields`
  - `jurisdiction`
  - `search_queries`
- `optional_fields`
  - `preferred_source_types`
- `downstream_agent`
  - `document-reader`

### 4.4 Document Reader Agent

- `agent_id`: `document-reader`
- `input`

```ts
interface DocumentReaderInput {
  candidate_sources: Array<{
    source_id: string;
    title: string;
    source_url: string;
    source_type: string;
  }>;
}
```

- `output`

```ts
interface DocumentReaderOutput {
  passages: Array<{
    evidence_id: string;
    source_id: string;
    law_title: string;
    citation_ref: string;
    source_url: string;
    text: string;
  }>;
}
```

- `required_fields`
  - `candidate_sources`
- `optional_fields`
  - none
- `downstream_agent`
  - `relevance-filter`

### 4.5 Relevance Filter Agent

- `agent_id`: `relevance-filter`
- `input`

```ts
interface RelevanceFilterInput {
  jurisdiction: string;
  passages: Array<{
    evidence_id: string;
    citation_ref: string;
    source_url: string;
    text: string;
  }>;
  focus_indicators: Pillar6IndicatorEnum[];
}
```

- `output`

```ts
interface RelevanceFilterOutput {
  shortlisted_evidence: Array<{
    evidence_id: string;
    citation_ref: string;
    source_url: string;
    text: string;
    relevance_reason: string;
  }>;
}
```

- `required_fields`
  - `jurisdiction`
  - `passages`
  - `focus_indicators`
- `optional_fields`
  - none
- `downstream_agent`
  - `indicator-mapping`

### 4.6 Indicator Mapping Agent

- `agent_id`: `indicator-mapping`
- `input`

```ts
interface IndicatorMappingInput {
  shortlisted_evidence: Array<{
    evidence_id: string;
    citation_ref: string;
    source_url: string;
    text: string;
  }>;
}
```

- `output`

```ts
interface IndicatorMappingOutput {
  mapped_evidence: Array<{
    evidence_id: string;
    indicator_id: Pillar6IndicatorEnum;
    mapping_reason: string;
  }>;
}
```

- `required_fields`
  - `shortlisted_evidence`
- `optional_fields`
  - none
- `downstream_agent`
  - `legal-reasoner`

### 4.7 Legal Reasoner Agent

- `agent_id`: `legal-reasoner`
- `input`

```ts
interface LegalReasonerInput {
  jurisdiction: string;
  mapped_evidence: Array<{
    evidence_id: string;
    indicator_id: Pillar6IndicatorEnum;
    mapping_reason: string;
  }>;
  evidence_text_lookup: Record<string, string>;
}
```

- `output`

```ts
interface LegalReasonerOutput {
  legal_findings: Array<{
    conclusion_id: string;
    indicator_id: Pillar6IndicatorEnum;
    conclusion: string;
    evidence_ids: string[];
  }>;
}
```

- `required_fields`
  - `jurisdiction`
  - `mapped_evidence`
  - `evidence_text_lookup`
- `optional_fields`
  - none
- `downstream_agent`
  - `risk-cost-quantifier`

### 4.8 Risk & Cost Quantifier Agent

- `agent_id`: `risk-cost-quantifier`
- `input`

```ts
interface RiskCostQuantifierInput {
  jurisdiction: string;
  legal_findings: Array<{
    conclusion_id: string;
    indicator_id: Pillar6IndicatorEnum;
    conclusion: string;
    evidence_ids: string[];
  }>;
}
```

- `output`

```ts
interface RiskCostQuantifierOutput {
  risk_summary: {
    risk_level: "Low" | "Moderate" | "High";
    business_cost_drivers: string[];
    operational_impact: string;
  };
}
```

- `required_fields`
  - `jurisdiction`
  - `legal_findings`
- `optional_fields`
  - none
- `downstream_agent`
  - `audit-citation`

### 4.9 Audit View & Citation Agent

- `agent_id`: `audit-citation`
- `input`

```ts
interface AuditCitationInput {
  legal_findings: Array<{
    conclusion_id: string;
    indicator_id: Pillar6IndicatorEnum;
    conclusion: string;
    evidence_ids: string[];
  }>;
  evidence_lookup: Record<
    string,
    {
      citation_ref?: string;
      source_url?: string;
      text: string;
    }
  >;
}
```

- `output`

```ts
interface AuditCitationOutput {
  audit_items: Array<{
    conclusion_id: string;
    evidence_id: string;
    citation_ref?: string;
    source_url?: string;
    original_text: string;
    extracted_claim: string;
  }>;
}
```

- `required_fields`
  - `legal_findings`
  - `evidence_lookup`
- `optional_fields`
  - none
- `downstream_agent`
  - `legal-review-export`

### 4.10 Legal Review & Export Agent

- `agent_id`: `legal-review-export`
- `input`

```ts
interface LegalReviewExportInput {
  audit_items: Array<{
    conclusion_id: string;
    evidence_id: string;
    citation_ref?: string;
    source_url?: string;
    original_text: string;
    extracted_claim: string;
  }>;
  risk_summary: {
    risk_level: "Low" | "Moderate" | "High";
    business_cost_drivers: string[];
    operational_impact: string;
  };
  comparison_view?: Record<string, string>;
}
```

- `output`

```ts
interface LegalReviewExportOutput {
  final_report: string;
  export_bundle: {
    json: Record<string, unknown>;
    csv_rows: Array<Record<string, string | number>>;
    markdown: string;
  };
}
```

- `required_fields`
  - `audit_items`
  - `risk_summary`
- `optional_fields`
  - `comparison_view`
- `downstream_agent`
  - `none`

## 5. Integration Example

Below is a simplified JSON-compatible example of the expected data flow from user request to final report.

### User Query

```json
{
  "jurisdiction": "China",
  "user_query": "What approvals or security reviews apply to outbound transfer of important data under Pillar 6?"
}
```

### Intent Arbiter Output

```json
{
  "status": "success",
  "agent_id": "intent-arbiter",
  "data": {
    "normalized_intent": "Assess outbound transfer approval conditions in China under Pillar 6.",
    "workflow_mode": "single-jurisdiction",
    "pillar6_scope_confirmed": true,
    "focus_indicators": ["P6_4_CONDITIONAL_FLOW"]
  }
}
```

### Query Builder Output

```json
{
  "status": "success",
  "agent_id": "query-builder",
  "data": {
    "search_queries": [
      "China outbound transfer important data security review",
      "China cross-border data transfer approval assessment"
    ],
    "preferred_source_types": ["Statute", "Regulator Guidance"],
    "target_indicators": ["P6_4_CONDITIONAL_FLOW"]
  }
}
```

### Source Discovery Output

```json
{
  "status": "success",
  "agent_id": "source-discovery",
  "data": {
    "candidate_sources": [
      {
        "source_id": "src_001",
        "title": "Mock Personal Information Export Compliance Notice",
        "source_type": "Regulator Guidance",
        "source_url": "https://example.gov.cn/mock-export-notice",
        "relevance_note": "Likely contains transfer approval conditions."
      }
    ]
  }
}
```

### Document Reader Output

```json
{
  "status": "success",
  "agent_id": "document-reader",
  "data": {
    "passages": [
      {
        "evidence_id": "ev_001",
        "source_id": "src_001",
        "law_title": "Mock Personal Information Export Compliance Notice",
        "citation_ref": "Art. 12",
        "source_url": "https://example.gov.cn/mock-export-notice",
        "text": "Outbound transfer of important datasets shall complete the designated security review before the transfer is activated."
      }
    ]
  }
}
```

### Relevance Filter Output

```json
{
  "status": "success",
  "agent_id": "relevance-filter",
  "data": {
    "shortlisted_evidence": [
      {
        "evidence_id": "ev_001",
        "citation_ref": "Art. 12",
        "source_url": "https://example.gov.cn/mock-export-notice",
        "text": "Outbound transfer of important datasets shall complete the designated security review before the transfer is activated.",
        "relevance_reason": "Directly describes a transfer condition."
      }
    ]
  }
}
```

### Indicator Mapping Output

```json
{
  "status": "success",
  "agent_id": "indicator-mapping",
  "data": {
    "mapped_evidence": [
      {
        "evidence_id": "ev_001",
        "indicator_id": "P6_4_CONDITIONAL_FLOW",
        "mapping_reason": "Transfer is conditioned on prior review."
      }
    ]
  }
}
```

### Legal Reasoner Output

```json
{
  "status": "success",
  "agent_id": "legal-reasoner",
  "data": {
    "legal_findings": [
      {
        "conclusion_id": "con_001",
        "indicator_id": "P6_4_CONDITIONAL_FLOW",
        "conclusion": "Outbound transfer is legally allowed only after an ex ante security review.",
        "evidence_ids": ["ev_001"]
      }
    ]
  }
}
```

### Audit View Output

```json
{
  "status": "success",
  "agent_id": "audit-citation",
  "data": {
    "audit_items": [
      {
        "conclusion_id": "con_001",
        "evidence_id": "ev_001",
        "citation_ref": "Art. 12",
        "source_url": "https://example.gov.cn/mock-export-notice",
        "original_text": "Outbound transfer of important datasets shall complete the designated security review before the transfer is activated.",
        "extracted_claim": "Outbound transfer is legally allowed only after an ex ante security review."
      }
    ]
  }
}
```

### Export Output

```json
{
  "status": "success",
  "agent_id": "legal-review-export",
  "data": {
    "final_report": "China applies a conditional transfer regime for important outbound data transfers, with pre-transfer security review as a legal gate.",
    "export_bundle": {
      "json": {
        "overall_risk": "High",
        "indicator_results": ["P6_4_CONDITIONAL_FLOW"]
      },
      "csv_rows": [
        {
          "citation_ref": "Art. 12",
          "indicator_id": "P6_4_CONDITIONAL_FLOW",
          "risk_level": "High"
        }
      ],
      "markdown": "# Pillar 6 Report\n\n- Indicator: P6_4_CONDITIONAL_FLOW\n- Finding: Pre-transfer security review required.\n- Risk: High"
    }
  }
}
```

This contract should be treated as the integration baseline for all future Codex development, mock-agent upgrades, and real API-backed agent replacement.
