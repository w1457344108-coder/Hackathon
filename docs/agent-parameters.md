# Agent Parameter Contract

This document defines the shared parameter contract for the current local demo architecture in the `Cross-Border Data Policy Multi-Agent Analyst` project. Its purpose is to ensure that multiple developers can implement or upgrade agents independently without breaking downstream integration.

The current demo does not run a full legal database, Wikipedia retrieval, or large-scale search. The user names the target Pillar and indicator in the prompt, and the backend reads manually imported evidence records before calling the API-backed analysis agents.

## 1. Global Rules

All agents must follow these rules:

- All inputs and outputs must be JSON-compatible objects.
- Every agent output must be wrapped in `AgentResult<T>`.
- Agents must not emit undefined or undocumented fields.
- Failure cases must use one unified error format.
- Every evidence object must retain either `sourceUrl` or `citationRef`.
- Every legal conclusion must bind to at least one `evidenceId` and one `passageId`.
- The active demo supports `selectedPillarId: "P6" | "P7"` and a string `selectedIndicatorId`.

### Canonical field casing

The running Next.js app, TypeScript types, streaming API response, and mock orchestration code use **camelCase** as the canonical field casing. Examples: `evidenceId`, `sourceUrl`, `reviewStatus`, `agentTrace`, `humanReviewGate`.

Export adapters may convert selected fields to snake_case for downstream CSV or JSON consumers, but internal agent contracts should stay camelCase so UI components, mock data, and future API-backed agents share one naming convention.

### Human review gates

The current hackathon version treats law student review as a first-class orchestration step, not as an afterthought. Each agent trace item must identify whether a `humanReviewGate` is required, which reviewer role owns the gate, and what action must be completed before downstream output is trusted.

The required review checkpoints are:

1. Confirm analysis scope.
2. Confirm parsing quality.
3. Approve indicator mapping.
4. Review legal conclusion.
5. Review rebuttal findings.
6. Review business impact.
7. Approve citation chain.
8. Confirm export package.

Agent2 `query-builder` is intentionally kept as a bypass / future Legal Term Wiki expansion point and is not part of the active mainline trace. The earlier `source-discovery` and `relevance-filter` agents are intentionally removed from the active demo workflow. The source pipeline code remains in place as plumbing for later Wikipedia and database integrations.

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
  passageIds: string[];
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

## 3. Demo Scope Fields

Agent1 routes the demo to a selected Pillar and indicator:

```ts
type PillarId = "P6" | "P7";

interface DemoScope {
  selectedPillarId: PillarId;
  selectedIndicatorId: string; // examples: "6.4", "7.1"
  scopeConfirmed: boolean;
  focusIndicators: string[]; // examples: ["P6:6.4"], ["P7:7.1"]
}
```

