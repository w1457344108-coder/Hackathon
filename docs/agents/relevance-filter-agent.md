# Relevance Filter Agent

## 1. Purpose
The Relevance Filter Agent keeps only the legal passages that are genuinely relevant to Pillar 6 cross-border data policy analysis.

## 2. Position in Workflow
`Evidence & Reasoning Layer`

## 3. Input Schema
```ts
interface RelevanceFilterInput {
  jurisdiction: string;
  passages: Array<{
    lawTitle: string;
    citationAnchor: string;
    text: string;
    sourceUrl: string;
  }>;
  objective: string;
}
```

## 4. Output Schema
```ts
interface RelevanceFilterOutput {
  shortlistedPassages: Array<{
    lawTitle: string;
    citationAnchor: string;
    text: string;
    relevanceReason: string;
  }>;
}
```

## 5. Core Logic
1. Read the structured passages.
2. Compare them against the scoped Pillar 6 objective.
3. Remove purely domestic privacy, consumer, or unrelated compliance text.
4. Keep only transfer, localization, infrastructure, commitment, or approval clauses.
5. Tag the reason each passage is relevant.

## 6. Pillar 6 Relevance
This is the first agent that materially narrows the dataset to the five Pillar 6 indicators:
- bans/local processing
- local storage
- infrastructure requirements
- conditional flow regimes
- binding commitments

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
Mock input:
```json
{
  "jurisdiction": "China",
  "objective": "Find legal rules governing outbound transfer conditions.",
  "passages": [
    {
      "lawTitle": "Mock Personal Information Export Compliance Notice",
      "citationAnchor": "Art. 12",
      "text": "Outbound transfer of important datasets shall complete the designated security review before the transfer is activated.",
      "sourceUrl": "https://example.gov.cn/mock-export-notice"
    }
  ]
}
```

Mock output:
```json
{
  "shortlistedPassages": [
    {
      "lawTitle": "Mock Personal Information Export Compliance Notice",
      "citationAnchor": "Art. 12",
      "text": "Outbound transfer of important datasets shall complete the designated security review before the transfer is activated.",
      "relevanceReason": "Directly describes a transfer condition."
    }
  ]
}
```
