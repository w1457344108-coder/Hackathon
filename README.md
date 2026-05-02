# Cross-Border Data Policy Multi-Agent Analyst

Submission-ready UN AI Hackathon prototype for analyzing **UN ESCAP RDTII Pillar 6: Cross-border Data Policies**. The system now supports a real backend workflow with:

- streaming `/api/analyze`
- provider adapter architecture
- competition-designated RDTII-source evidence ingestion
- structured legal evidence records
- local PDF / DOCX upload parsing for user-provided context
- multi-agent analysis outputs
- audit review persistence
- JSON / CSV / Markdown export

The UI contract from the original demo is preserved, and the original mock data remains available as fallback where live source coverage is still incomplete.

## What Is Real Now

- **Model provider adapter:** implemented in [lib/server/provider-adapter.ts](lib/server/provider-adapter.ts:1)
- **Live provider support:** DeepSeek Chat Completions API via `DEEPSEEK_API_KEY`, or OpenAI Responses API via `OPENAI_API_KEY`
- **Real source pipeline:** competition-designated UN ESCAP RCDTRA and RDTII 2.1 sources plus live fetch / excerpt extraction in [lib/server/source-pipeline.ts](lib/server/source-pipeline.ts:1)
- **Uploaded document context:** chat uploads support up to three PDF / DOCX files, 20MB each, parsed through [lib/server/uploaded-documents.ts](lib/server/uploaded-documents.ts:1)
- **Review persistence:** filesystem-backed run store in [lib/server/run-store.ts](lib/server/run-store.ts:1)
- **Review APIs:** [app/api/reviews/route.ts](app/api/reviews/route.ts:1) and [app/api/runs/[runId]/route.ts](app/api/runs/[runId]/route.ts:1)
- **Smoke tests:** `tests/source-pipeline-smoke.test.ts` and `tests/run-store-smoke.test.ts`

## What Is Still Fallback / Planned

- **Country policy profiles and scorecards:** still come from the existing structured mock profile layer in [lib/mock-data.ts](lib/mock-data.ts:1)
- **Source coverage:** current competition-designated live-source coverage is strongest for China, Singapore, and the European Union
- **Other jurisdictions:** fall back to existing mock evidence records rather than failing the workflow
- **Persistence backend:** current implementation uses the local filesystem run store for prototype durability; swap the adapter for a hosted database or object store before production deployment
- **Additional providers:** DeepSeek and OpenAI are wired; the adapter layer can still expand to other model providers

## Current implementation boundary

- Real backend analysis, real provider adapter, competition-designated RDTII source retrieval, review persistence, and export are implemented now.
- Country policy profiles, broader jurisdiction coverage, and production-grade storage still rely on fallback or planned layers.
- The app surfaces hybrid behavior explicitly through `providerId` and `evidenceSourceMode` instead of pretending every run is fully live.

## Architecture

### Main entry points

- [app/api/analyze/route.ts](app/api/analyze/route.ts:1): streaming analysis API and run persistence
- [lib/agents.ts](lib/agents.ts:1): multi-agent orchestration, real-evidence integration, and export packaging
- [components/chat-legal-workspace.tsx](components/chat-legal-workspace.tsx:1): active chat-style frontend
- [components/analyst-dashboard.tsx](components/analyst-dashboard.tsx:1): retained analyst dashboard and review UI components
- [components/audit-view.tsx](components/audit-view.tsx:1): reviewer workflow with backend save

### Adapter layer

- [lib/server/provider-adapter.ts](lib/server/provider-adapter.ts:1)
- [lib/server/source-registry.ts](lib/server/source-registry.ts:1)
- [lib/server/source-pipeline.ts](lib/server/source-pipeline.ts:1)
- [lib/server/run-store.ts](lib/server/run-store.ts:1)

### Current evidence strategy