Legacy Pillar 6 enum values remain in older evidence records, but the active demo mapping writes the user-specified `selectedPillarId` and `selectedIndicatorId` onto passages and mapped evidence.

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
  taskType: LegalTaskType;
  workflowMode: LegalTaskType;
  selectedPillarId: "P6" | "P7";
  selectedIndicatorId: string;
  businessScenario: string;
  scopeConfirmed: boolean;
  focusIndicators: string[];
}
```

- `required_fields`
  - `countryA`
  - `businessScenario`
  - `userQuery`
- `optional_fields`
  - `countryB`
- `downstream_agent`
  - `document-reader`

### 4.2 Query Builder Agent

- `agent_id`: `query-builder`
- `mainline_status`: bypass only; kept for future Query Builder / Legal Term Wiki expansion and does not affect the active workflow result.
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
  - none in the active demo workflow

### 4.3 Document Reader Agent

- `agent_id`: `document-reader`
- `input`

```ts
interface DocumentReaderInput {
  evidenceRecords: EvidenceRecord[];
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  selectedPillarId: "P6" | "P7";
  selectedIndicatorId: string;
}
```

- `output`

```ts
interface DocumentReaderOutput {
  passages: Array<{
    passageId: string;
    evidenceId: string;
    lawTitle: string;
    jurisdiction: string;
    pillarId: "P6" | "P7";
    indicatorId: string;
    citationRef: string;
    text: string;
    sourceUrl: string;
  }>;
}
```

- `required_fields`
  - `evidenceRecords`
  - `countryA`
  - `selectedPillarId`
  - `selectedIndicatorId`
- `optional_fields`
  - `countryB`
- `downstream_agent`
  - `indicator-mapping`

### 4.4 Indicator Mapping Agent

- `agent_id`: `indicator-mapping`
- `input`

```ts
interface IndicatorMappingInput {
  evidenceRecords: EvidenceRecord[];
  passages: DocumentReaderOutput["passages"];
  selectedPillarId: "P6" | "P7";
  selectedIndicatorId: string;
}
```

- `output`

```ts
interface IndicatorMappingOutput {
  mappedEvidence: Array<{
    evidenceId: string;
    passageId: string;
    pillarId: "P6" | "P7";
    indicatorId: string;
    mappingReason: string;
    citationRef: string;
  }>;
}
```

- `required_fields`
  - `passages`
- `optional_fields`
  - none
- `downstream_agent`
  - `legal-reasoner`

### 4.5 Legal Reasoner Agent

- `agent_id`: `legal-reasoner`
- `input`

```ts
interface LegalReasonerInput {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  taskType?: LegalTaskType;
  userQuery: string;
  evidenceRecords: EvidenceRecord[];
  passages: DocumentReaderOutput["passages"];
  mappedEvidence: IndicatorMappingOutput["mappedEvidence"];
}
```

- `output`

```ts
interface LegalReasonerOutput {
  legalFindings: Array<{
    conclusionId: string;
    jurisdiction: string;
    pillarId: "P6" | "P7";
    indicatorId: string;
    conclusion: string;
    legalEffect: string;
    evidenceIds: string[];
    passageIds: string[];
  }>;
}
```

- `required_fields`
  - `userQuery`
  - `businessScenario`
  - `passages`
  - `mappedEvidence`
- `optional_fields`
  - none
- `downstream_agent`
  - `rebuttal-agent`

### 4.6 Rebuttal Review Agent

- `agent_id`: `rebuttal-agent`
- `input`

```ts
interface RebuttalAgentInput {
  evidenceRecords: EvidenceRecord[];
  passages: DocumentReaderOutput["passages"];
  legalFindings: LegalReasonerOutput["legalFindings"];
}
```

- `output`

```ts
interface RebuttalAgentOutput {
  reviews: Array<{
    conclusionId: string;
    status: "Supported" | "Weakly Supported" | "Unsupported";
    issueType?: "Missing Citation" | "Overclaim" | "Wrong Indicator" | "Insufficient Evidence";
    rebuttalNote: string;
    citedEvidenceIds: string[];
    suggestedRevision?: string;
  }>;
  summary: {
    supportedCount: number;
    weaklySupportedCount: number;
    unsupportedCount: number;
    humanReviewNeeded: boolean;
  };
}
```

- `required_fields`
  - `evidenceRecords`
  - `passages`
  - `legalFindings`
- `optional_fields`
  - none
- `downstream_agent`
  - `risk-cost-quantifier`

### 4.7 Risk & Cost Quantifier Agent

- `agent_id`: `risk-cost-quantifier`
- `input`

```ts
interface RiskCostQuantifierInput {
  evidenceRecords: EvidenceRecord[];
  jurisdiction: SupportedCountry;
  taskType?: LegalTaskType;
  businessScenario: string;
  legalFindings: LegalReasonerOutput["legalFindings"];
  rebuttalReview?: RebuttalAgentOutput | null;
}
```

- `output`

```ts
interface RiskCostQuantifierOutput {
  riskSummary: {
    riskLevel: "Low" | "Moderate" | "High";
    riskSummary: string;
    businessImpactSummary: string;
    uncertaintyLevel: "Low" | "Moderate" | "High";
    humanReviewNeeded: boolean;
  };
}
```

- `required_fields`
  - `jurisdiction`
  - `legalFindings`
  - `businessScenario`
- `optional_fields`
  - `rebuttalReview`
- `downstream_agent`
  - `audit-citation`

### 4.8 Audit View & Citation Agent

- `agent_id`: `audit-citation`
- `input`

```ts
interface AuditCitationInput {
  evidenceRecords: EvidenceRecord[];
  passages: DocumentReaderOutput["passages"];
  legalFindings: LegalReasonerOutput["legalFindings"];
}
```

- `output`

```ts
interface AuditCitationOutput {
  auditItems: Array<{
    conclusionId: string;
    evidenceId: string;
    sourceId: string;
    jurisdiction: string;
    pillarId: "P6" | "P7";
    indicatorId: string;
    passageId: string;
    lawTitle: string;
    citationRef: string;
    sourceUrl: string;
    originalLegalText: string;
    verbatimSnippet: string;
    extractedClaim: string;
    legalEffect: string;
    relevanceReason: string;
    traceabilityStatus: "Complete" | "Needs Human Review";
    traceabilityNote: string;
    humanReviewNeeded: boolean;
    reviewerNote: string;
    reviewStatus: string;
  }>;
  coverageSummary: {
    totalFindings: number;
    linkedFindings: number;
    needsReviewCount: number;
  };
}
```

- `required_fields`
  - `legalFindings`
  - `evidenceLookup`
- `optional_fields`
  - none
- `downstream_agent`
  - `legal-review-export`

### 4.9 Legal Review & Export Agent

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
    riskSummary: string;
    businessImpactSummary: string;
    uncertaintyLevel: "Low" | "Moderate" | "High";
    humanReviewNeeded: boolean;
  };
  comparisonView?: Record<string, string>;
}
```

- `output`

