# Codex Project Context: Cross-Border Data Policy Multi-Agent Analyst

## Project Goal

This project is a hackathon-ready Next.js demo for a cross-border data policy multi-agent analysis system. It focuses strictly on UN ESCAP RDTII Pillar 6: Cross-Border Data Policies.

The product should demonstrate an auditable legal evidence workflow:

1. User enters a jurisdiction, business scenario, and plain-language question.
2. The system generates a search profile and source plan.
3. Agents produce candidate sources, legal passages, Pillar 6 mappings, legal findings, risk signals, audit items, and export artifacts.
4. Law students participate in search-term revision, source/evidence review, mapping review, and export confirmation.
5. Outputs are reviewable and exportable as JSON, CSV, and Markdown.

This is not meant to be a fully automated legal-advice system. It is a review-first, evidence-backed demo.

## Current Technical Stack

- Next.js 16.2.4 App Router
- React 19.2.5
- TypeScript
- Tailwind CSS 3.4.19
- Mock data and deterministic mock agents
- Vercel-friendly app structure

Important commands:

```bash
npm install
npm run dev
npm run build
npm run validate:agents
npm run validate:mainline
```

## Current Repository State

This folder was created from the latest GitHub `main` branch of:

```text
w1457344108-coder/Hackathon
```

Local folder:

```text
C:\Users\Rakan\Desktop\hks
```

Because direct `git clone` / `git pull` to `github.com:443` was not reachable from this machine, the latest `main` source was downloaded through the GitHub API zipball endpoint and extracted here.

## Current Agent Progress

The project now has a ten-agent architecture baseline and partial mock orchestration.

### Ten-agent order

1. Intent Arbiter
2. Query Builder
3. Source Discovery
4. Document Reader
5. Relevance Filter
6. Indicator Mapping
7. Legal Reasoner
8. Risk & Cost Quantifier
9. Audit View & Citation
10. Legal Review & Export

### Implemented / wired in latest main

The current workflow exposes:

- `WorkflowResult.agentTrace`
- `WorkflowResult.demoNarrative`
- `WorkflowResult.mainlineAgentResults`
- `WorkflowResult.supportingAgentResults.queryBuilder`

The five mainline agents are wired as deterministic mock functions:

- `intentArbiter`
- `sourceDiscovery`
- `documentReader`
- `indicatorMapping`
- `legalReasoner`

The supporting `queryBuilder` agent is also adapted as a pre-discovery input layer. Its output is exposed through:

```ts
supportingAgentResults.queryBuilder
```

and consumed by `sourceDiscovery` through a generated `queryPlan`.

### Not yet fully wired

The remaining supporting agents still need implementation as contract-ready mock agents:

- `relevanceFilter`
- `riskCostQuantifier`
- `auditCitation`
- `legalReviewExport`

After those are wired, the full ten-agent mock workflow should be connected end to end.

## Current Mock vs Future LLM/API Boundary

Current version:

- Uses deterministic TypeScript functions.
- Uses `mockEvidenceRecords`.
- Does not call a real LLM.
- Does not perform real legal source retrieval.
- Does not parse real PDF/HTML legal documents.

Future version:

- Each agent should get a fixed role prompt.
- Each agent should receive a strict JSON input.
- Each agent should return a strict JSON output matching the TypeScript contract.
- OpenAI API or another LLM service can replace the deterministic mock internals.
- UI and export components should keep using the same contracts.

Recommended order:

```text
Finish ten mock agents -> verify full workflow -> write prompts -> add API calls -> replace mock internals
```

## Canonical Pillar 6 Indicator Codes

All mappings must use only these codes:

```ts
P6_1_BAN_LOCAL_PROCESSING
P6_2_LOCAL_STORAGE
P6_3_INFRASTRUCTURE
P6_4_CONDITIONAL_FLOW
P6_5_BINDING_COMMITMENT
```

Do not introduce Pillar 7 fields or generic domestic privacy labels into final outputs.

## Key Files

```text
app/api/analyze/route.ts
```

Streaming API endpoint for running the mock workflow.

```text
lib/agents.ts
```

Current home of deterministic mock agent orchestration.

```text
lib/types.ts
```

Current workflow and agent output contracts.

```text
lib/pillar6-schema.ts
```

Pillar 6 evidence and UI-facing evidence types.

```text
lib/mock-evidence.ts
```

Mock evidence records, search profile helpers, and Pillar 6 display helpers.

```text
components/analyst-dashboard.tsx
```

Main dashboard UI.

```text
components/legal-search-workspace.tsx
components/audit-view.tsx
components/export-panel.tsx
```

Core UI modules for search profile, evidence audit, and export.

```text
docs/agent-parameters.md
docs/agents/
```

Agent contract and individual agent descriptions.

```text
scripts/validate-agent-readiness.mjs
scripts/validate-mainline-agents.mjs
```

Validation scripts for orchestration readiness.

## Demo Narrative

Recommended demo story:

```text
A fintech team wants to understand whether data can move from China to Singapore while staying inside UN ESCAP RDTII Pillar 6 scope.
```

Demo path:

1. Use Legal Search Workspace to generate Search Profile JSON.
2. Explain the ten-agent trace.
3. Show candidate evidence and Pillar 6 mapping.
4. Open Evidence Audit View.
5. Let law student reviewer approve, revise, or reject evidence.
6. Export reviewed package as JSON / CSV / Markdown.

## Immediate Next Work

The next best task is to wire the remaining supporting mock agents:

1. `relevanceFilter`
   - Input: document-reader passages and focus indicators.
   - Output: shortlisted evidence with relevance reasons.

2. `riskCostQuantifier`
   - Input: legal findings.
   - Output: risk level, cost drivers, operational impact.

3. `auditCitation`
   - Input: legal findings and evidence lookup.
   - Output: audit items linking claims to legal text and citations.

4. `legalReviewExport`
   - Input: audit items, reviewer status/notes, risk summary.
   - Output: final report plus JSON / CSV / Markdown export bundle.

After that, update:

- `SupportingAgentResults`
- `runMainlineAgents` or a new `runTenAgentWorkflow`
- validation scripts
- README
- API response shape if needed

## Important Constraints

- Keep everything scoped to Pillar 6.
- Keep internal app/API field names in camelCase.
- Preserve evidence traceability through `evidenceId`, `sourceUrl`, and `citationRef`.
- Do not replace the UI contracts while wiring mock agents.
- Do not jump to real LLM API integration until the ten-agent mock workflow is stable.

