# Query Builder Agent

## 1. Purpose
The Query Builder Agent transforms a plain-language legal research goal into structured search logic for Pillar 6 evidence discovery.

## 2. Position in Workflow
`Input & Discovery Layer`

## 3. Input Schema
```ts
interface QueryBuilderInput {
  jurisdiction: string;
  userObjective: string;
  legalTerms: string[];
  synonyms?: string[];
  exclusionTerms?: string[];
  preferredSources?: string[];
}
```

## 4. Output Schema
```ts
interface QueryBuilderOutput {
  searchQueries: string[];
  sourceHints: string[];
  indicatorTargets: Array<
    | "ban-local-processing"
    | "local-storage"
    | "infrastructure"
    | "conditional-flow"
    | "binding-commitments"
  >;
}
```

## 5. Core Logic
1. Parse the normalized legal objective.
2. Expand user terms with Pillar 6-specific legal synonyms.
3. Generate jurisdiction-aware query strings.
4. Add exclusion terms to suppress non-relevant material.
5. Return structured search queries for source discovery.

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
  "jurisdiction": "European Union",
  "userObjective": "Find rules governing transfer of data to third countries.",
  "legalTerms": ["third country transfer", "appropriate safeguards"],
  "synonyms": ["adequacy decision", "standard contractual clauses"],
  "exclusionTerms": ["consumer rights"],
  "preferredSources": ["Official legislation portal", "Regulator guidance"]
}
```

Mock output:
```json
{
  "searchQueries": [
    "European Union third country transfer appropriate safeguards",
    "EU adequacy decision standard contractual clauses official source"
  ],
  "sourceHints": ["eur-lex", "commission guidance"],
  "indicatorTargets": ["conditional-flow", "binding-commitments"]
}
```
