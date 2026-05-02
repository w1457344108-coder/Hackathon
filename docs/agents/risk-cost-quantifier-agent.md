# Risk & Cost Quantifier Agent

## 1. Purpose
The Risk & Cost Quantifier Agent converts completed mainline legal findings into business-facing risk and cost signals without changing the mainline reasoning logic.

## 2. Position in Workflow
`Strategic Control & Reasoning Layer`

## 3. Input Schema
```ts
interface RiskCostQuantifierInput {
  jurisdiction: string;
  legalFindings: Array<{
    conclusionId: string;
    jurisdiction: string;
    indicatorId: Pillar6IndicatorEnum;
    conclusion: string;
    legalEffect: string;
    evidenceIds: string[];
  }>;
}
```

## 4. Output Schema
```ts
interface RiskCostQuantifierOutput {
  riskSummary: {
    riskLevel: "Low" | "Moderate" | "High";
    businessCostDrivers: string[];
    operationalImpact: string;
    uncertaintyLevel: "Low" | "Moderate" | "High";
    humanReviewNeeded: boolean;
  };
}
```

## 5. Core Logic
1. Inspect the legal effect and indicator mix in the completed mainline findings.
2. Estimate likely compliance friction and operational burden.
3. Add review sensitivity if any underlying evidence still needs human confirmation.
4. Produce a risk level, uncertainty level, and cost-driver summary.
5. Pass the result to audit and export sidecars.

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
