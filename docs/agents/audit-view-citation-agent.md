# Audit View & Citation Agent

## 1. Purpose
The Audit View & Citation Agent ties every extracted policy claim back to its original legal text, citation anchor, and source URL for traceability.

## 2. Position in Workflow
`Review & Delivery Layer`

## 3. Input Schema
```ts
interface AuditViewCitationInput {
  evidenceItems: Array<{
    lawTitle: string;
    citation: string;
    verbatimSnippet: string;
    sourceUrl: string;
  }>;
  reasonedFindings: Array<{
    indicator: string;
    conclusion: string;
  }>;
}
```

## 4. Output Schema
```ts
interface AuditViewCitationOutput {
  auditItems: Array<{
    citation: string;
    originalLegalText: string;
    extractedText: string;
    indicatorMapping: string;
    sourceUrl: string;
  }>;
}
```

## 5. Core Logic
1. Receive reviewed evidence and reasoned conclusions.
2. Link each conclusion to a specific citation and source text.
3. Preserve the verbatim snippet and source URL.
4. Build UI-ready audit objects for front-end review.
5. Pass the traceable evidence chain to the export layer.

## 6. Pillar 6 Relevance
This agent is crucial because Pillar 6 scoring must be evidence-backed. It ensures that claims about:
- processing bans
- storage obligations
- infrastructure rules
- conditional transfer mechanisms
- treaty commitments

are visibly anchored in source text.

## 7. Failure Handling
```ts
interface AuditViewCitationFailure {
  status: "error";
  errorType: "MISSING_CITATION" | "BROKEN_EVIDENCE_CHAIN";
  message: string;
  unresolvedEvidence?: string[];
}
```

## 8. Example
Mock input:
```json
{
  "evidenceItems": [
    {
      "lawTitle": "Mock Personal Information Export Compliance Notice",
      "citation": "Art. 12",
      "verbatimSnippet": "Outbound transfer of important datasets shall complete the designated security review before the transfer is activated.",
      "sourceUrl": "https://example.gov.cn/mock-export-notice"
    }
  ],
  "reasonedFindings": [
    {
      "indicator": "conditional-flow",
      "conclusion": "Transfer is legally conditioned on prior review."
    }
  ]
}
```

Mock output:
```json
{
  "auditItems": [
    {
      "citation": "Art. 12",
      "originalLegalText": "Outbound transfer of important datasets shall complete the designated security review before the transfer is activated.",
      "extractedText": "Transfer is legally conditioned on prior review.",
      "indicatorMapping": "conditional-flow",
      "sourceUrl": "https://example.gov.cn/mock-export-notice"
    }
  ]
}
```
