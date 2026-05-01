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
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  userQuery: string;
}
```

- `output`

```ts
interface IntentArbiterOutput {
  normalizedIntent: string;
  workflowMode: "single-jurisdiction" | "cross-jurisdiction";
  pillar6ScopeConfirmed: true;
  focusIndicators: Pillar6IndicatorEnum[];
}
```

- `required_fields`
  - `countryA`
  - `businessScenario`
  - `userQuery`
- `optional_fields`
  - `countryB`
- `downstream_agent`
  - `query-builder`

### 4.2 Query Builder Agent

- `agent_id`: `query-builder`
- `input`

```ts
interface QueryBuilderInput {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  userQuery: string;
  intent: IntentArbiterOutput;
}
```

- `output`

```ts
interface QueryPlanItem {
  queryId: string;
  jurisdiction: string;
  indicatorCode: Pillar6IndicatorEnum;
  indicatorLabel: string;
  targetSourceType: PreferredSourceType;
  priority: "High" | "Medium";
  languageHint: "English" | "Local + English";
  mustTerms: string[];
  shouldTerms: string[];
  excludeTerms: string[];
  queryText: string;
  whyThisQuery: string;
  reviewerStatus: "Suggested" | "Approved" | "Needs Revision" | "Rejected";
  reviewerNote: string;
}

interface QueryBuilderOutput {
  normalizedIntent: string;
  sourcePriorityOrder: PreferredSourceType[];
  queryPlan: QueryPlanItem[];
  searchQueries: string[];
  targetIndicators: Pillar6IndicatorEnum[];
}
```

- `required_fields`
  - `countryA`
  - `businessScenario`
  - `userQuery`
  - `intent`
- `optional_fields`
  - `countryB`
- `downstream_agent`
  - `source-discovery`

### 4.3 Source Discovery Agent

- `agent_id`: `source-discovery`
- `input`

```ts
interface SourceDiscoveryInput {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  queryPlan: QueryPlanItem[];
  normalizedIntent: string;
  searchQueries: string[];
  focusIndicators: Pillar6IndicatorEnum[];
}
```

- `output`

```ts
interface SourceDiscoveryOutput {
  candidateSources: Array<{
    sourceId: string;
    evidenceId: string;
    queryId?: string;
    indicatorId?: Pillar6IndicatorEnum;
    title: string;
    jurisdiction: string;
    sourceType: PreferredSourceType | string;
    sourceUrl: string;
    authorityLevel?: "Primary" | "Supporting";
    jurisdictionMatch?: "Direct" | "Regional / Comparative";
    relevanceNote: string;
    discoveryReason?: string;
    retrievalStatus?: "Ready for Reading" | "Needs Human Check";
    matchedTerms?: string[];
  }>;
}
```

- `required_fields`
  - `countryA`
  - `queryPlan`
  - `normalizedIntent`
  - `searchQueries`
  - `focusIndicators`
- `optional_fields`
  - `countryB`
- `downstream_agent`
  - `document-reader`

### 4.4 Document Reader Agent

- `agent_id`: `document-reader`
- `input`

```ts
interface DocumentReaderInput {
  candidateSources: Array<{
    sourceId: string;
    evidenceId: string;
    title: string;
    sourceUrl: string;
    sourceType: string;
  }>;
}
```

- `output`

```ts
interface DocumentReaderOutput {
  passages: Array<{
    evidenceId: string;
    sourceId: string;
    lawTitle: string;
    citationRef: string;
    sourceUrl: string;
    text: string;
  }>;
}
```

- `required_fields`
  - `candidateSources`
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
    evidenceId: string;
    citationRef: string;
    sourceUrl: string;
    text: string;
  }>;
  focusIndicators: Pillar6IndicatorEnum[];
}
```

- `output`

```ts
interface RelevanceFilterOutput {
  shortlistedEvidence: Array<{
    evidenceId: string;
    citationRef: string;
    sourceUrl: string;
    text: string;
    relevanceReason: string;
  }>;
}
```

- `required_fields`
  - `jurisdiction`
  - `passages`
  - `focusIndicators`
- `optional_fields`
  - none
- `downstream_agent`
  - `indicator-mapping`

### 4.6 Indicator Mapping Agent

- `agent_id`: `indicator-mapping`
- `input`

