# AST + LLM Wiki Legal Knowledge Base Prototype

This project is a local prototype for turning a small set of legal, policy, and digital governance documents into a review-first knowledge base.

The first milestone only establishes the project structure and operating rules. It does not parse, clean, chunk, summarize, or interpret any source document.

## Goals

- Load source documents from `raw/documents/` in later stages without modifying the originals.
- Extract readable text into `processed/texts/`.
- Clean and split text into auditable chunks in `processed/chunks/`.
- Build legal/policy AST-like JSON nodes in `processed/ast_nodes/`.
- Organize reviewed and pending knowledge into Markdown Wiki pages under `wiki/`.
- Generate glossary, retrieval, evaluation, and validation outputs under `outputs/`.

In this project, AST means an AST-like legal and policy structure tree. It is not a programming-language abstract syntax tree.

## Directory Guide

```text
legal_ast_llm_wiki/
├── raw/documents/              # Original source documents. Do not edit generated or copied originals here.
├── processed/texts/            # Extracted plain text from source files.
├── processed/chunks/           # Chunked text units with source metadata.
├── processed/ast_nodes/        # AST-like legal/policy JSON nodes.
├── processed/metadata/         # Manifests, source maps, processing logs, and run metadata.
├── wiki/                       # Markdown LLM Wiki.
├── wiki/sources/               # Source-document pages.
├── wiki/laws/                  # Law or policy pages.
├── wiki/concepts/              # Concept pages.
├── wiki/issues/                # User issue or question pages.
├── wiki/glossary/              # Legal and policy term pages.
├── wiki/structured_nodes/      # Markdown views of AST JSON nodes.
├── outputs/reports/            # Human-readable reports.
├── outputs/csv/                # CSV exports.
├── outputs/json/               # JSON exports.
└── modules/                    # Pipeline modules.
```

## Prepare Source Documents

Put the 9 original documents into:

```text
C:\Users\Rakan\Desktop\hks\legal_ast_llm_wiki\raw\documents\
```

Supported formats for the text conversion step:

- `.pdf`
- `.docx`
- `.txt`
- `.md`
- `.html`
- `.htm`

The pipeline reads these files only. It does not edit, rename, move, or delete originals.

## Run Text Conversion

Create a Python environment and install dependencies:

