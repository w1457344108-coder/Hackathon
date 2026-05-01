# Relevance Filter Agent

## 1. Purpose
The Relevance Filter Agent is a supporting sidecar that reads completed mainline passages and keeps only the evidence that is still genuinely useful for Pillar 6 audit and export.

## 2. Position in Workflow
`Filtering, Mapping & Review Layer`

## 3. Input Schema
```ts
interface RelevanceFilterInput {
  focusIndicators: Pillar6IndicatorEnum[];
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

## 4. Output Schema
```ts
interface RelevanceFilterOutput {
  shortlistedPassages: Array<{
    evidenceId: string;
    sourceId: string;
    jurisdiction: string;
    indicatorId: Pillar6IndicatorEnum;
    lawTitle: string;
    citationRef: string;
    sourceUrl: string;
    sourceType: string;
    text: string;
    relevanceReason: string;
    relevanceBand: "Direct Match" | "Borderline";
    humanReviewNeeded: boolean;
    reviewerPrompt: string;
  }>;
  filteredOutEvidenceIds: string[];
  reviewSummary: {
    shortlistedCount: number;
    filteredOutCount: number;
    humanReviewCount: number;
  };
  reviewerChecklist: string[];
}
```

## 5. Core Logic
1. Read the completed mainline passages without changing the mainline pipeline.
2. Keep only passages whose evidence records still align with the scoped Pillar 6 indicators.
3. Mark stronger passages as `Direct Match` and ambiguous ones as `Borderline`.
4. Generate reviewer prompts for law-student spot checks.
5. Pass only shortlisted evidence into audit and export packaging.

## 6. Pillar 6 Relevance
This supporting agent narrows the review surface to the five Pillar 6 dimensions:
- local processing restrictions
- local storage obligations
- infrastructure requirements
- conditional transfer gates
- binding transfer commitments

## 7. Failure Handling
```ts
interface RelevanceFilterFailure {
  status: "error";
  errorType: "NO_SHORTLISTED_PASSAGES" | "RELEVANCE_THRESHOLD_TOO_LOW";
  message: string;
  reviewQueue?: string[];
}
```

## 8. Example
Mock output:
```json
{
  "shortlistedPassages": [
    {
      "evidenceId": "EV-CHN-001",
      "sourceId": "SRC-EV-CHN-001",
      "jurisdiction": "China",
      "indicatorId": "P6_4_CONDITIONAL_FLOW",
      "lawTitle": "Mock Personal Information Export Compliance Notice",
      "citationRef": "Art. 12",
      "sourceUrl": "https://example.gov.cn/mock-export-notice",
      "sourceType": "Regulator guidance",
      "text": "Outbound transfer of important datasets shall complete the designated security review before the transfer is activated.",
      "relevanceReason": "Directly describes transfer conditions, approvals, or safeguard gates.",
      "relevanceBand": "Direct Match",
      "humanReviewNeeded": false,
      "reviewerPrompt": "This passage is a strong Pillar 6 fit and can move into audit packaging."
    }
  ],
  "filteredOutEvidenceIds": [],
  "reviewSummary": {
    "shortlistedCount": 1,
    "filteredOutCount": 0,
    "humanReviewCount": 0
  },
  "reviewerChecklist": [
    "Confirm every shortlisted passage still belongs to Pillar 6 rather than general privacy compliance."
  ]
}
```
