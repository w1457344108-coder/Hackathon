"""Retrieval validation and A/B comparison report helpers."""

from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import Any

from modules.chunker import backup_existing_file


def concentration_ratio(records: list[dict[str, Any]], doc_key: str = "doc_id") -> float:
    doc_ids = [str(record.get(doc_key, "")) for record in records if str(record.get(doc_key, "")).strip()]
    if not doc_ids:
        return 0.0
    _, count = Counter(doc_ids).most_common(1)[0]
    return round(count / len(doc_ids), 3)


def evaluate_result(result: dict[str, Any]) -> dict[str, Any]:
    baseline = result.get("baseline_chunk_results", [])
    enhanced_terms = result.get("matched_legal_terms", [])
    enhanced_nodes = result.get("matched_ast_nodes", [])
    enhanced_pages = result.get("matched_wiki_pages", [])
    top_results = result.get("top_k_results", [])
    enhanced_doc_ids = result.get("source_doc_ids", [])

    top_result_doc_ids = [
        doc_id
        for record in top_results
        for doc_id in record.get("source_doc_ids", [])
        if str(doc_id).strip()
    ]

    return {
        "query_id": result.get("query_id", ""),
        "baseline_top5_count": len(baseline),
        "baseline_doc_concentration": concentration_ratio(baseline),
        "enhanced_top5_count": len(top_results),
        "enhanced_doc_concentration": concentration_ratio([{"doc_id": doc_id} for doc_id in top_result_doc_ids])
        if top_result_doc_ids
        else concentration_ratio([{"doc_id": doc_id} for doc_id in enhanced_doc_ids]),
        "returns_professional_terms": bool(result.get("mapped_terms") or enhanced_terms),
        "returns_ast_nodes": bool(enhanced_nodes),
        "returns_wiki_pages": bool(enhanced_pages),
        "returns_source_documents": bool(enhanced_doc_ids),
        "relevance_score": result.get("relevance_score", 0),
    }


def bool_mark(value: bool) -> str:
    return "yes" if value else "no"


def compact_list(values: list[Any], limit: int = 5) -> str:
    items = [str(value) for value in values if str(value).strip()]
    if not items:
        return "-"
    return ", ".join(items[:limit])


def write_retrieval_validation_report(
    results: list[dict[str, Any]],
    *,
    report_path: Path,
    created_at: str,
) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    backup_existing_file(report_path)

    evaluations = [evaluate_result(result) for result in results]
    average_relevance = (
        round(sum(float(item["relevance_score"]) for item in evaluations) / len(evaluations), 4)
        if evaluations
        else 0
    )
    with_terms = sum(1 for item in evaluations if item["returns_professional_terms"])
    with_nodes = sum(1 for item in evaluations if item["returns_ast_nodes"])
    with_pages = sum(1 for item in evaluations if item["returns_wiki_pages"])
    with_sources = sum(1 for item in evaluations if item["returns_source_documents"])

    lines = [
        "# Retrieval Validation Report",
        "",
        f"Generated at: {created_at}",
        "",
        "## Scope",
        "",
        "This report validates candidate retrieval only. It does not generate legal advice and does not assert final legal conclusions.",
        "",
        "## Test Queries",
        "",
    ]
    for result in results:
        lines.append(f"- {result.get('query_id')}: {result.get('query_text')}")

    lines.extend(
        [
            "",
            "## Summary Metrics",
            "",
            f"- Test queries: {len(results)}",
            f"- Average enhanced relevance score: {average_relevance}",
            f"- Queries returning professional terms: {with_terms}/{len(results)}",
            f"- Queries returning AST nodes: {with_nodes}/{len(results)}",
            f"- Queries returning Wiki pages: {with_pages}/{len(results)}",
            f"- Queries returning source documents: {with_sources}/{len(results)}",
            "",
            "## Per-Query Results",
            "",
            "| query_id | mapped_terms | top_ast_nodes | top_wiki_pages | source_docs | relevance_score |",
            "| --- | --- | --- | --- | --- | ---: |",
        ]
    )

    for result in results:
        mapped_terms = compact_list(result.get("mapped_terms", []))
        ast_nodes = compact_list([node.get("node_id", "") for node in result.get("matched_ast_nodes", [])])
        wiki_pages = compact_list([page.get("page_id", "") for page in result.get("matched_wiki_pages", [])])
        source_docs = compact_list(result.get("source_doc_ids", []))
        lines.append(
            f"| {result.get('query_id')} | {mapped_terms} | {ast_nodes} | {wiki_pages} | {source_docs} | {result.get('relevance_score', 0)} |"
        )

    lines.extend(
        [
            "",
            "## A/B Comparison",
            "",
            "A = raw text chunk retrieval only. B = professional glossary + AST nodes + LLM Wiki retrieval.",
            "",
            "| query_id | A top5 | A doc concentration | B top5 | B doc concentration | B terms | B AST | B Wiki | B sources |",
            "| --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- |",
        ]
    )

    for item in evaluations:
        lines.append(
            "| {query_id} | {a_count} | {a_conc} | {b_count} | {b_conc} | {terms} | {ast} | {wiki} | {sources} |".format(
                query_id=item["query_id"],
                a_count=item["baseline_top5_count"],
                a_conc=item["baseline_doc_concentration"],
                b_count=item["enhanced_top5_count"],
                b_conc=item["enhanced_doc_concentration"],
                terms=bool_mark(item["returns_professional_terms"]),
                ast=bool_mark(item["returns_ast_nodes"]),
                wiki=bool_mark(item["returns_wiki_pages"]),
                sources=bool_mark(item["returns_source_documents"]),
            )
        )

    lines.extend(
        [
            "",
            "## Observations",
            "",
            "- B returns structured candidate evidence: professional terms, AST node IDs, Wiki page paths, and source document IDs.",
            "- A is useful as a sanity-check baseline because it searches the converted text directly.",
            "- B is generally more explainable because each candidate can be traced through a term, node, Wiki page, and source document.",
            "- B can inherit noise from rule-generated AST fields and glossary candidates, so every result remains `review_status = pending` until human review.",
            "- The current scoring is local and lightweight; it uses TF-IDF, keyword overlap, phrase hits, and field weighting rather than embeddings.",
            "",
            "## Limitations",
            "",
            "- This prototype returns candidate retrieval results only and must not be treated as formal legal advice.",
            "- Rule-generated terms may be overlong or too broad when source chunks include table-of-contents text.",
            "- Wiki title and tag matching is lightweight and can miss relevant pages if the page title differs from the user's wording.",
            "- Future improvements should add reviewed gold questions, manual relevance labels, better legal-domain filters, and optional embedding search.",
        ]
    )

    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8-sig")
