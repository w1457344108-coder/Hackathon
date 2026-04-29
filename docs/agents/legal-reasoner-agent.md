# Legal Reasoner Agent

## 1. Purpose
The Legal Reasoner Agent performs the core if-then legal reasoning required to interpret what a mapped Pillar 6 rule actually means in practice.

## 2. Position in Workflow
`Evidence & Reasoning Layer`

## 3. Input Schema
```ts
interface LegalReasonerInput {
  jurisdiction: string;
  mappedItems: Array<{
    indicator: string;
    mappingReason: string;
    citationAnchor: string;
  }>;
  supportingPassages: string[];
}
```

## 4. Output Schema
```ts
interface LegalReasonerOutput {
  reasonedFindings: Array<{
    indicator: string;
    conclusion: string;
    legalEffect: string;
  }>;
}
```

## 5. Core Logic
1. Receive mapped indicator items.
2. Apply legal if-then logic to the text.
3. Distinguish between prohibition, condition, exception, and commitment.
4. Summarize the practical legal effect.
5. Pass structured findings forward for memory and quantification.

## 6. Pillar 6 Relevance
This agent interprets whether the evidence shows:
- a hard ban or local processing mandate
- a local storage obligation
- an infrastructure constraint
- a conditional transfer regime
- a positive treaty-style transfer commitment

## 7. Failure Handling
```ts
interface LegalReasonerFailure {
  status: "error";
  errorType: "AMBIGUOUS_LEGAL_EFFECT" | "INSUFFICIENT_SUPPORT";
  message: string;
  fallbackConclusion?: string;
}
```

## 8. Example
Mock input:
```json
{
  "jurisdiction": "China",
  "mappedItems": [
    {
      "indicator": "conditional-flow",
      "mappingReason": "Transfer depends on prior review.",
      "citationAnchor": "Art. 12"
    }
  ],
  "supportingPassages": [
    "Outbound transfer of important datasets shall complete the designated security review before the transfer is activated."
  ]
}
```

Mock output:
```json
{
  "reasonedFindings": [
    {
      "indicator": "conditional-flow",
      "conclusion": "Transfers are legally possible but gated by ex ante review.",
      "legalEffect": "Creates a conditional flow regime rather than an absolute ban."
    }
  ]
}
```
