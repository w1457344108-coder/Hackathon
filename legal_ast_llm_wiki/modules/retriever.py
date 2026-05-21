"""Local retrieval helpers for chunks, glossary entries, AST nodes, and Wiki pages."""

from __future__ import annotations

import csv
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from config import (
    OUTPUT_CSV_DIR,
    OUTPUT_JSON_DIR,
    OUTPUT_REPORTS_DIR,
    PROCESSED_AST_NODES_DIR,
    PROCESSED_CHUNKS_DIR,
    TOP_K,
    WIKI_DIR,
)
from modules.chunker import backup_existing_file


PRESET_RETRIEVAL_QUERIES = [
    "What counts as personal data in Singapore?",
    "Can a company transfer personal data overseas?",
    "Does an organisation need consent before using personal data?",
    "What are the obligations of organisations under Singapore data protection rules?",
    "What happens if a company breaches data protection obligations?",
    "What are the rules for electronic transactions?",
    "What cybersecurity obligations are mentioned in the documents?",
    "How is digital governance described in these documents?",
]

STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "before",
    "can",
    "does",
    "for",
    "happens",
    "how",
    "if",
    "in",
    "is",
    "mentioned",
    "my",
    "of",
    "the",
    "these",
    "to",
    "under",
    "what",
    "when",
}

AST_RETRIEVAL_FIELDS = [
    "jurisdiction",
    "document_type",
    "legal_domain",
    "legal_subjects",
    "legal_actions",
    "legal_objects",
    "conditions",
    "obligations",
    "rights",
    "prohibitions",
    "legal_consequences",
    "exceptions",
    "definitions",
    "professional_terms",
    "related_terms",
    "possible_user_questions",
    "source_evidence",
]


def load_json(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    return data if isinstance(data, list) else []


def parse_jsonish_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, (tuple, set)):
        return [str(item).strip() for item in value if str(item).strip()]
    text = str(value).strip()
    if not text:
        return []
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        return [text]
    if isinstance(parsed, list):
        return [str(item).strip() for item in parsed if str(item).strip()]
    return [text]


def unique_preserve(items: Iterable[str], limit: int | None = None) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for item in items:
        text = re.sub(r"\s+", " ", str(item)).strip()
        key = text.lower()
        if not text or key in seen:
            continue
        seen.add(key)
        output.append(text)
        if limit is not None and len(output) >= limit:
            break
    return output


def tokenize_query(text: str) -> list[str]:
    tokens = re.findall(r"[a-zA-Z0-9][a-zA-Z0-9\-']*", str(text).lower())
    return [token for token in tokens if len(token) > 1 and token not in STOPWORDS]


def keyword_overlap_score(query: str, text: str) -> float:
    query_tokens = set(tokenize_query(query))
    if not query_tokens:
        return 0.0
    text_tokens = set(tokenize_query(text))
    if not text_tokens:
        return 0.0
    return len(query_tokens & text_tokens) / len(query_tokens)


def phrase_hit_score(terms: Iterable[str], text: str) -> float:
    term_list = [term.lower() for term in terms if str(term).strip()]
    if not term_list:
        return 0.0
    haystack = str(text).lower()
    hits = sum(1 for term in term_list if term in haystack)
    return min(1.0, hits / max(1, min(len(term_list), 4)))


def tfidf_query_scores(query: str, corpus: list[str]) -> list[float]:
    if not corpus:
        return []
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), max_features=12000)
        matrix = vectorizer.fit_transform([query] + corpus)
        scores = cosine_similarity(matrix[0:1], matrix[1:]).flatten()
        return [float(score) for score in scores]
    except Exception:
        return [keyword_overlap_score(query, text) for text in corpus]


def compact_text(value: Any, limit: int = 260) -> str:
    text = re.sub(r"\s+", " ", str(value)).strip()
    if len(text) <= limit:
        return text
    return text[:limit].rstrip() + "..."


def record_text(record: dict[str, Any], fields: Iterable[str]) -> str:
    parts: list[str] = []
    for field in fields:
        value = record.get(field, "")
        if isinstance(value, (list, tuple, set)):
            parts.extend(str(item) for item in value)
        else:
            parts.extend(parse_jsonish_list(value))
    return " ".join(parts)


