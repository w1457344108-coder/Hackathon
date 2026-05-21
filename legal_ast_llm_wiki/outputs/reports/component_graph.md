# AST + LLM Wiki Component Graph

Generated for the `legal_ast_llm_wiki` prototype.

This graph shows how the nine source documents move through the prototype pipeline and how an LLM can use the resulting Wiki to answer legal/policy questions with source traceability.

## Component Graph

```mermaid
flowchart TD
    A["Raw source documents<br/>raw/documents/<br/>9 legal / policy documents"] --> B["File Loader<br/>modules/file_loader.py"]
    B --> C["Extracted Plain Text<br/>processed/texts/"]
    C --> D["Text Cleaner<br/>modules/text_cleaner.py"]
    D --> E["Chunker<br/>modules/chunker.py"]
    E --> F["Document Chunks<br/>processed/chunks/document_chunks.json<br/>1769 chunks"]

    F --> G["AST-like Legal Parser<br/>modules/ast_parser.py<br/>rules + keywords + regex"]
    G --> H["AST Nodes<br/>processed/ast_nodes/ast_nodes.json<br/>1769 nodes"]
    H --> H1["AST Nodes by Document<br/>processed/ast_nodes/ast_nodes_by_doc/"]

    H --> I["Wiki Builder<br/>modules/wiki_builder.py"]
    I --> J["LLM Wiki<br/>wiki/index.md"]
    I --> J1["Source Pages<br/>wiki/sources/"]
    I --> J2["Law / Policy Domain Pages<br/>wiki/laws/"]
    I --> J3["Concept Pages<br/>wiki/concepts/"]
    I --> J4["Issue Pages<br/>wiki/issues/"]
    I --> J5["Structured Node Pages<br/>wiki/structured_nodes/"]
    I --> J6["Glossary Pages<br/>wiki/glossary/"]

    H --> K["Glossary Builder<br/>modules/glossary_builder.py"]
    K --> K1["Legal Terms<br/>outputs/csv/legal_terms.csv<br/>outputs/json/legal_terms.json"]
    K --> K2["Colloquial Mapping<br/>outputs/csv/colloquial_mapping.csv<br/>outputs/json/colloquial_mapping.json"]
    K --> K3["Synonym Table<br/>outputs/csv/synonym_table.csv<br/>outputs/json/synonym_table.json"]
    K --> J6

    J --> L["Retriever<br/>modules/retriever.py"]
    J1 --> L
    J2 --> L
    J3 --> L
    J4 --> L
    J5 --> L
    J6 --> L
    K1 --> L
    K2 --> L
    K3 --> L
    H --> L
    F --> L

    L --> M["Retrieval Validation<br/>outputs/json/retrieval_results.json<br/>outputs/csv/retrieval_results.csv"]
    M --> N["Evaluator<br/>modules/evaluator.py"]
    N --> O["Retrieval Report<br/>outputs/reports/retrieval_validation_report.md"]

    J --> P["LLM / Wiki-Using Agent"]
    K1 --> P
    K2 --> P
    H --> P
    L --> P
    P --> Q["Evidence-Based Answer Draft<br/>legal basis + application + source nodes + caveat"]

    H --> R["Final Report Generator<br/>modules/report_generator.py"]
    J --> R
    K1 --> R
    M --> R
    R --> S["Final Build Report<br/>outputs/reports/final_ast_llm_wiki_report.md<br/>outputs/reports/final_ast_llm_wiki_report.docx"]
```

## LLM Answering Flow

```mermaid
flowchart LR
    U["User legal / policy question"] --> V["Query interpretation<br/>terms, law name, article number, RDTII pillar"]
    V --> W["Search glossary and mappings<br/>legal_terms + colloquial_mapping + synonym_table"]
    W --> X["Search AST nodes<br/>subjects, actions, objects, obligations, conditions, consequences, evidence"]
    X --> Y["Search Wiki pages<br/>sources, concepts, issues, structured_nodes"]
    Y --> Z["Draft answer"]
    Z --> Z1["Legal basis from Wiki"]
    Z --> Z2["Application to facts"]
    Z --> Z3["RDTII mapping"]
    Z --> Z4["Source document + AST node references"]
    Z --> Z5["Caveat: pending review / not legal advice"]
```

## Component Roles

| Component | Role | Main Output |
| --- | --- | --- |
| Raw documents | Original legal/policy source files | `raw/documents/` |
| File loader | Reads PDF, DOCX, TXT, MD, HTML without modifying originals | `processed/texts/` |
| Text cleaner | Conservative legal-text cleanup | cleaned text |
| Chunker | Splits documents into source-aligned legal/policy chunks | `document_chunks.json/csv` |
| AST parser | Converts chunks into AST-like legal structure nodes | `ast_nodes.json/csv` |
| Wiki builder | Converts AST nodes into Markdown LLM Wiki pages | `wiki/` |
| Glossary builder | Builds professional terms, colloquial mappings, synonyms | `outputs/csv/`, `outputs/json/`, `wiki/glossary/` |
| Retriever | Tests whether questions can retrieve terms, AST nodes, Wiki pages, and evidence | `retrieval_results.json/csv` |
| Evaluator | Compares raw chunk retrieval against AST + Wiki retrieval | `retrieval_validation_report.md` |
| Report generator | Summarizes build feasibility and outputs | final report Markdown/DOCX |
| LLM / Agent | Uses Wiki and AST evidence to answer questions | evidence-based answer draft |

## Current Prototype Status

| Metric | Current Value |
| --- | ---: |
| Source documents | 9 |
| Text chunks | 1769 |
| AST-like nodes | 1769 |
| Wiki pages | 1848 |
| Legal terms | 5690 |
| Colloquial mappings | 116 |
| Retrieval test questions | 8 |

## Important Caveat

All generated AST nodes, Wiki pages, glossary entries, mappings, and retrieval results remain candidate outputs with `review_status = pending`. The Wiki can support research-style and project-demo answers, but it should not be treated as a reviewed legal advice system.
