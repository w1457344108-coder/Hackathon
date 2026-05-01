# Chat Style Home Design

## Goal

Reshape the current dashboard into a ChatGPT-like single-page interface for the cross-border data policy assistant.

## Scope

- Replace the current dashboard-first homepage with a conversation workspace.
- Keep the left side for current and historical conversations.
- Keep the main area mostly blank, with a centered legal-assistant prompt and a bottom composer.
- Add three core action buttons for the required AI answer categories:
  - Regulation Interpretation
  - Case Analysis
  - Forward-looking Advisory
- Remove the visible roadmap, report cards, indicator cards, evidence table, audit view, and export panel from the first screen.

## Interaction

- The page is a visual shell for the product direction.
- The three buttons set the active answer category and update the composer placeholder.
- The submit button appends a user message and a deterministic assistant placeholder response.
- The existing `/api/analyze` endpoint remains untouched for later integration.

## Visual Direction

Use a close ChatGPT web layout: neutral white and gray palette, fixed dark sidebar, restrained typography, large empty conversation area, and a rounded bottom input composer. The layout should prioritize clarity over decoration.

## Files

- Modify `app/page.tsx` to render the new workspace.
- Add `components/chat-legal-workspace.tsx` for the full UI.
- Simplify `app/globals.css` so the old blue dashboard background does not leak into the new interface.