1. Resolve requested jurisdictions.
2. Load competition-designated RDTII sources where coverage exists.
3. Fetch live HTML text when possible and extract a Pillar 6 excerpt.
4. Fall back to curated excerpt text if live retrieval is partial.
5. Fall back to legacy mock evidence only for uncovered jurisdictions.

## Mainline agent orchestration

The mainline path keeps the existing contract and order:

1. `intent-arbiter`
2. `source-discovery`
3. `document-reader`
4. `indicator-mapping`
5. `legal-reasoner`

The first, second, and fourth steps remain mostly deterministic for stability. The `document-reader` and `legal-reasoner` steps now support live provider-backed structured reasoning with mock fallback.

## Ten-agent readiness

- All ten workflow agents still execute in the original orchestration order expected by the UI and validator scripts.
- Supporting agents now consume the resolved evidence set from the real-or-hybrid source pipeline instead of reading only global mock arrays.
- Audit, export, and human review gates are still present in the final trace and export objects.

## Current Stack

From `package.json`:

- Next.js `16.2.4`
- React `19.2.5`
- React DOM `19.2.5`
- TypeScript `5.8.3`
- Tailwind CSS `3.4.19`

## Environment Variables

### Optional for live model analysis with DeepSeek

```bash
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-v4-pro
ANALYSIS_PROVIDER=deepseek
```

The DeepSeek adapter calls `https://api.deepseek.com/chat/completions` by default and requests structured JSON output from the configured model.

### Optional for live model analysis with OpenAI

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.2
ANALYSIS_PROVIDER=openai
```

### Optional overrides

```bash
DEEPSEEK_BASE_URL=https://api.deepseek.com
OPENAI_BASE_URL=https://api.openai.com/v1
ANALYSIS_PROVIDER=mock
```

If no live provider API key is configured, the workflow still runs with structured mock fallback reasoning instead of pretending a live model is active.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

### Type check

```bash
npm run lint
```

### Smoke tests

```bash
npm run test:smoke
```

### Existing validator scripts

```bash
npm run validate:agents
npm run validate:mainline
```

### Production build

```bash
npm run build
```

On this workstation, `npm run build` uses a small wrapper script in [scripts/run-next-build.mjs](scripts/run-next-build.mjs:1) to force Next.js onto the packaged WASM SWC fallback because the local native SWC binary fails code-signature loading. That workaround is for local build reliability only.

## Demo Flow

1. Select one or two jurisdictions.
2. Set a business scenario and analysis question.
3. Run the multi-agent analysis.
4. Inspect real or hybrid evidence records in the evidence queue.
5. Open the audit view and save reviewer status / notes.
6. Export the reviewed package as JSON, CSV, or Markdown.

## Demo narrative

The original hackathon demo narrative is still available in the workflow output because the front end already knows how to render it. It now sits alongside real run metadata, persisted review state, and real-or-hybrid evidence resolution so the prototype can stay presentation-friendly without hiding where fallback behavior is still used.

## Current Real Source Coverage

- Primary competition-designated portal:
  - UN ESCAP RCDTRA project page / RDTII 2.1 Regulatory Database entry surface: [https://www.unescap.org/projects/rcdtra](https://www.unescap.org/projects/rcdtra)
- Competition-designated methodology source:
  - RDTII 2.1 guide PDF: [https://dtri.uneca.org/assets/data/publications/ESCAP-2025-MN-RDTII-2.1-guide-en.pdf](https://dtri.uneca.org/assets/data/publications/ESCAP-2025-MN-RDTII-2.1-guide-en.pdf)
- Current jurisdiction coverage wired against that source set:
  - China
  - Singapore
  - European Union

## Submission Notes

- The system is **not** a production legal research engine.
- It **does** implement a real backend analysis path, a real provider adapter, a competition-designated RDTII-source pipeline, structured evidence outputs, and persisted reviewer workflow.
- Where live coverage is incomplete, the app clearly falls back to the legacy mock layer instead of overstating functionality.

