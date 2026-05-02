# Legal Review & Export Agent

## 1. Purpose
The Legal Review & Export Agent packages the fully reviewed Pillar 6 sidecar results into judge-facing summaries and export-ready artifacts.

## 2. Position in Workflow
`Review & Delivery Layer`

## 3. Input Schema
```ts
interface LegalReviewExportInput {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  auditItems: AuditCitationOutput["auditItems"];
  riskSummary: RiskCostQuantifierOutput["riskSummary"];
  comparison: ComparisonAgentResult | null;
}
```

## 4. Output Schema
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

## 5. Core Logic
1. Read the completed sidecar audit items and risk summary.
2. Count reviewer outcomes and determine whether the package is presentation-ready.
3. Build a concise judge-facing summary.
4. Generate JSON, CSV, and Markdown artifacts from the same reviewed source set.
5. Preserve review status and traceability throughout the export package.

## 6. Pillar 6 Relevance
This agent does not create new legal findings. It consolidates reviewed Pillar 6 evidence into a final, auditable delivery package.

## 7. Failure Handling
```ts
interface LegalReviewExportFailure {
  status: "error";
  errorType: "EXPORT_BUILD_FAILED" | "REVIEW_INCOMPLETE";
  message: string;
  partialArtifacts?: string[];
}
```

## 8. Example
Mock output:
```json
{
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
    "scope": "Pillar 6"
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
```
