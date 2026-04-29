# Legal Review & Export Agent

## 1. Purpose
The Legal Review & Export Agent packages the reviewed Pillar 6 findings into structured outputs suitable for judges, teammates, and future API integration.

## 2. Position in Workflow
`Review & Delivery Layer`

## 3. Input Schema
```ts
interface LegalReviewExportInput {
  auditItems: Array<{
    citation: string;
    extractedText: string;
    indicatorMapping: string;
  }>;
  riskSummary: {
    riskLevel: "Low" | "Moderate" | "High";
    businessImpactSummary: string;
  };
  comparisonView?: Record<string, string>;
}
```

## 4. Output Schema
```ts
interface LegalReviewExportOutput {
  finalReport: string;
  exportJson: Record<string, unknown>;
  exportCsvRows: Array<Record<string, string | number>>;
  exportMarkdown: string;
}
```

## 5. Core Logic
1. Collect reviewed audit items and quantified risk signals.
2. Compile them into a final policy-analysis narrative.
3. Generate structured exports for JSON, CSV, and Markdown.
4. Preserve citation integrity and review status.
5. Return a presentation-ready output package.

## 6. Pillar 6 Relevance
This agent does not invent new legal findings. It consolidates all five Pillar 6 indicator outcomes into a final judge-facing deliverable.

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
Mock input:
```json
{
  "auditItems": [
    {
      "citation": "Art. 12",
      "extractedText": "Transfer is legally conditioned on prior review.",
      "indicatorMapping": "conditional-flow"
    }
  ],
  "riskSummary": {
    "riskLevel": "High",
    "businessImpactSummary": "Pre-transfer approval creates meaningful compliance friction."
  }
}
```

Mock output:
```json
{
  "finalReport": "The jurisdiction applies a conditional transfer regime under Pillar 6 and imposes meaningful outbound compliance friction.",
  "exportJson": {
    "overallRisk": "High",
    "mappedIndicators": ["conditional-flow"]
  },
  "exportCsvRows": [
    {
      "citation": "Art. 12",
      "indicator": "conditional-flow",
      "risk": "High"
    }
  ],
  "exportMarkdown": "# Pillar 6 Report\n\n- Conditional flow regime identified.\n- Overall risk: High."
}
```
