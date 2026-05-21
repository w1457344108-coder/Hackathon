# Agent Rules for AST + LLM Wiki Maintenance

These rules apply to Codex, LLM agents, scripts, and human maintainers working inside `legal_ast_llm_wiki/`.

## Non-Negotiable Rules

1. Do not modify files in `raw/documents/`.
2. Do not invent legal conclusions, obligations, exceptions, penalties, rights, or definitions that are not grounded in source evidence.
3. Every generated AST node must preserve source links through document id, chunk id, and evidence text or span metadata.
4. Every generated Wiki page must link back to source documents and AST node ids.
5. Every generated item must default to `review_status = "pending"`.
6. LLM Wiki pages are for knowledge storage and organization. They are not final legal advice.
7. External LLM APIs are optional. If used, API keys must come from environment variables and must never be written into the repository.
8. Prefer deterministic local parsing, keyword rules, regular expressions, and TF-IDF style retrieval when no LLM is configured.
9. Keep modules small and focused so the pipeline can later be expanded into an Agent workflow.
10. When unsure, preserve evidence and mark uncertainty instead of over-interpreting the document.

## Required AST Node Fields

AST-like legal or policy nodes should include:

- `id`
- `source_document_id`
- `source_chunk_id`
- `source_span`
- `legal_subjects`
- `legal_actions`
- `legal_objects`
- `conditions`
- `obligations`
- `rights`
- `prohibitions`
- `consequences`
- `exceptions`
- `definitions`
- `terms`
- `possible_user_questions`
- `evidence`
- `review_status`

## Wiki Page Rules

- Use Markdown.
- Keep source citations close to claims.
- Link to related AST node ids.
- Separate source summaries from generated interpretations.
- Use `review_status: pending` in front matter for generated pages.
- Do not remove traceability fields when editing pages.

## Output Rules

- JSON outputs belong in `outputs/json/`.
- CSV outputs belong in `outputs/csv/`.
- Human-readable reports belong in `outputs/reports/`.
- Intermediate extracted text, chunks, AST nodes, and metadata belong in `processed/`.
