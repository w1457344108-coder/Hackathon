# Audit View & Citation Agent

## 1. Purpose
The Audit View & Citation Agent is a supporting sidecar that links mainline legal findings back to shortlisted evidence, verbatim source text, and reviewer context.

## 2. Position in Workflow
`Review & Delivery Layer`

## 3. Input Schema
```ts
interface AuditViewCitationInput {
  shortlistedPassages: RelevanceFilterOutput["shortlistedPassages"];
  legalFindings: LegalReasonerOutput["legalFindings"];
}
```

## 4. Output Schema
```ts
interface AuditViewCitationOutput {
  auditItems: Array<{
    evidenceId: string;
    sourceId: string;
    conclusionId: string;
    jurisdiction: string;
    indicatorId: Pillar6IndicatorEnum;
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

## 5. Core Logic
1. Read completed mainline legal findings.
2. Match each finding to the sidecar relevance shortlist.
3. Preserve citation, verbatim snippet, original legal text, and review status together.
4. Mark whether the citation chain is complete or still needs human confirmation.
5. Return UI-ready audit objects for legal review and final export.

## 6. Pillar 6 Relevance
This agent ensures every Pillar 6 claim about transfer restrictions or commitments remains visibly anchored in legal text before presentation.

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
Mock output:
```json
{
  "auditItems": [
    {
      "evidenceId": "EV-CHN-001",
      "sourceId": "SRC-EV-CHN-001",
      "conclusionId": "CON-EV-CHN-001",
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
```