def load_wiki_pages(wiki_dir: Path = WIKI_DIR) -> list[dict[str, Any]]:
    pages: list[dict[str, Any]] = []
    if not wiki_dir.exists():
        return pages

    for path in sorted(wiki_dir.rglob("*.md")):
        if ".bak" in path.name or "_backups" in path.parts:
            continue
        text = path.read_text(encoding="utf-8-sig", errors="ignore")
        relative = path.relative_to(wiki_dir).with_suffix("").as_posix()
        title_match = re.search(r"^#\s+(.+)$", text, flags=re.MULTILINE)
        title = title_match.group(1).strip() if title_match else path.stem.replace("_", " ")
        frontmatter_text = ""
        tags: list[str] = []
        if text.startswith("---"):
            end = text.find("\n---", 3)
            if end != -1:
                frontmatter_text = text[3:end]
                tags = [match.group(1).strip() for match in re.finditer(r"^\s*-\s+(.+)$", frontmatter_text, re.M)]
        pages.append(
            {
                "page_id": relative,
                "title": title,
                "path": str(path),
                "tags": tags,
                "frontmatter": frontmatter_text,
                "text": text[:8000],
            }
        )
    return pages


def map_query_terms(
    query: str,
    colloquial_mappings: list[dict[str, Any]],
    legal_terms: list[dict[str, Any]],
    top_k: int = 5,
) -> tuple[list[str], list[dict[str, Any]]]:
    mapping_corpus = [
        " ".join(
            [
                str(record.get("colloquial_expression", "")),
                " ".join(parse_jsonish_list(record.get("mapped_standard_terms", []))),
                str(record.get("mapped_issue", "")),
                str(record.get("mapped_domain", "")),
            ]
        )
        for record in colloquial_mappings
    ]
    mapping_tfidf = tfidf_query_scores(query, mapping_corpus)
    scored_mappings: list[tuple[float, dict[str, Any]]] = []
    for index, record in enumerate(colloquial_mappings):
        text = mapping_corpus[index] if index < len(mapping_corpus) else ""
        score = 0.65 * (mapping_tfidf[index] if index < len(mapping_tfidf) else 0.0)
        score += 0.35 * keyword_overlap_score(query, text)
        if score > 0:
            item = dict(record)
            item["score"] = round(score, 4)
            scored_mappings.append((score, item))

    scored_mappings.sort(key=lambda item: item[0], reverse=True)
    matched_mappings = [record for _, record in scored_mappings[:top_k]]

    mapped_terms: list[str] = []
    for record in matched_mappings:
        mapped_terms.extend(parse_jsonish_list(record.get("mapped_standard_terms", [])))
        mapped_terms.append(str(record.get("mapped_issue", "")).replace("_", " "))
        mapped_terms.append(str(record.get("mapped_domain", "")))

    query_lower = query.lower()
    for term in legal_terms:
        standard = str(term.get("standard_term", "")).strip()
        synonyms = parse_jsonish_list(term.get("synonyms", []))
        candidates = [standard] + synonyms
        if standard and any(candidate.lower() in query_lower for candidate in candidates if candidate):
            mapped_terms.append(standard)

    return unique_preserve(mapped_terms, limit=20), matched_mappings


def retrieve_legal_terms(
    query: str,
    mapped_terms: list[str],
    legal_terms: list[dict[str, Any]],
    top_k: int = 10,
) -> list[dict[str, Any]]:
    corpus = [
        " ".join(
            [
                str(record.get("standard_term", "")),
                str(record.get("category", "")),
                str(record.get("related_domain", "")),
                str(record.get("related_issue", "")),
                " ".join(parse_jsonish_list(record.get("synonyms", []))),
                " ".join(parse_jsonish_list(record.get("colloquial_expressions", []))),
                " ".join(parse_jsonish_list(record.get("source_text", [])))[:1200],
            ]
        )
        for record in legal_terms
    ]
    tfidf_scores = tfidf_query_scores(" ".join([query] + mapped_terms), corpus)
    results: list[dict[str, Any]] = []
    for index, record in enumerate(legal_terms):
        text = corpus[index]
        score = 0.55 * (tfidf_scores[index] if index < len(tfidf_scores) else 0.0)
        score += 0.25 * keyword_overlap_score(query, text)
        score += 0.20 * phrase_hit_score(mapped_terms, text)
        if score <= 0:
            continue
        results.append(
            {
                "term_id": record.get("term_id", ""),
                "standard_term": record.get("standard_term", ""),
                "category": record.get("category", ""),
                "related_domain": record.get("related_domain", ""),
                "related_issue": record.get("related_issue", ""),
                "source_node_ids": parse_jsonish_list(record.get("source_node_ids", []))[:8],
                "source_doc_ids": parse_jsonish_list(record.get("source_doc_ids", []))[:8],
                "confidence": record.get("confidence", "low"),
                "score": round(float(score), 4),
            }
        )
    return sorted(results, key=lambda item: item["score"], reverse=True)[:top_k]


