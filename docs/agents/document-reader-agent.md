# Document Reader Agent

## 1. Purpose
The Document Reader Agent converts raw legal material into structured passages that later agents can filter, map, and reason over.

## 2. Position in Workflow
`Input & Discovery Layer`

## 3. Input Schema
```ts
interface DocumentReaderInput {
  sources: Array<{
    title: string;
    sourceType: string;
    url: string;
  }>;
}
```

## 4. Output Schema
```ts
interface DocumentReaderOutput {
  passages: Array<{
    lawTitle: string;
    citationAnchor: string;
    text: string;
    sourceUrl: string;
  }>;
}
```

## 5. Core Logic
1. Open the selected source.
2. Normalize PDF, OCR, HTML, or notice text into plain legal passages.
3. Split the text into citation-ready units.
4. Preserve section anchors and source URLs.
5. Forward structured passages for relevance screening.

## 6. Pillar 6 Relevance
The Document Reader Agent does not classify policy by itself, but it creates the structured evidence needed to detect:
- local processing clauses
- local storage clauses
- infrastructure location obligations
- transfer approval conditions
- binding cross-border commitments

## 7. Failure Handling
```ts
interface DocumentReaderFailure {
  status: "error";
  errorType: "PARSE_FAILED" | "OCR_LOW_CONFIDENCE";
  message: string;
  partialPassages?: Array<{ text: string; sourceUrl: string }>;
}
```

## 8. Example
Mock input:
```json
{
  "sources": [
    {
      "title": "Mock Critical Information Infrastructure Data Rule",
      "sourceType": "Statute",
      "url": "https://example.gov.cn/mock-cii-rule"
    }
  ]
}
```

Mock output:
```json
{
  "passages": [
    {
      "lawTitle": "Mock Critical Information Infrastructure Data Rule",
      "citationAnchor": "Sec. 5",
      "text": "Critical operators shall store covered operational and personal data within domestic territory unless a lawful exception applies.",
      "sourceUrl": "https://example.gov.cn/mock-cii-rule"
    }
  ]
}
```
