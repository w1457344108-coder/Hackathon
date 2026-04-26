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
- `components/analyst-dashboard.tsx`: hackathon demo UI

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Source basis

- https://www.unescap.org/projects/rcdtra
- https://dtri.uneca.org/assets/data/publications/ESCAP-2025-MN-RDTII-2.1-guide-en.pdf
- https://www.unescap.org/kp/2025/regional-digital-trade-integration-index-rdtii-21-guide