def retrieve_ast_nodes(
    query: str,
    mapped_terms: list[str],
    ast_nodes: list[dict[str, Any]],
    top_k: int = 10,
) -> list[dict[str, Any]]:
    structured_texts = [record_text(node, AST_RETRIEVAL_FIELDS) for node in ast_nodes]
    original_texts = [str(node.get("original_text", ""))[:3000] for node in ast_nodes]
    tfidf_scores = tfidf_query_scores(" ".join([query] + mapped_terms), structured_texts)
    original_scores = tfidf_query_scores(query, original_texts)

    results: list[dict[str, Any]] = []
    for index, node in enumerate(ast_nodes):
        structured_text = structured_texts[index]
        professional_text = record_text(node, ["professional_terms", "related_terms", "definitions", "legal_domain"])
        source_text = " ".join(parse_jsonish_list(node.get("source_evidence", []))) or str(node.get("original_text", ""))
        score = 0.30 * (tfidf_scores[index] if index < len(tfidf_scores) else 0.0)
        score += 0.30 * keyword_overlap_score(query, structured_text)
        score += 0.30 * phrase_hit_score(mapped_terms, professional_text + " " + structured_text)
        score += 0.10 * (original_scores[index] if index < len(original_scores) else 0.0)
        if score <= 0:
            continue
        results.append(
            {
                "node_id": node.get("node_id", ""),
                "doc_id": node.get("doc_id", ""),
                "chunk_id": node.get("chunk_id", ""),
                "source_file": node.get("source_file", ""),
                "legal_domain": node.get("legal_domain", "unknown"),
                "professional_terms": parse_jsonish_list(node.get("professional_terms", []))[:8],
                "source_evidence": parse_jsonish_list(node.get("source_evidence", []))[:3],
                "score": round(float(score), 4),
            }
        )
    return sorted(results, key=lambda item: item["score"], reverse=True)[:top_k]


def retrieve_wiki_pages(
    query: str,
    mapped_terms: list[str],
    wiki_pages: list[dict[str, Any]],
    top_k: int = 10,
) -> list[dict[str, Any]]:
    corpus = [
        " ".join(
            [
                str(page.get("title", "")),
                str(page.get("page_id", "")),
                " ".join(parse_jsonish_list(page.get("tags", []))),
                str(page.get("frontmatter", "")),
                str(page.get("text", ""))[:3000],
            ]
        )
        for page in wiki_pages
    ]
    tfidf_scores = tfidf_query_scores(" ".join([query] + mapped_terms), corpus)
    results: list[dict[str, Any]] = []
    for index, page in enumerate(wiki_pages):
        title_tags = " ".join(
            [str(page.get("title", "")), str(page.get("page_id", "")), " ".join(parse_jsonish_list(page.get("tags", [])))]
        )
        text = corpus[index]
        score = 0.45 * (tfidf_scores[index] if index < len(tfidf_scores) else 0.0)
        score += 0.35 * phrase_hit_score(mapped_terms, title_tags)
        score += 0.20 * keyword_overlap_score(query, title_tags + " " + text[:1000])
        if score <= 0:
            continue
        results.append(
            {
                "page_id": page.get("page_id", ""),
                "title": page.get("title", ""),
                "path": page.get("path", ""),
                "tags": parse_jsonish_list(page.get("tags", []))[:8],
                "score": round(float(score), 4),
            }
        )
    return sorted(results, key=lambda item: item["score"], reverse=True)[:top_k]


