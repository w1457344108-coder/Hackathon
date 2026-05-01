# Query Builder Agent

## 1. Purpose
The Query Builder Agent transforms a plain-language legal research goal into structured search logic for Pillar 6 evidence discovery.

## 2. Position in Workflow
`Input & Discovery Layer`

## 3. Input Schema
```ts
interface QueryBuilderInput {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  userQuery: string;
  intent: IntentArbiterOutput;
}
```

## 4. Output Schema
```ts
interface QueryBuilderOutput {
  normalizedIntent: string;
  sourcePriorityOrder: PreferredSourceType[];
  queryPlan: Array<{
    queryId: string;
    indicatorCode: Pillar6IndicatorCode;
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
  }>;
  searchQueries: string[];
  targetIndicators: Pillar6IndicatorCode[];
  reviewChecklist: string[];
}
```

## 5. Core Logic
1. Consume the mainline `Intent Arbiter` result instead of re-deciding Pillar 6 scope.
2. Expand business-scenario and jurisdiction terms with Pillar 6-specific legal vocabulary.
3. Generate indicator-specific query plans rather than one generic search string.
4. Prioritize official sources before softer secondary materials.
5. Add exclusion terms to suppress non-relevant material.
6. Return a structured query plan plus a flat search string projection for downstream discovery.

## 6. Pillar 6 Relevance
The agent creates queries specifically aligned with:
- local processing restrictions
- local storage obligations
- infrastructure localization rules
- conditional transfer mechanisms
- treaty or agreement-based transfer commitments

## 7. Failure Handling
```ts
interface QueryBuilderFailure {
  status: "error";
  errorType: "INVALID_QUERY_INPUT" | "EMPTY_OBJECTIVE";
  message: string;
  fallbackQueries: string[];
}
```

## 8. Example
Mock input:
```json
{
  "countryA": "European Union",
  "businessScenario": "cloud service",
  "userQuery": "Find rules governing transfer of data to third countries under Pillar 6.",
  "intent": {
    "normalizedIntent": "Find rules governing transfer of data to third countries under Pillar 6.",
    "workflowMode": "single-jurisdiction",
    "pillar6ScopeConfirmed": true,
    "focusIndicators": ["P6_4_CONDITIONAL_FLOW", "P6_5_BINDING_COMMITMENT"]
  }
}
```

Mock output:
```json
{
  "normalizedIntent": "Find rules governing transfer of data to third countries under Pillar 6.",
  "sourcePriorityOrder": ["Official legislation portal", "Regulator guidance"],
  "queryPlan": [
    {
      "queryId": "QB-4-1",
      "indicatorCode": "P6_4_CONDITIONAL_FLOW",
      "indicatorLabel": "Conditional flow regimes",
      "targetSourceType": "Official legislation portal",
      "priority": "High",
      "languageHint": "English",
      "mustTerms": ["European Union", "cross-border transfer approval", "security assessment"],
      "shouldTerms": ["third country transfer", "appropriate safeguards", "adequacy decision"],
      "excludeTerms": ["consumer rights"],
      "queryText": "European Union \"Conditional flow regimes\" cross-border transfer approval security assessment (third country transfer OR appropriate safeguards OR adequacy decision) -consumer rights",
      "whyThisQuery": "Targets conditional transfer rules first through official legislation.",
      "reviewerStatus": "Suggested",
      "reviewerNote": ""
    }
  ],
  "searchQueries": [
    "European Union \"Conditional flow regimes\" cross-border transfer approval security assessment (third country transfer OR appropriate safeguards OR adequacy decision) -consumer rights"
  ],
  "targetIndicators": ["P6_4_CONDITIONAL_FLOW", "P6_5_BINDING_COMMITMENT"],
  "reviewChecklist": [
    "Check whether the query stays within Pillar 6 transfer-policy scope.",
    "Confirm the preferred source order still prioritizes official materials."
  ]
}
```
