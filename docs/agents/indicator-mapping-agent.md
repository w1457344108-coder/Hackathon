# Indicator Mapping Agent

## 1. Purpose
The Indicator Mapping Agent aligns each shortlisted legal passage with one or more of the five RDTII Pillar 6 indicators.

## 2. Position in Workflow
`Evidence & Reasoning Layer`

## 3. Input Schema
```ts
interface IndicatorMappingInput {
  jurisdiction: string;
  shortlistedPassages: Array<{
    lawTitle: string;
    citationAnchor: string;
    text: string;
    relevanceReason: string;
  }>;
}
```

## 4. Output Schema
```ts
interface IndicatorMappingOutput {
  mappedItems: Array<{
    indicator:
      | "ban-local-processing"
      | "local-storage"
      | "infrastructure"
      | "conditional-flow"
      | "binding-commitments";
    mappingReason: string;
    citationAnchor: string;
  }>;
}
```

## 5. Core Logic
1. Inspect each shortlisted passage.
2. Compare its legal meaning to the five Pillar 6 indicators.
3. Assign the best-fit indicator.
4. Record a short justification for the mapping.
5. Return indicator-aligned items to the reasoning layer.

## 6. Pillar 6 Relevance
This agent is directly responsible for hard-matching evidence to:
- Ban and local processing requirements
- Local storage requirements
- Infrastructure requirements
- Conditional flow regimes
- Binding commitments on data transfer

## 7. Failure Handling
```ts
interface IndicatorMappingFailure {
  status: "error";
  errorType: "UNMAPPABLE_PASSAGE" | "MULTI_INDICATOR_CONFLICT";
  message: string;
  unresolvedItems?: string[];
}
```

## 8. Example
Mock input:
```json
{
  "jurisdiction": "European Union",
  "shortlistedPassages": [
    {
      "lawTitle": "Mock Adequacy and Safeguards Regulation",
      "citationAnchor": "Art. 44-46",
      "text": "Transfers to a third country may take place where an adequacy finding exists or where appropriate safeguards are in place.",
      "relevanceReason": "Describes transfer conditions."
    }
  ]
}
```

Mock output:
```json
{
  "mappedItems": [
    {
      "indicator": "conditional-flow",
      "mappingReason": "Transfer depends on adequacy or safeguards.",
      "citationAnchor": "Art. 44-46"
    }
  ]
}
```