def retrieve_chunks_raw(query: str, chunks: list[dict[str, Any]], top_k: int = 5) -> list[dict[str, Any]]:
    corpus = [str(chunk.get("chunk_text", ""))[:4000] for chunk in chunks]
    tfidf_scores = tfidf_query_scores(query, corpus)
    results: list[dict[str, Any]] = []
    for index, chunk in enumerate(chunks):
        text = corpus[index]
        score = 0.75 * (tfidf_scores[index] if index < len(tfidf_scores) else 0.0)
        score += 0.25 * keyword_overlap_score(query, text)
        if score <= 0:
            continue
        results.append(
            {
                "chunk_id": chunk.get("chunk_id", ""),
                "doc_id": chunk.get("doc_id", ""),
                "source_file": chunk.get("source_file", ""),
                "excerpt": compact_text(chunk.get("chunk_text", ""), 360),
                "score": round(float(score), 4),
            }
        )
    return sorted(results, key=lambda item: item["score"], reverse=True)[:top_k]


def enhanced_top_k_results(
    legal_terms: list[dict[str, Any]],
    ast_nodes: list[dict[str, Any]],
    wiki_pages: list[dict[str, Any]],
    top_k: int,
) -> list[dict[str, Any]]:
    combined: list[dict[str, Any]] = []
    for term in legal_terms:
        combined.append(
            {
                "result_type": "legal_term",
                "id": term.get("term_id", ""),
                "title": term.get("standard_term", ""),
                "score": round(0.40 * float(term.get("score", 0)), 4),
                "source_doc_ids": term.get("source_doc_ids", []),
            }
        )
    for node in ast_nodes:
        combined.append(
            {
                "result_type": "ast_node",
                "id": node.get("node_id", ""),
                "title": " / ".join(node.get("professional_terms", [])) or str(node.get("legal_domain", "")),
                "score": round(0.30 * float(node.get("score", 0)), 4),
                "source_doc_ids": [node.get("doc_id", "")],
            }
        )
    for page in wiki_pages:
        combined.append(
            {
                "result_type": "wiki_page",
                "id": page.get("page_id", ""),
                "title": page.get("title", ""),
                "score": round(0.20 * float(page.get("score", 0)), 4),
                "source_doc_ids": [],
            }
        )
    return sorted(combined, key=lambda item: item["score"], reverse=True)[:top_k]


def retrieve_for_query(
    query_id: str,
    query_text: str,
    *,
    legal_terms: list[dict[str, Any]],
    colloquial_mappings: list[dict[str, Any]],
    ast_nodes: list[dict[str, Any]],
    wiki_pages: list[dict[str, Any]],
    chunks: list[dict[str, Any]],
    top_k: int = TOP_K,
) -> dict[str, Any]:
    mapped_terms, matched_mappings = map_query_terms(query_text, colloquial_mappings, legal_terms, top_k=top_k)
    matched_terms = retrieve_legal_terms(query_text, mapped_terms, legal_terms, top_k=top_k)
    matched_nodes = retrieve_ast_nodes(query_text, mapped_terms, ast_nodes, top_k=top_k)
    matched_pages = retrieve_wiki_pages(query_text, mapped_terms, wiki_pages, top_k=top_k)
    raw_chunks = retrieve_chunks_raw(query_text, chunks, top_k=top_k)

    term_score = float(matched_terms[0]["score"]) if matched_terms else 0.0
    ast_score = float(matched_nodes[0]["score"]) if matched_nodes else 0.0
    wiki_score = float(matched_pages[0]["score"]) if matched_pages else 0.0
    chunk_score = float(raw_chunks[0]["score"]) if raw_chunks else 0.0
    relevance_score = 0.40 * term_score + 0.30 * ast_score + 0.20 * wiki_score + 0.10 * chunk_score

    source_doc_ids = unique_preserve(
        [
            doc_id
            for record in matched_terms
            for doc_id in parse_jsonish_list(record.get("source_doc_ids", []))
        ]
        + [str(record.get("doc_id", "")) for record in matched_nodes]
        + [str(record.get("doc_id", "")) for record in raw_chunks],
        limit=12,
    )
    evidence = unique_preserve(
        [evidence for node in matched_nodes for evidence in parse_jsonish_list(node.get("source_evidence", []))]
        + [chunk.get("excerpt", "") for chunk in raw_chunks[:2]],
        limit=8,
    )

    return {
        "query_id": query_id,
        "query_text": query_text,
        "mapped_terms": mapped_terms,
        "matched_colloquial_mappings": matched_mappings,
        "matched_legal_terms": matched_terms,
        "matched_ast_nodes": matched_nodes,
        "matched_wiki_pages": matched_pages,
        "top_k_results": enhanced_top_k_results(matched_terms, matched_nodes, matched_pages, top_k),
        "baseline_chunk_results": raw_chunks,
        "relevance_score": round(float(relevance_score), 4),
        "source_doc_ids": source_doc_ids,
        "source_evidence": evidence,
        "notes": "Prototype candidate retrieval only; results are not legal advice and require human review.",
    }


