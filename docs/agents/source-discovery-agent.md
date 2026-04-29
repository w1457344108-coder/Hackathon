# Source Discovery Agent

## 1. Purpose
The Source Discovery Agent identifies official or authoritative source locations where Pillar 6 evidence is likely to be found.

## 2. Position in Workflow
`Input & Discovery Layer`

## 3. Input Schema
```ts
interface SourceDiscoveryInput {
  jurisdiction: string;
  searchQueries: string[];
  preferredSources?: string[];
}
```

## 4. Output Schema
```ts
interface SourceDiscoveryOutput {
  candidateSources: Array<{
    title: string;
    sourceType: string;
    url: string;
    relevanceNote: string;
  }>;
}
```

## 5. Core Logic
1. Receive structured queries from the Query Builder Agent.
2. Search for likely statutes, regulations, treaty texts, and regulator guidance.
3. Rank sources by official status and Pillar 6 relevance.
4. Discard clearly off-topic privacy-only or domestic compliance material.
5. Return a candidate source list for reading and parsing.

## 6. Pillar 6 Relevance
This agent locates the evidence base for all five Pillar 6 indicators, especially:
- conditional transfer rules
- localization clauses
- infrastructure hosting obligations
- treaty-level data transfer commitments

## 7. Failure Handling
```ts
interface SourceDiscoveryFailure {
  status: "error";
  errorType: "NO_RELEVANT_SOURCE_FOUND" | "SOURCE_ACCESS_FAILED";
  message: string;
  fallbackSources?: string[];
}
```

## 8. Example
Mock input:
```json
{
  "jurisdiction": "Singapore",
  "searchQueries": [
    "Singapore overseas transfer comparable protection official guidance",
    "Singapore digital agreement cross-border data transfer"
  ]
}
```

Mock output:
```json
{
  "candidateSources": [
    {
      "title": "Mock Accountability Transfer Guidance",
      "sourceType": "Regulator Guidance",
      "url": "https://example.pdpc.gov.sg/mock-guidance",
      "relevanceNote": "Likely evidence for conditional flow regimes."
    }
  ]
}
```