```ts
interface IndicatorMappingInput {
  shortlistedEvidence: Array<{
    evidenceId: string;
    citationRef: string;
    sourceUrl: string;
    text: string;
  }>;
}
```

- `output`

```ts
interface IndicatorMappingOutput {
  mappedEvidence: Array<{
    evidenceId: string;
    indicatorId: Pillar6IndicatorEnum;
    mappingReason: string;
  }>;
}
```

- `required_fields`
  - `shortlistedEvidence`
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
  mappedEvidence: Array<{
    evidenceId: string;
    indicatorId: Pillar6IndicatorEnum;
    mappingReason: string;
  }>;
  evidenceTextLookup: Record<string, string>;
}
```

- `output`

```ts
interface LegalReasonerOutput {
  legalFindings: Array<{
    conclusionId: string;
    indicatorId: Pillar6IndicatorEnum;
    conclusion: string;
    evidenceIds: string[];
  }>;
}
```

- `required_fields`
  - `jurisdiction`
  - `mappedEvidence`
  - `evidenceTextLookup`
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
  legalFindings: Array<{
    conclusionId: string;
    indicatorId: Pillar6IndicatorEnum;
    conclusion: string;
    evidenceIds: string[];
  }>;
}
```

- `output`

```ts
interface RiskCostQuantifierOutput {
  riskSummary: {
    riskLevel: "Low" | "Moderate" | "High";
    businessCostDrivers: string[];
    operationalImpact: string;
  };
}
```

- `required_fields`
  - `jurisdiction`
  - `legalFindings`
- `optional_fields`
  - none
- `downstream_agent`
  - `audit-citation`

### 4.9 Audit View & Citation Agent

- `agent_id`: `audit-citation`
- `input`

```ts
interface AuditCitationInput {
  legalFindings: Array<{
    conclusionId: string;
    indicatorId: Pillar6IndicatorEnum;
    conclusion: string;
    evidenceIds: string[];
  }>;
  evidenceLookup: Record<
    string,
    {
      citationRef?: string;
      sourceUrl?: string;
      text: string;
    }
  >;
}
```

- `output`

```ts
interface AuditCitationOutput {
  auditItems: Array<{
    conclusionId: string;
    evidenceId: string;
    citationRef?: string;
    sourceUrl?: string;
    originalText: string;
    extractedClaim: string;
  }>;
}
```

- `required_fields`
  - `legalFindings`
  - `evidenceLookup`
- `optional_fields`
  - none
- `downstream_agent`
  - `legal-review-export`

### 4.10 Legal Review & Export Agent

- `agent_id`: `legal-review-export`
- `input`

```ts
interface LegalReviewExportInput {
  auditItems: Array<{
    conclusionId: string;
    evidenceId: string;
    citationRef?: string;
    sourceUrl?: string;
    originalText: string;
    extractedClaim: string;
  }>;
  riskSummary: {
    riskLevel: "Low" | "Moderate" | "High";
    businessCostDrivers: string[];
    operationalImpact: string;
  };
  comparisonView?: Record<string, string>;
}
```

- `output`

```ts
interface LegalReviewExportOutput {
  finalReport: string;
  exportBundle: {
    json: Record<string, unknown>;
    csvRows: Array<Record<string, string | number>>;
    markdown: string;
  };
}
```

- `required_fields`
  - `auditItems`
  - `riskSummary`
- `optional_fields`
  - `comparisonView`
- `downstream_agent`
  - `none`

## 5. Integration Example

Below is a simplified JSON-compatible example of the expected data flow from user request to final report.

### User Query

```json
{
  "countryA": "China",
  "businessScenario": "fintech",
  "userQuery": "What approvals or security reviews apply to outbound transfer of important data under Pillar 6?"
}
```

### Intent Arbiter Output

```json
{
  "status": "success",
  "agent_id": "intent-arbiter",
  "data": {
    "normalizedIntent": "Assess outbound transfer approval conditions in China under Pillar 6.",
    "workflowMode": "single-jurisdiction",
    "pillar6ScopeConfirmed": true,
    "focusIndicators": ["P6_4_CONDITIONAL_FLOW"]
  }
}
```

### Query Builder Output