def serialize_for_csv(value: Any) -> str:
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)
    return str(value)


def write_retrieval_results(results: list[dict[str, Any]]) -> None:
    OUTPUT_JSON_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_CSV_DIR.mkdir(parents=True, exist_ok=True)
    json_path = OUTPUT_JSON_DIR / "retrieval_results.json"
    csv_path = OUTPUT_CSV_DIR / "retrieval_results.csv"
    backup_existing_file(json_path)
    backup_existing_file(csv_path)

    json_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    fieldnames = [
        "query_id",
        "query_text",
        "mapped_terms",
        "matched_legal_terms",
        "matched_ast_nodes",
        "matched_wiki_pages",
        "top_k_results",
        "relevance_score",
        "source_doc_ids",
        "source_evidence",
        "notes",
    ]
    with csv_path.open("w", newline="", encoding="utf-8-sig") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        for result in results:
            writer.writerow({field: serialize_for_csv(result.get(field, "")) for field in fieldnames})


def run_retrieval_validation(
    queries: list[str] | None = None,
    *,
    top_k: int = TOP_K,
    log=print,
) -> dict[str, Any]:
    from modules.evaluator import write_retrieval_validation_report

    selected_queries = queries or PRESET_RETRIEVAL_QUERIES
    legal_terms = load_json(OUTPUT_JSON_DIR / "legal_terms.json")
    colloquial_mappings = load_json(OUTPUT_JSON_DIR / "colloquial_mapping.json")
    ast_nodes = load_json(PROCESSED_AST_NODES_DIR / "ast_nodes.json")
    chunks = load_json(PROCESSED_CHUNKS_DIR / "document_chunks.json")
    wiki_pages = load_wiki_pages(WIKI_DIR)

    log("Starting retrieval validation")
    log(f"Preset queries: {len(selected_queries)}")
    log(
        "Retrieval corpus: "
        f"legal_terms={len(legal_terms)}, mappings={len(colloquial_mappings)}, "
        f"ast_nodes={len(ast_nodes)}, wiki_pages={len(wiki_pages)}, chunks={len(chunks)}"
    )

    results: list[dict[str, Any]] = []
    for index, query in enumerate(selected_queries, start=1):
        query_id = f"q{index:02d}"
        log(f"Retrieving {query_id}: {query}")
        results.append(
            retrieve_for_query(
                query_id,
                query,
                legal_terms=legal_terms,
                colloquial_mappings=colloquial_mappings,
                ast_nodes=ast_nodes,
                wiki_pages=wiki_pages,
                chunks=chunks,
                top_k=top_k,
            )
        )

    write_retrieval_results(results)
    report_path = OUTPUT_REPORTS_DIR / "retrieval_validation_report.md"
    write_retrieval_validation_report(results, report_path=report_path, created_at=datetime.now(timezone.utc).isoformat())
    log(f"Retrieval CSV saved: {OUTPUT_CSV_DIR / 'retrieval_results.csv'}")
    log(f"Retrieval JSON saved: {OUTPUT_JSON_DIR / 'retrieval_results.json'}")
    log(f"Retrieval validation report saved: {report_path}")

    return {
        "queries": len(selected_queries),
        "results": len(results),
        "legal_terms": len(legal_terms),
        "colloquial_mappings": len(colloquial_mappings),
        "ast_nodes": len(ast_nodes),
        "wiki_pages": len(wiki_pages),
        "chunks": len(chunks),
    }
