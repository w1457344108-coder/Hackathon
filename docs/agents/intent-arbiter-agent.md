# Intent Arbiter Agent

## 1. Purpose
The Intent Arbiter Agent decides what kind of Pillar 6 task the user is asking for before retrieval or legal reasoning starts. It converts a plain request into a scoped workflow brief focused only on cross-border data policies.

## 2. Position in Workflow
`Input & Discovery Layer`

## 3. Input Schema
```ts
interface IntentArbiterInput {
  jurisdiction: string;
  comparisonJurisdiction?: string;
  userObjective: string;
  requestedOutputs?: string[];
}
```

Example JSON:
```json
{
  "jurisdiction": "China",
  "comparisonJurisdiction": "Singapore",
  "userObjective": "Compare outbound data transfer approval mechanisms under Pillar 6.",
  "requestedOutputs": ["risk-summary", "evidence-table", "comparison-view"]
}
```

## 4. Output Schema
```ts
interface IntentArbiterOutput {
  normalizedIntent: string;
  workflowMode: "single-jurisdiction" | "cross-jurisdiction";
  pillar6Focus: string[];
  routingNote: string;
}
```

## 5. Core Logic
1. Read the user's policy question.
2. Detect whether the task is single-country or comparative.
3. Identify which Pillar 6 dimensions are implicated.
4. Reject or trim requests that drift into non-Pillar 6 domestic privacy topics.
5. Produce a normalized brief for downstream agents.

## 6. Pillar 6 Relevance
This agent keeps the workflow anchored to the five Pillar 6 indicators:
- Ban and local processing requirements
- Local storage requirements
- Infrastructure requirements
- Conditional flow regimes
- Binding commitments on data transfer

It does not evaluate those indicators directly, but it ensures the rest of the pipeline stays within them.

## 7. Failure Handling
```ts
interface IntentArbiterFailure {
  status: "error";
  errorType: "AMBIGUOUS_SCOPE" | "OUT_OF_PILLAR6_SCOPE";
  message: string;
  suggestedNarrowing?: string;
}
```

## 8. Example
Mock input:
```json
{
  "jurisdiction": "Japan",
  "userObjective": "Find whether outbound transfer rules rely on contractual safeguards or adequacy-style mechanisms."
}
```

Mock output:
```json
{
  "normalizedIntent": "Assess conditional cross-border transfer mechanisms in Japan under Pillar 6.",
  "workflowMode": "single-jurisdiction",
  "pillar6Focus": ["conditional-flow", "binding-commitments"],
  "routingNote": "Prioritize transfer mechanisms and treaty-style commitments."
}
```