```ts
interface LegalReviewExportOutput {
  finalReport: string;
  judgeSummary: string;
  exportReadiness: "Ready for Judge Review" | "Needs Human Review";
  reviewSummary: {
    approvedCount: number;
    needsRevisionCount: number;
    rejectedCount: number;
    humanReviewCount: number;
  };
  exportJson: Record<string, unknown>;
  exportCsvRows: Array<Record<string, string | number>>;
  exportMarkdown: string;
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
    "taskType": "case-analysis",
    "workflowMode": "case-analysis",
    "selectedPillarId": "P6",
    "selectedIndicatorId": "6.4",
    "businessScenario": "Demo review of a manually imported legal evidence block for cross-border data compliance.",
    "scopeConfirmed": true,
    "focusIndicators": ["P6:6.4"]
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

### Document Reader Output

```json
{
  "status": "success",
  "agent_id": "document-reader",
  "data": {
    "passages": [
      {
        "lawTitle": "Mock Personal Information Export Compliance Notice",
        "citationAnchor": "Art. 12",
        "text": "Outbound transfer of important datasets shall complete the designated security review before the transfer is activated.",
        "sourceUrl": "https://example.gov.cn/mock-export-notice"
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
        "mappingReason": "Transfer is conditioned on prior review.",
        "citationRef": "Art. 12"
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
        "jurisdiction": "China",
        "indicatorId": "P6_4_CONDITIONAL_FLOW",
        "conclusion": "Outbound transfer is legally allowed only after an ex ante security review.",
        "legalEffect": "Creates a conditional flow regime rather than an absolute ban.",
        "evidenceIds": ["ev_001"]
      }
    ]
  }
}
```

### Risk & Cost Quantifier Output

```json
{
  "status": "success",
  "agent_id": "risk-cost-quantifier",
  "data": {
    "riskSummary": {
      "riskLevel": "Moderate",
      "riskSummary": "Risk is Moderate for the selected indicator based on the bound legal findings.",
      "businessImpactSummary": "The current legal findings indicate a moderate operational risk posture for P6 indicator 6.4. Business planning can proceed, but teams should validate exceptions and trigger conditions.",
      "uncertaintyLevel": "Low",
      "humanReviewNeeded": false
    }
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
        "conclusionId": "CON-EV-CHN-001",
        "evidenceId": "EV-CHN-001",
        "sourceId": "SRC-EV-CHN-001",
        "jurisdiction": "China",
        "indicatorId": "P6_4_CONDITIONAL_FLOW",
        "lawTitle": "Mock Personal Information Export Compliance Notice",
        "citationRef": "Art. 12",
        "sourceUrl": "https://example.gov.cn/mock-export-notice",
        "originalLegalText": "Outbound transfer of important datasets shall complete the designated security review before the transfer is activated.",
        "verbatimSnippet": "\"Outbound transfer of important datasets shall complete the designated security review before the transfer is activated.\"",
        "extractedClaim": "Outbound transfer is legally allowed only after an ex ante security review.",
        "legalEffect": "Creates a conditional flow regime rather than an absolute ban.",
        "relevanceReason": "Directly describes transfer conditions, approvals, or safeguard gates.",
        "traceabilityStatus": "Complete",
        "traceabilityNote": "The legal claim, source text, and citation are fully linked for demo review.",
        "humanReviewNeeded": false,
        "reviewerNote": "Accurately captures the pre-transfer approval point.",
        "reviewStatus": "Approved"
      }
    ],
    "coverageSummary": {
      "totalFindings": 1,
      "linkedFindings": 1,
      "needsReviewCount": 0
    }
  }
}
```

### Export Output

```json
{
  "status": "success",
  "agent_id": "legal-review-export",
  "data": {
    "finalReport": "fintech scenario review for China indicates moderate risk with 1 mapped Pillar 6 indicator areas.",
    "judgeSummary": "fintech scenario review for China indicates moderate risk with 1 mapped Pillar 6 indicator areas. 1 evidence item is approved for presentation, while 0 items still need human legal review.",
    "exportReadiness": "Ready for Judge Review",
    "reviewSummary": {
      "approvedCount": 1,
      "needsRevisionCount": 0,
      "rejectedCount": 0,
      "humanReviewCount": 0
    },
    "exportJson": {
      "scope": "Pillar 6",
      "mappedIndicators": ["P6_4_CONDITIONAL_FLOW"]
    },
    "exportCsvRows": [
      {
        "evidenceId": "EV-CHN-001",
        "citationRef": "Art. 12",
        "indicatorId": "P6_4_CONDITIONAL_FLOW",
        "reviewStatus": "Approved",
        "traceabilityStatus": "Complete",
        "riskLevel": "Moderate"
      }
    ],
    "exportMarkdown": "# Pillar 6 Review Package"
  }
}
```

This contract should be treated as the integration baseline for all future Codex development, mock-agent upgrades, and real API-backed agent replacement.
