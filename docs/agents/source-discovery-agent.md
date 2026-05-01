# Source Discovery Agent

## 1. Purpose
The Source Discovery Agent identifies official or authoritative source locations where Pillar 6 evidence is likely to be found.

## 2. Position in Workflow
`Input & Discovery Layer`

## 3. Input Schema
```ts
interface SourceDiscoveryInput {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  queryPlan: QueryPlanItem[];
  normalizedIntent: string;
  searchQueries: string[];
  focusIndicators: Pillar6IndicatorCode[];
}
```

## 4. Output Schema
```ts
interface SourceDiscoveryOutput {
  candidateSources: Array<{
    sourceId: string;
    evidenceId: string;
    queryId?: string;
    indicatorId?: Pillar6IndicatorCode;
    title: string;
    jurisdiction: string;
    sourceType: PreferredSourceType;
    sourceUrl: string;
    authorityLevel?: "Primary" | "Supporting";
    jurisdictionMatch?: "Direct" | "Regional / Comparative";
    relevanceNote: string;
    discoveryReason?: string;
    retrievalStatus?: "Ready for Reading" | "Needs Human Check";
    matchedTerms?: string[];
  }>;
}
```

## 5. Core Logic
1. Receive structured query plans from the Query Builder Agent.
2. Route each query to the most relevant authority channel first, such as legislation portals, regulator guidance, ministry sites, treaty databases, or RDTII references.
3. Rank sources by official status and Pillar 6 relevance.
4. Discard clearly off-topic privacy-only or domestic compliance material before the reading stage.
5. Return a candidate source list with traceability back to query ID, indicator code, evidence ID, and authority rationale.

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
  "countryA": "Singapore",
  "queryPlan": [
    {
      "queryId": "QB-4-1",
      "indicatorCode": "P6_4_CONDITIONAL_FLOW",
      "targetSourceType": "Regulator guidance",
      "priority": "High",
      "queryText": "Singapore \"Conditional flow regimes\" overseas transfer comparable protection official guidance",
      "reviewerStatus": "Approved"
    }
  ],
  "searchQueries": [
    "Singapore overseas transfer comparable protection official guidance",
    "Singapore digital agreement cross-border data transfer"
  ],
  "normalizedIntent": "Assess Singapore transfer safeguards under Pillar 6.",
  "focusIndicators": ["P6_4_CONDITIONAL_FLOW"]
}
```

Mock output:
```json
{
  "candidateSources": [
    {
      "sourceId": "SRC-001",
      "evidenceId": "ev_001",
      "queryId": "QB-4-1",
      "indicatorId": "P6_4_CONDITIONAL_FLOW",
      "title": "Singapore Conditional flow regimes Compliance Guidance",
      "jurisdiction": "Singapore",
      "sourceType": "Regulator guidance",
      "sourceUrl": "https://regulator.example.sg/conditional-flow-regimes",
      "authorityLevel": "Primary",
      "jurisdictionMatch": "Direct",
      "relevanceNote": "Likely evidence for conditional flow regimes.",
      "discoveryReason": "Spawned from QB-4-1 because the query prioritized regulator guidance.",
      "retrievalStatus": "Ready for Reading",
      "matchedTerms": ["Singapore", "overseas transfer", "comparable protection"]
    }
  ]
}
```
