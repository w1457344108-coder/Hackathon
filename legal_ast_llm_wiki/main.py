from config import PIPELINE_DIRS, PROCESSED_CHUNKS_DIR, PROCESSED_METADATA_DIR, PROCESSED_TEXTS_DIR, PROJECT_ROOT, RAW_DOCUMENTS_DIR, USE_LLM
from modules.ast_parser import parse_chunks_to_ast
from modules.chunker import process_text_chunks
from modules.file_loader import process_documents
from modules.glossary_builder import build_glossary
from modules.report_generator import generate_final_report
from modules.retriever import run_retrieval_validation
from modules.wiki_builder import build_wiki


PIPELINE_STAGES = [
    "load source documents",
    "extract text",
    "clean text",
    "chunk text",
    "build AST-like legal/policy nodes",
    "build Markdown LLM Wiki",
    "build glossary and colloquial mappings",
    "run retrieval and evaluation reports",
    "generate final prototype report",
]


def ensure_directories() -> None:
    for directory in PIPELINE_DIRS:
        directory.mkdir(parents=True, exist_ok=True)


def has_existing_text_conversion() -> bool:
    metadata_path = PROCESSED_METADATA_DIR / "documents_metadata.json"
    text_files = [path for path in PROCESSED_TEXTS_DIR.glob("*.txt") if path.is_file()]
    return metadata_path.exists() and bool(text_files)


def has_existing_chunks() -> bool:
    chunks_path = PROCESSED_CHUNKS_DIR / "document_chunks.csv"
    return chunks_path.exists() and chunks_path.stat().st_size > 0


def main() -> None:
    ensure_directories()

    print("AST + LLM Wiki legal knowledge base pipeline")
    print(f"Project root: {PROJECT_ROOT}")
    print(f"Raw documents directory: {RAW_DOCUMENTS_DIR}")
    print(f"LLM enabled: {USE_LLM}")
    print()
    print("Current step: document reading, text conversion, chunking, AST parsing, Wiki build, glossary build, retrieval validation, and final report")
    print()

    if has_existing_text_conversion():
        print("Existing text conversion outputs found; skipping document reading to avoid overwriting processed/texts/.")
        metadata = []
    else:
        metadata = process_documents()

    if has_existing_chunks():
        print("Existing chunk outputs found; skipping chunking to avoid overwriting processed/chunks/.")
        chunks = []
    else:
        chunks = process_text_chunks()

    ast_nodes = parse_chunks_to_ast(use_llm=USE_LLM)
    wiki_page_counts = build_wiki()
    glossary_counts = build_glossary()
    retrieval_counts = run_retrieval_validation()
    final_report = generate_final_report()

    print()
    print("Pipeline stage status:")
    print(f"1. {PIPELINE_STAGES[0]}: complete")
    print(f"2. {PIPELINE_STAGES[1]}: complete")
    print(f"3. {PIPELINE_STAGES[2]}: complete")
    print(f"4. {PIPELINE_STAGES[3]}: complete")
    print(f"5. {PIPELINE_STAGES[4]}: complete")
    print(f"6. {PIPELINE_STAGES[5]}: complete")
    print(f"7. {PIPELINE_STAGES[6]}: complete")
    print(f"8. {PIPELINE_STAGES[7]}: complete")
    print(f"9. {PIPELINE_STAGES[8]}: complete")
    print()
    print(f"Documents processed in this run: {len(metadata)}")
    print(f"Chunks generated: {len(chunks)}")
    print(f"AST nodes generated: {len(ast_nodes)}")
    print(f"Wiki pages generated: {sum(wiki_page_counts.values())}")
    print(
        "Glossary records generated: "
        f"legal_terms={glossary_counts['legal_terms']}, "
        f"colloquial_mappings={glossary_counts['colloquial_mappings']}, "
        f"synonyms={glossary_counts['synonyms']}"
    )
    print(
        "Retrieval validation generated: "
        f"queries={retrieval_counts['queries']}, "
        f"results={retrieval_counts['results']}"
    )
    print(f"Final Markdown report: {final_report['markdown_path']}")
    print(f"Final DOCX report: {final_report['docx_path']}")
    print("Raw documents were read only and were not modified.")


if __name__ == "__main__":
    main()