```powershell
cd C:\Users\Rakan\Desktop\hks\legal_ast_llm_wiki
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Run the current scaffold:

```powershell
python main.py
```

The current `main.py` scans `raw/documents/`, extracts text when needed, applies conservative cleaning, writes one `.txt` file per readable source, records metadata, and then creates source-aligned chunks.

If `processed/texts/` and `processed/metadata/documents_metadata.json` already exist, `main.py` reuses them and skips text extraction to avoid overwriting converted text files. Files that cannot be read are written to metadata with `read_status = "failed"` and do not stop the run.

## Text Conversion Outputs

Converted text files:

```text
processed/texts/{doc_id}.txt
```

Metadata:

```text
processed/metadata/documents_metadata.csv
processed/metadata/documents_metadata.json
```

Metadata fields include:

- `doc_id`
- `original_filename`
- `file_type`
- `text_file_path`
- `character_count`
- `word_count`
- `read_status`
- `error_message`
- `created_at`

Later stages will fill in chunking, AST parsing, Wiki generation, glossary building, retrieval, and evaluation.

## Chunking Outputs

Chunk files:

```text
processed/chunks/document_chunks.csv
processed/chunks/document_chunks.json
```

Each chunk includes:

- `chunk_id`
- `doc_id`
- `source_file`
- `chunk_index`
- `heading_guess`
- `chunk_text`
- `start_char`
- `end_char`
- `char_count`
- `possible_legal_section`
- `created_at`

The chunker first looks for legal and policy structure such as titles, parts, chapters, sections, articles, Chinese `第...条` markers, paragraphs, and numbered lists. If structure is not clear, it falls back to fixed-length chunking. The default overlap is configured in `config.py`.

Quality report:

```text
outputs/reports/chunking_quality_report.md
```

If existing chunk outputs or the quality report already exist, they are backed up with a timestamp before new files are written.

Later stages will fill in AST parsing, Wiki generation, glossary building, retrieval, and evaluation.

## AST-Like Legal Structure Parsing

After chunking, run:

```powershell
python main.py
```

The AST parser reads:

```text
processed/chunks/document_chunks.csv
```

It writes:

```text
processed/ast_nodes/ast_nodes.json
processed/ast_nodes/ast_nodes.csv
processed/ast_nodes/ast_nodes_by_doc/{doc_id}.json
outputs/reports/ast_parsing_report.md
```

Each AST-like node contains source traceability fields (`doc_id`, `chunk_id`, `source_file`, `original_text`, `source_evidence`) plus rule-based extraction fields for jurisdiction, document type, legal domain, subjects, actions, objects, conditions, obligations, rights, prohibitions, consequences, exceptions, definitions, professional terms, related terms, user question hints, confidence, review status, and notes.

Current parsing mode is a local prototype based on keywords and regular expressions. It does not provide authoritative legal interpretation. `USE_LLM=True` is reserved for future LLM-assisted parsing, and API keys must come from environment variables rather than source code.

All generated nodes use:

```text
review_status = pending
```

## LLM Wiki Build

After AST nodes exist, run:

```powershell
python main.py
```

The Wiki builder reads:

```text
processed/ast_nodes/ast_nodes.json
```

It writes Markdown pages under:

```text
wiki/
```

Generated Wiki areas:

- `wiki/sources/` source-document pages
- `wiki/laws/` legal or policy domain pages
- `wiki/concepts/` concept pages
- `wiki/issues/` issue pages
- `wiki/glossary/legal_terms.md`
- `wiki/glossary/colloquial_mapping.md`
- `wiki/glossary/synonym_table.md`
- `wiki/structured_nodes/` one page per AST node
- `wiki/index.md`
- `wiki/log.md`

Build report:

```text
outputs/reports/wiki_build_report.md
```

All generated Wiki pages keep source document links, source node links, and `review_status: pending`.

## Open in Obsidian

1. Open Obsidian.
2. Choose **Open folder as vault**.
3. Select:

```text
C:\Users\Rakan\Desktop\hks\legal_ast_llm_wiki\wiki
```

4. Start from `index.md`.

The Wiki uses Obsidian-style internal links such as `[[sources/...]]`, `[[concepts/...]]`, and `[[structured_nodes/...]]`.

## Professional Glossary Build

After AST nodes and Wiki pages exist, run:

```powershell
python main.py
```

The glossary builder reads:

```text
processed/ast_nodes/ast_nodes.json
wiki/
```

It writes structured vocabulary outputs:

```text
outputs/csv/legal_terms.csv
outputs/csv/legal_terms.xlsx
outputs/json/legal_terms.json
outputs/csv/colloquial_mapping.csv
outputs/json/colloquial_mapping.json
outputs/csv/synonym_table.csv
outputs/json/synonym_table.json
```

It also updates:

```text
wiki/glossary/legal_terms.md
wiki/glossary/colloquial_mapping.md
wiki/glossary/synonym_table.md
wiki/index.md
wiki/log.md
outputs/reports/glossary_build_report.md
```

All glossary entries are candidate terms with source node/document traceability and `review_status = pending`.

## Retrieval Validation

After glossary and Wiki outputs exist, run:

```powershell
python main.py
```

The retrieval validator runs eight preset English questions, including questions about personal data, overseas transfer, consent, organisational obligations, breach consequences, electronic transactions, cybersecurity, and digital governance.

It compares two retrieval modes:

- A: raw text chunk retrieval only.
- B: professional glossary + AST nodes + LLM Wiki retrieval.

The current implementation is local and lightweight. It uses TF-IDF similarity, keyword overlap, professional-term matching, AST field weighting, Wiki title/tag matching, and original chunk similarity. It does not require an external embedding model or LLM API.

Outputs:

```text
outputs/csv/retrieval_results.csv
outputs/json/retrieval_results.json
outputs/reports/retrieval_validation_report.md
```

Each result keeps mapped terms, matched legal terms, matched AST node IDs, matched Wiki pages, source document IDs, and source evidence. Results are candidate retrieval evidence only and are not legal advice.

## Final Build Report

After retrieval validation exists, run:

```powershell
python main.py
```

The final report generator reads the existing pipeline outputs and writes:

```text
outputs/reports/final_ast_llm_wiki_report.md
outputs/reports/final_ast_llm_wiki_report.docx
```

The report is written in Chinese for project presentation or technical review. It summarizes the project background, goals, source data, document processing status, architecture, AST-like node design, LLM Wiki structure, glossary and colloquial mapping methods, retrieval validation method, retrieval results, comparison with ordinary full-text search, advantages, limitations, next steps, and conclusion.

The report explicitly treats all generated AST nodes, Wiki pages, glossary entries, mappings, and retrieval results as candidate outputs requiring human review.

## Safety Rules

- Do not modify original source documents.
- Store Wiki pages as Markdown.
- Store AST nodes as JSON.
- Mark generated AST nodes, Wiki pages, glossary entries, mappings, and reports with `review_status = "pending"` until a human reviewer updates them.
- Do not invent legal conclusions that are not supported by source evidence.
- If LLM support is added, API keys must be read from environment variables.
