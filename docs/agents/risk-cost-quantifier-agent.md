# Risk & Cost Quantifier Agent

## 1. Purpose
The Risk & Cost Quantifier Agent converts Pillar 6 legal findings into operational risk and compliance burden signals for business users.

## 2. Position in Workflow
`Evidence & Reasoning Layer`

## 3. Input Schema
```ts
interface RiskCostQuantifierInput {
  jurisdiction: string;
  reasonedFindings: Array<{
    indicator: string;
    conclusion: string;
    legalEffect: string;
  }>;
  contextSnapshot?: {
    unresolvedIssues: string[];
  };
}
```

## 4. Output Schema
```ts
interface RiskCostQuantifierOutput {
  riskLevel: "Low" | "Moderate" | "High";
  costDrivers: string[];
  businessImpactSummary: string;
}
```

## 5. Core Logic
1. Inspect the legal effect of each Pillar 6 finding.
2. Estimate how much compliance burden it creates.
3. Translate approval gates, localization, and infrastructure rules into cost drivers.
4. Produce a risk level and a concise impact summary.
5. Pass quantification results to review and export.

## 6. Pillar 6 Relevance
This agent interprets the business effect of:
- local processing requirements
- storage localization
- infrastructure localization
- conditional approvals and safeguards
- absence or presence of binding transfer commitments

## 7. Failure Handling
```ts
interface RiskCostQuantifierFailure {
  status: "error";
  errorType: "MISSING_COST_SIGNAL" | "UNRESOLVED_RISK_LOGIC";
  message: string;
  fallbackRiskLevel?: "Moderate";
}
```

## 8. Example
Mock input:
```json
{
  "jurisdiction": "China",
  "reasonedFindings": [
    {
      "indicator": "conditional-flow",
      "conclusion": "Transfers are allowed only after formal review.",
      "legalEffect": "Adds ex ante approval friction."
    }
  ]
}
```

Mock output:
```json
{
  "riskLevel": "High",
  "costDrivers": ["security review lead time", "approval preparation burden"],
  "businessImpactSummary": "Outbound data operations face material pre-transfer compliance friction."
}
```
