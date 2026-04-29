# Pillar 6 Context Memory Agent

## 1. Purpose
The Pillar 6 Context Memory Agent stores workflow assumptions, unresolved legal questions, and prior reasoning so the system remains internally consistent.

## 2. Position in Workflow
`Evidence & Reasoning Layer`

## 3. Input Schema
```ts
interface Pillar6ContextMemoryInput {
  jurisdiction: string;
  reasonedFindings: Array<{
    indicator: string;
    conclusion: string;
    legalEffect: string;
  }>;
  unresolvedIssues?: string[];
}
```

## 4. Output Schema
```ts
interface Pillar6ContextMemoryOutput {
  contextSnapshot: {
    jurisdiction: string;
    activeIndicators: string[];
    reasoningNotes: string[];
    unresolvedIssues: string[];
  };
}
```

## 5. Core Logic
1. Read current reasoned findings.
2. Store active indicator conclusions.
3. Keep track of ambiguity or unresolved conflicts.
4. Preserve notes for downstream quantification and export.
5. Return a stable memory snapshot.

## 6. Pillar 6 Relevance
This agent helps maintain consistency when multiple Pillar 6 indicators interact, such as:
- local storage plus conditional transfer approval
- infrastructure obligations plus local processing requirements
- treaty commitments plus domestic safeguards

## 7. Failure Handling
```ts
interface Pillar6ContextMemoryFailure {
  status: "error";
  errorType: "MEMORY_SYNC_FAILED" | "CONTEXT_COLLISION";
  message: string;
  safeReset?: boolean;
}
```

## 8. Example
Mock input:
```json
{
  "jurisdiction": "Singapore",
  "reasonedFindings": [
    {
      "indicator": "conditional-flow",
      "conclusion": "Transfers are allowed subject to comparable protection.",
      "legalEffect": "A safeguards-based permission structure applies."
    }
  ],
  "unresolvedIssues": ["Need to confirm whether the guidance is binding."]
}
```

Mock output:
```json
{
  "contextSnapshot": {
    "jurisdiction": "Singapore",
    "activeIndicators": ["conditional-flow"],
    "reasoningNotes": ["Safeguards test governs outbound transfer."],
    "unresolvedIssues": ["Need to confirm whether the guidance is binding."]
  }
}
```
