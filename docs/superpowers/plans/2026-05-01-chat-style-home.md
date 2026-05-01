# Chat Style Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a ChatGPT-like homepage with a conversation sidebar, blank chat canvas, bottom composer, and three legal task buttons.

**Architecture:** Add one focused client component that owns the homepage chat-shell state. Keep existing analyst dashboard modules in place but stop rendering them from the homepage.

**Tech Stack:** Next.js App Router, React client component, TypeScript, Tailwind CSS.

---

### Task 1: Add Chat Workspace Component

**Files:**
- Create: `components/chat-legal-workspace.tsx`

- [ ] Build a client component with local state for messages, active mode, current input, and selected conversation.
- [ ] Render a fixed-width left sidebar with current conversation and historical conversations.
- [ ] Render a main blank conversation area.
- [ ] Render three buttons for Regulation Interpretation, Case Analysis, and Forward-looking Advisory below the composer.
- [ ] Add submit behavior that appends a user message and a short assistant placeholder response.

### Task 2: Replace Homepage Entry

**Files:**
- Modify: `app/page.tsx`

- [ ] Replace `AnalystDashboard` import with `ChatLegalWorkspace`.
- [ ] Return `<ChatLegalWorkspace />` from `HomePage`.

### Task 3: Simplify Global Shell Styling

**Files:**
- Modify: `app/globals.css`

- [ ] Remove the old blue gradient dashboard background and grid overlay.
- [ ] Keep Tailwind directives and basic global box sizing.
- [ ] Set the body to a neutral ChatGPT-like background and font stack.

### Task 4: Verify

**Commands:**
- Run `npm run build`.
- Inspect `http://localhost:3000/` in the browser after the dev server refreshes.
