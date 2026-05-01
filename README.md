# Cross-Border Data Policy Multi-Agent Analyst

Hackathon-ready Next.js demo for analyzing cross-border data policy scenarios with a multi-agent workflow aligned to UN ESCAP RDTII Pillar 6 logic.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Vercel-friendly structure

## Included

- `app/api/analyze/route.ts`: streaming analysis endpoint
- `lib/agents.ts`: Research, Policy Analysis, Comparison, and Report agents
- `lib/mock-data.ts`: Pillar 6-aligned mock country policy dataset
- `lib/pillar6-schema.ts`: canonical Pillar 6 evidence and indicator types
- `docs/agent-parameters.md`: ten-agent contract and human review gate baseline
- `components/analyst-dashboard.tsx`: hackathon demo UI

## Current implementation boundary

This repository is currently a hackathon-ready mock workflow, not a production legal research engine. It uses structured mock data and deterministic mock orchestration to prove the Pillar 6 evidence workflow before real source discovery, document parsing, or LLM-backed reasoning is connected.

The current boundary is intentional:

- **In scope:** UN ESCAP RDTII Pillar 6 cross-border data policy analysis, evidence review, citation traceability, law student review, and JSON / CSV / Markdown exports.
- **Out of scope for this version:** Pillar 7, generalized domestic privacy compliance, production persistence, full legal database ingestion, and fully automated no-review legal conclusions.
- **API-ready path:** the UI and `WorkflowResult` shape are designed so mock agent outputs can later be replaced by real API-backed agents without changing the review-facing modules.

## Ten-agent readiness

The app now exposes a ten-agent orchestration trace in the `/api/analyze` response through `agentTrace`. Each trace item records:

- `agentId` and display name
- input and output summary
- evidence IDs touched by the agent
- downstream agent
- `humanReviewGate` for law student review

The canonical order is:

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

Internal app and API fields use camelCase. Export adapters may transform fields for CSV or external JSON consumers, but TypeScript contracts, mock data, and future real-agent payloads should stay aligned with the camelCase app schema.

## Mainline agent orchestration

The five mainline agents are now wired into the mock workflow result through `mainlineAgentResults`:

1. `intentArbiter`: normalizes the user request, chooses single-jurisdiction or cross-jurisdiction mode, and confirms Pillar 6 scope.
2. `sourceDiscovery`: selects candidate legal sources from the Pillar 6 mock evidence set.
3. `documentReader`: converts candidate sources into citation-ready passages.
4. `indicatorMapping`: maps each passage to one canonical Pillar 6 indicator code.
5. `legalReasoner`: produces evidence-backed legal findings with conclusion IDs and evidence IDs.

These agents are deterministic mock implementations for the hackathon version, but their outputs follow the same contract shape expected from future API-backed agents.

The five supporting agents are exposed through `supportingAgentResults`. They read the completed mainline results, add review-oriented structure, and prepare export-ready outputs without changing the mainline execution logic.

## Demo narrative

The recommended demo story is a fintech market-entry review: a team wants to understand whether data can move from China to Singapore while staying inside Pillar 6 scope. The walkthrough is:

1. Generate a Search Profile JSON in Legal Search Workspace.
2. Explain the ten-agent trace from intent classification through export.
3. Open Evidence Audit View to compare legal source text with the AI claim and Pillar 6 mapping.
4. Let a law student approve, revise, or reject the evidence.
5. Export the reviewed evidence package as JSON, CSV, or Markdown.

Success for this demo means every conclusion remains tied to an evidence ID, source URL, citation, Pillar 6 indicator code, reviewer status, and reviewer note.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Agent readiness check

```bash
npm run validate:agents
```

```bash
npm run validate:mainline
```

## Source basis

- https://www.unescap.org/projects/rcdtra
- https://dtri.uneca.org/assets/data/publications/ESCAP-2025-MN-RDTII-2.1-guide-en.pdf
- https://www.unescap.org/kp/2025/regional-digital-trade-integration-index-rdtii-21-guide