```json
{
  "status": "success",
  "agent_id": "query-builder",
  "data": {
    "normalizedIntent": "Assess transfer approval conditions in China under Pillar 6.",
    "sourcePriorityOrder": ["Regulator guidance", "Official legislation portal"],
    "queryPlan": [
      {
        "queryId": "QB-4-1",
        "indicatorCode": "P6_4_CONDITIONAL_FLOW",
        "targetSourceType": "Regulator guidance",
        "priority": "High",
        "languageHint": "Local + English",
        "mustTerms": ["China", "cross-border transfer approval", "security assessment"],
        "shouldTerms": ["important data export", "transfer mechanism"],
        "excludeTerms": ["consumer rights"],
        "queryText": "China \"Conditional flow regimes\" cross-border transfer approval security assessment (important data export OR transfer mechanism) -consumer rights",
        "whyThisQuery": "Prioritizes regulator materials that usually explain transfer approvals first.",
        "reviewerStatus": "Suggested",
        "reviewerNote": ""
      }
    ],
    "searchQueries": [
      "China \"Conditional flow regimes\" cross-border transfer approval security assessment (important data export OR transfer mechanism) -consumer rights"
    ],
    "targetIndicators": ["P6_4_CONDITIONAL_FLOW"],
    "reviewChecklist": [
      "Check whether the query stays within Pillar 6 transfer-policy scope."
    ]
  }
}
```

### Source Discovery Output

```json
{
  "status": "success",
  "agent_id": "source-discovery",
  "data": {
    "candidateSources": [
      {
        "sourceId": "src_001",
        "evidenceId": "ev_001",
        "queryId": "QB-4-1",
        "indicatorId": "P6_4_CONDITIONAL_FLOW",
        "title": "China Conditional flow regimes Compliance Guidance",
        "jurisdiction": "China",
        "sourceType": "Regulator guidance",
        "sourceUrl": "https://regulator.example.cn/conditional-flow-regimes",
        "authorityLevel": "Primary",
        "jurisdictionMatch": "Direct",
        "relevanceNote": "Likely contains transfer approval conditions.",
        "discoveryReason": "Spawned from QB-4-1 because the query prioritized regulator guidance first.",
        "retrievalStatus": "Ready for Reading",
        "matchedTerms": ["China", "cross-border transfer approval", "security assessment"]
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
        "evidenceId": "ev_001",
        "sourceId": "src_001",
        "lawTitle": "Mock Personal Information Export Compliance Notice",
        "citationRef": "Art. 12",
        "sourceUrl": "https://example.gov.cn/mock-export-notice",
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
    "shortlistedEvidence": [
      {
        "evidenceId": "ev_001",
        "citationRef": "Art. 12",
        "sourceUrl": "https://example.gov.cn/mock-export-notice",
        "text": "Outbound transfer of important datasets shall complete the designated security review before the transfer is activated.",
        "relevanceReason": "Directly describes a transfer condition."
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
    "mappedEvidence": [
      {
        "evidenceId": "ev_001",
        "indicatorId": "P6_4_CONDITIONAL_FLOW",
        "mappingReason": "Transfer is conditioned on prior review."
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
    "legalFindings": [
      {
        "conclusionId": "con_001",
        "indicatorId": "P6_4_CONDITIONAL_FLOW",
        "conclusion": "Outbound transfer is legally allowed only after an ex ante security review.",
        "evidenceIds": ["ev_001"]
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
    "auditItems": [
      {
        "conclusionId": "con_001",
        "evidenceId": "ev_001",
        "citationRef": "Art. 12",
        "sourceUrl": "https://example.gov.cn/mock-export-notice",
        "originalText": "Outbound transfer of important datasets shall complete the designated security review before the transfer is activated.",
        "extractedClaim": "Outbound transfer is legally allowed only after an ex ante security review."
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
    "finalReport": "China applies a conditional transfer regime for important outbound data transfers, with pre-transfer security review as a legal gate.",
    "exportBundle": {
      "json": {
        "overallRisk": "High",
        "indicatorResults": ["P6_4_CONDITIONAL_FLOW"]
      },
      "csvRows": [
        {
          "citationRef": "Art. 12",
          "indicatorId": "P6_4_CONDITIONAL_FLOW",
          "riskLevel": "High"
        }
      ],
      "markdown": "# Pillar 6 Report\n\n- Indicator: P6_4_CONDITIONAL_FLOW\n- Finding: Pre-transfer security review required.\n- Risk: High"
    }
  }
}
```

This contract should be treated as the integration baseline for all future Codex development, mock-agent upgrades, and real API-backed agent replacement.
