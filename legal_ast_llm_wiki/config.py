import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent

RAW_DIR = PROJECT_ROOT / "raw"
RAW_DOCUMENTS_DIR = RAW_DIR / "documents"

PROCESSED_DIR = PROJECT_ROOT / "processed"
PROCESSED_TEXTS_DIR = PROCESSED_DIR / "texts"
PROCESSED_CHUNKS_DIR = PROCESSED_DIR / "chunks"
PROCESSED_AST_NODES_DIR = PROCESSED_DIR / "ast_nodes"
PROCESSED_AST_NODES_BY_DOC_DIR = PROCESSED_AST_NODES_DIR / "ast_nodes_by_doc"
PROCESSED_METADATA_DIR = PROCESSED_DIR / "metadata"

WIKI_DIR = PROJECT_ROOT / "wiki"
WIKI_SOURCES_DIR = WIKI_DIR / "sources"
WIKI_LAWS_DIR = WIKI_DIR / "laws"
WIKI_CONCEPTS_DIR = WIKI_DIR / "concepts"
WIKI_ISSUES_DIR = WIKI_DIR / "issues"
WIKI_GLOSSARY_DIR = WIKI_DIR / "glossary"
WIKI_STRUCTURED_NODES_DIR = WIKI_DIR / "structured_nodes"

OUTPUTS_DIR = PROJECT_ROOT / "outputs"
OUTPUT_REPORTS_DIR = OUTPUTS_DIR / "reports"
OUTPUT_CSV_DIR = OUTPUTS_DIR / "csv"
OUTPUT_JSON_DIR = OUTPUTS_DIR / "json"

SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt",
    ".md",
    ".html",
    ".htm",
    ".csv",
    ".json",
}

CHUNK_SIZE = int(os.getenv("LEGAL_AST_CHUNK_SIZE", "1200"))
CHUNK_OVERLAP = int(os.getenv("LEGAL_AST_CHUNK_OVERLAP", "100"))
TOP_K = int(os.getenv("LEGAL_AST_TOP_K", "5"))

USE_LLM = os.getenv("USE_LLM", "false").strip().lower() in {"1", "true", "yes", "y"}
LLM_PROVIDER = os.getenv("LEGAL_AST_LLM_PROVIDER", "openai").strip().lower()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")

DEFAULT_REVIEW_STATUS = "pending"

PIPELINE_DIRS = [
    RAW_DOCUMENTS_DIR,
    PROCESSED_TEXTS_DIR,
    PROCESSED_CHUNKS_DIR,
    PROCESSED_AST_NODES_DIR,
    PROCESSED_AST_NODES_BY_DOC_DIR,
    PROCESSED_METADATA_DIR,
    WIKI_SOURCES_DIR,
    WIKI_LAWS_DIR,
    WIKI_CONCEPTS_DIR,
    WIKI_ISSUES_DIR,
    WIKI_GLOSSARY_DIR,
    WIKI_STRUCTURED_NODES_DIR,
    OUTPUT_REPORTS_DIR,
    OUTPUT_CSV_DIR,
    OUTPUT_JSON_DIR,
]
