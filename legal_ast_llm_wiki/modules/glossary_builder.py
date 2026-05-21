"""Legal and policy glossary construction helpers."""

from __future__ import annotations

import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import pandas as pd

from config import (
    DEFAULT_REVIEW_STATUS,
    OUTPUT_CSV_DIR,
    OUTPUT_JSON_DIR,
    OUTPUT_REPORTS_DIR,
    PROCESSED_AST_NODES_DIR,
    WIKI_DIR,
    WIKI_GLOSSARY_DIR,
)
from modules.chunker import backup_existing_file
from modules.wiki_builder import (
    COLLOQUIAL_MAPPINGS,
    ISSUE_DEFINITIONS,
    SYNONYM_GROUPS,
    backup_existing_markdown,
    concept_link,
    frontmatter,
    obsidian_link,
)


CATEGORY_FIELDS = {
    "legal_subjects": "legal_subject",
    "legal_actions": "legal_action",
    "legal_objects": "legal_object",
    "conditions": "condition",
    "obligations": "obligation",
    "rights": "right",
    "prohibitions": "prohibition",
    "legal_consequences": "legal_consequence",
    "definitions": "definition",
    "professional_terms": "professional_term",
}


def stable_id(prefix: str, value: str) -> str:
    digest = hashlib.sha1(value.encode("utf-8")).hexdigest()[:12]
    return f"{prefix}_{digest}"


def normalize_term(value: str, limit: int = 180) -> str:
    text = re.sub(r"\s+", " ", str(value)).strip()
    text = text.strip(" -–—:;，；。")
    if len(text) > limit:
        return text[:limit].rstrip() + "..."
    return text


def list_value(node: dict[str, Any], key: str) -> list[str]:
    value = node.get(key, [])
    if isinstance(value, list):
        return [normalize_term(item, limit=500) for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [normalize_term(item, limit=500) for item in parsed if str(item).strip()]
        except json.JSONDecodeError:
            return [normalize_term(value, limit=500)]
    return []


def unique_preserve(items: Iterable[str], limit: int | None = None) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for item in items:
        text = normalize_term(item, limit=500)
        if text and text not in seen:
            seen.add(text)
            output.append(text)
            if limit is not None and len(output) >= limit:
                break
    return output


def infer_related_issue(term: str, node: dict[str, Any]) -> str:
    haystack = " ".join(
        [
            term,
            str(node.get("legal_domain", "")),
            str(node.get("original_text", ""))[:1000],
        ]
    ).lower()
    for issue_id, issue in ISSUE_DEFINITIONS.items():
        if any(str(keyword).lower() in haystack for keyword in issue["keywords"]):
            return issue_id
    return "unknown"


def term_confidence(confidences: Iterable[str]) -> str:
    values = list(confidences)
    if "high" in values:
        return "high"
    if "medium" in values:
        return "medium"
    return "low"


def collect_term_sources(nodes: list[dict[str, Any]]) -> dict[tuple[str, str], dict[str, Any]]:
    records: dict[tuple[str, str], dict[str, Any]] = {}

    for node in nodes:
        node_id = str(node.get("node_id", ""))
        doc_id = str(node.get("doc_id", ""))
        domain = str(node.get("legal_domain", "unknown"))
        confidence = str(node.get("confidence", "low"))
        source_text = list_value(node, "source_evidence") or [str(node.get("original_text", ""))[:500]]

        for field_name, category in CATEGORY_FIELDS.items():
            for raw_term in list_value(node, field_name):
                standard_term = normalize_term(raw_term)
                if not standard_term:
                    continue
                key = (category, standard_term)
                if key not in records:
                    records[key] = {
                        "term_id": stable_id("term", f"{category}:{standard_term}"),
                        "standard_term": standard_term,
                        "category": category,
                        "domains": [],
                        "issues": [],
                        "synonyms": [],
                        "colloquial_expressions": [],
                        "source_node_ids": [],
                        "source_doc_ids": [],
                        "source_text": [],
                        "confidences": [],
                        "notes": [],
                    }

                record = records[key]
                record["domains"].append(domain)
                record["issues"].append(infer_related_issue(standard_term, node))
                record["source_node_ids"].append(node_id)
                record["source_doc_ids"].append(doc_id)
                record["source_text"].extend(source_text[:2])
                record["confidences"].append(confidence)
                record["colloquial_expressions"].extend(list_value(node, "possible_user_questions")[:5])
                if category in {"definition", "condition", "obligation", "prohibition", "legal_consequence"}:
                    record["notes"].append("Extracted phrase may be a sentence-level candidate and requires review.")

        domain_term = domain if domain else "unknown"
        if domain_term != "unknown":
            key = ("legal_domain", domain_term)
            if key not in records:
                records[key] = {
                    "term_id": stable_id("term", f"legal_domain:{domain_term}"),
                    "standard_term": domain_term,
                    "category": "legal_domain",
                    "domains": [],
                    "issues": [],
                    "synonyms": [],
                    "colloquial_expressions": [],
                    "source_node_ids": [],
                    "source_doc_ids": [],
                    "source_text": [],
                    "confidences": [],
                    "notes": [],
                }
            records[key]["domains"].append(domain)
            records[key]["issues"].append(infer_related_issue(domain_term, node))
            records[key]["source_node_ids"].append(node_id)
            records[key]["source_doc_ids"].append(doc_id)
            records[key]["source_text"].extend(source_text[:1])
            records[key]["confidences"].append(confidence)

        for term in list_value(node, "professional_terms"):
            key = ("professional_term", normalize_term(term))
            if key in records:
                records[key]["synonyms"].extend(list_value(node, "related_terms"))

    for issue_id, issue in ISSUE_DEFINITIONS.items():
        matched_nodes = [
            node
            for node in nodes
            if any(str(keyword).lower() in str(node.get("original_text", "")).lower() for keyword in issue["keywords"])
        ]
        if not matched_nodes:
            continue
        key = ("issue", issue_id)
        records[key] = {
            "term_id": stable_id("term", f"issue:{issue_id}"),
            "standard_term": issue["title"],
            "category": "issue",
            "domains": [str(node.get("legal_domain", "unknown")) for node in matched_nodes],
            "issues": [issue_id],
            "synonyms": issue["keywords"],
            "colloquial_expressions": [question for node in matched_nodes for question in list_value(node, "possible_user_questions")],
            "source_node_ids": [str(node.get("node_id", "")) for node in matched_nodes],
            "source_doc_ids": [str(node.get("doc_id", "")) for node in matched_nodes],
            "source_text": [text for node in matched_nodes[:8] for text in list_value(node, "source_evidence")[:1]],
            "confidences": [str(node.get("confidence", "low")) for node in matched_nodes],
            "notes": ["Rule-generated issue entry; pending human review."],
        }

    return records


def finalize_legal_terms(raw_records: dict[tuple[str, str], dict[str, Any]]) -> list[dict[str, Any]]:
    legal_terms: list[dict[str, Any]] = []
    for _, record in raw_records.items():
        domains = [item for item in record["domains"] if item and item != "unknown"]
        issues = [item for item in record["issues"] if item and item != "unknown"]
        finalized = {
            "term_id": record["term_id"],
            "standard_term": record["standard_term"],
            "category": record["category"],
            "related_domain": Counter(domains).most_common(1)[0][0] if domains else "unknown",
            "related_issue": Counter(issues).most_common(1)[0][0] if issues else "unknown",
            "synonyms": unique_preserve(record["synonyms"], limit=30),
            "colloquial_expressions": unique_preserve(record["colloquial_expressions"], limit=20),
            "source_node_ids": unique_preserve(record["source_node_ids"], limit=80),
            "source_doc_ids": unique_preserve(record["source_doc_ids"], limit=40),
            "source_text": unique_preserve(record["source_text"], limit=8),
            "confidence": term_confidence(record["confidences"]),
            "review_status": DEFAULT_REVIEW_STATUS,
            "notes": unique_preserve(record["notes"], limit=8),
        }
        legal_terms.append(finalized)

    return sorted(legal_terms, key=lambda item: (item["category"], item["standard_term"].lower()))


def map_question_to_terms(node: dict[str, Any]) -> list[str]:
    candidates = []
    for key in ("professional_terms", "legal_objects", "legal_actions", "legal_subjects"):
        candidates.extend(list_value(node, key))
    domain = str(node.get("legal_domain", "unknown"))
    if domain != "unknown":
        candidates.append(domain)
    return unique_preserve(candidates, limit=6)


def build_colloquial_mappings(nodes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    raw: dict[str, dict[str, Any]] = {}

    for node in nodes:
        mapped_terms = map_question_to_terms(node)
        if not mapped_terms:
            continue
        for question in list_value(node, "possible_user_questions"):
            expression = normalize_term(question, limit=240)
            if not expression:
                continue
            if expression not in raw:
                raw[expression] = {
                    "mapping_id": stable_id("mapping", expression),
                    "colloquial_expression": expression,
                    "mapped_standard_terms": [],
                    "mapped_issue": infer_related_issue(expression, node),
                    "mapped_domain": str(node.get("legal_domain", "unknown")),
                    "source_node_ids": [],
                    "confidences": [],
                    "notes": ["Generated from AST possible_user_questions."],
                }
            raw[expression]["mapped_standard_terms"].extend(mapped_terms)
            raw[expression]["source_node_ids"].append(str(node.get("node_id", "")))
            raw[expression]["confidences"].append(str(node.get("confidence", "low")))

    for expression, standard_term in COLLOQUIAL_MAPPINGS:
        matched_nodes = [
            node
            for node in nodes
            if standard_term.lower() in " ".join(map_question_to_terms(node)).lower()
            or any(part in str(node.get("original_text", "")).lower() for part in standard_term.lower().split()[:2])
        ][:40]
        if not matched_nodes:
            continue
        if expression not in raw:
            raw[expression] = {
                "mapping_id": stable_id("mapping", expression),
                "colloquial_expression": expression,
                "mapped_standard_terms": [standard_term],
                "mapped_issue": infer_related_issue(standard_term, matched_nodes[0]),
                "mapped_domain": str(matched_nodes[0].get("legal_domain", "unknown")),
                "source_node_ids": [],
                "confidences": [],
                "notes": ["Seed colloquial expression mapped to AST-backed terms; pending review."],
            }
        raw[expression]["mapped_standard_terms"].append(standard_term)
        raw[expression]["source_node_ids"].extend(str(node.get("node_id", "")) for node in matched_nodes)
        raw[expression]["confidences"].extend(str(node.get("confidence", "low")) for node in matched_nodes)

    mappings: list[dict[str, Any]] = []
    for record in raw.values():
        mappings.append(
            {
                "mapping_id": record["mapping_id"],
                "colloquial_expression": record["colloquial_expression"],
                "mapped_standard_terms": unique_preserve(record["mapped_standard_terms"], limit=12),
                "mapped_issue": record["mapped_issue"],
                "mapped_domain": record["mapped_domain"],
                "source_node_ids": unique_preserve(record["source_node_ids"], limit=80),
                "confidence": term_confidence(record["confidences"]),
                "review_status": DEFAULT_REVIEW_STATUS,
                "notes": unique_preserve(record["notes"], limit=5),
            }
        )
    return sorted(mappings, key=lambda item: item["colloquial_expression"].lower())


def build_synonym_table(nodes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    raw: dict[tuple[str, str, str], dict[str, Any]] = {}

    for node in nodes:
        node_id = str(node.get("node_id", ""))
        confidence = str(node.get("confidence", "low"))
        for standard_term in list_value(node, "professional_terms"):
            for related in list_value(node, "related_terms"):
                key = (standard_term, related, "related_term")
                if key not in raw:
                    raw[key] = {
                        "synonym_id": stable_id("synonym", "|".join(key)),
                        "standard_term": standard_term,
                        "synonym": related,
                        "relation_type": "related_term",
                        "source_node_ids": [],
                        "confidences": [],
                    }
                raw[key]["source_node_ids"].append(node_id)
                raw[key]["confidences"].append(confidence)

    for standard_term, synonyms in SYNONYM_GROUPS:
        matched_nodes = [
            node
            for node in nodes
            if standard_term.lower() in " ".join(map_question_to_terms(node)).lower()
            or standard_term.lower() in str(node.get("original_text", "")).lower()
        ][:80]
        if not matched_nodes:
            continue
        for synonym in synonyms:
            key = (standard_term, synonym, "synonym")
            if key not in raw:
                raw[key] = {
                    "synonym_id": stable_id("synonym", "|".join(key)),
                    "standard_term": standard_term,
                    "synonym": synonym,
                    "relation_type": "synonym",
                    "source_node_ids": [],
                    "confidences": [],
                }
            raw[key]["source_node_ids"].extend(str(node.get("node_id", "")) for node in matched_nodes)
            raw[key]["confidences"].extend(str(node.get("confidence", "low")) for node in matched_nodes)

    records: list[dict[str, Any]] = []
    for record in raw.values():
        records.append(
            {
                "synonym_id": record["synonym_id"],
                "standard_term": record["standard_term"],
                "synonym": record["synonym"],
                "relation_type": record["relation_type"],
                "source_node_ids": unique_preserve(record["source_node_ids"], limit=80),
                "confidence": term_confidence(record["confidences"]),
                "review_status": DEFAULT_REVIEW_STATUS,
            }
        )
    return sorted(records, key=lambda item: (item["standard_term"].lower(), item["synonym"].lower()))


def build_glossary_records(nodes: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    raw_terms = collect_term_sources(nodes)
    return finalize_legal_terms(raw_terms), build_colloquial_mappings(nodes), build_synonym_table(nodes)


def load_ast_nodes(ast_path: Path = PROCESSED_AST_NODES_DIR / "ast_nodes.json") -> list[dict[str, Any]]:
    if not ast_path.exists():
        raise FileNotFoundError(f"Missing AST node file: {ast_path}")
    return json.loads(ast_path.read_text(encoding="utf-8"))


def serializable_record(record: dict[str, Any]) -> dict[str, Any]:
    return {
        key: json.dumps(value, ensure_ascii=False) if isinstance(value, list) else value
        for key, value in record.items()
    }


def write_csv(path: Path, records: list[dict[str, Any]], fieldnames: list[str]) -> None:
    backup_existing_file(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(serializable_record(record) for record in records)


def write_json(path: Path, records: list[dict[str, Any]]) -> None:
    backup_existing_file(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")


def write_xlsx(path: Path, records: list[dict[str, Any]]) -> None:
    backup_existing_file(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    df = pd.DataFrame([serializable_record(record) for record in records])
    df.to_excel(path, index=False)


def markdown_table(records: list[dict[str, Any]], columns: list[str], limit: int | None = None) -> str:
    selected = records[:limit] if limit else records
    lines = ["| " + " | ".join(columns) + " |", "| " + " | ".join(["---"] * len(columns)) + " |"]
    for record in selected:
        values = []
        for column in columns:
            value = record.get(column, "")
            if isinstance(value, list):
                value = ", ".join(str(item) for item in value[:8])
            values.append(str(value).replace("\n", " ").replace("|", "\\|"))
        lines.append("| " + " | ".join(values) + " |")
    return "\n".join(lines) + "\n"


def frontmatter_for_glossary(page_type: str, created_at: str) -> str:
    return (
        "---\n"
        f"type: {page_type}\n"
        f"review_status: {DEFAULT_REVIEW_STATUS}\n"
        f"created_at: \"{created_at}\"\n"
        f"updated_at: \"{created_at}\"\n"
        "tags:\n"
        "  - legal-wiki\n"
        "  - glossary\n"
        "---\n\n"
    )


def sync_glossary_wiki(
    legal_terms: list[dict[str, Any]],
    mappings: list[dict[str, Any]],
    synonyms: list[dict[str, Any]],
    created_at: str,
) -> None:
    WIKI_GLOSSARY_DIR.mkdir(parents=True, exist_ok=True)

    legal_terms_md = frontmatter_for_glossary("legal_terms", created_at)
    legal_terms_md += "# Legal Terms\n\n"
    legal_terms_md += "All entries are generated candidates and require review.\n\n"
    legal_terms_md += markdown_table(
        legal_terms,
        [
            "standard_term",
            "category",
            "related_domain",
            "related_issue",
            "source_node_ids",
            "source_doc_ids",
            "confidence",
            "review_status",
        ],
    )

    mapping_md = frontmatter_for_glossary("colloquial_mapping", created_at)
    mapping_md += "# Colloquial Mapping\n\n"
    mapping_md += "Maps user-language expressions to AST-backed candidate terms.\n\n"
    mapping_md += markdown_table(
        mappings,
        [
            "colloquial_expression",
            "mapped_standard_terms",
            "mapped_issue",
            "mapped_domain",
            "source_node_ids",
            "confidence",
            "review_status",
        ],
    )

    synonym_md = frontmatter_for_glossary("synonym_table", created_at)
    synonym_md += "# Synonym Table\n\n"
    synonym_md += "Synonym and related-term candidates derived from AST related terms and seeded mappings.\n\n"
    synonym_md += markdown_table(
        synonyms,
        ["standard_term", "synonym", "relation_type", "source_node_ids", "confidence", "review_status"],
    )

    for path, content in [
        (WIKI_GLOSSARY_DIR / "legal_terms.md", legal_terms_md),
        (WIKI_GLOSSARY_DIR / "colloquial_mapping.md", mapping_md),
        (WIKI_GLOSSARY_DIR / "synonym_table.md", synonym_md),
    ]:
        backup_existing_markdown(path)
        path.write_text(content, encoding="utf-8-sig")


def update_markdown_section(path: Path, header: str, body: str) -> None:
    existing = path.read_text(encoding="utf-8-sig") if path.exists() else ""
    pattern = re.compile(rf"\n## {re.escape(header)}\n[\s\S]*?(?=\n## |\Z)")
    replacement = f"\n## {header}\n\n{body.rstrip()}\n"
    if pattern.search(existing):
        updated = pattern.sub(replacement, existing)
    else:
        updated = existing.rstrip() + "\n" + replacement
    backup_existing_markdown(path)
    path.write_text(updated, encoding="utf-8-sig")


def sync_index_and_log(
    legal_terms: list[dict[str, Any]],
    mappings: list[dict[str, Any]],
    synonyms: list[dict[str, Any]],
    created_at: str,
) -> None:
    index_body = "\n".join(
        [
            f"- Last glossary build: {created_at}",
            f"- Legal terms: {len(legal_terms)}",
            f"- Colloquial mappings: {len(mappings)}",
            f"- Synonym rows: {len(synonyms)}",
            f"- [[glossary/legal_terms|Legal Terms]]",
            f"- [[glossary/colloquial_mapping|Colloquial Mapping]]",
            f"- [[glossary/synonym_table|Synonym Table]]",
        ]
    )
    log_body = "\n".join(
        [
            f"- Build time: {created_at}",
            f"- Legal terms generated: {len(legal_terms)}",
            f"- Colloquial mappings generated: {len(mappings)}",
            f"- Synonym mappings generated: {len(synonyms)}",
            "- All glossary records are rule-generated candidates with `review_status: pending`.",
            "- Human review is required before treating any term as authoritative.",
        ]
    )
    update_markdown_section(WIKI_DIR / "index.md", "Vocabulary Outputs", index_body)
    update_markdown_section(WIKI_DIR / "log.md", "Glossary Build Log", log_body)


def generate_glossary_report(
    legal_terms: list[dict[str, Any]],
    mappings: list[dict[str, Any]],
    synonyms: list[dict[str, Any]],
    report_path: Path,
    created_at: str,
) -> None:
    backup_existing_file(report_path)
    category_counts = Counter(record["category"] for record in legal_terms)
    top_term_categories = {
        "professional_term",
        "legal_subject",
        "legal_action",
        "legal_object",
        "legal_domain",
        "issue",
    }
    term_counts: Counter[str] = Counter()
    for record in legal_terms:
        term = str(record["standard_term"])
        if record["category"] not in top_term_categories:
            continue
        if len(term) > 80 or re.match(r"^\(?\d+[A-Z]?\)?\s", term):
            continue
        term_counts[term] = len(record["source_node_ids"])
    low_confidence = [record for record in legal_terms if record["confidence"] == "low"]

    lines = [
        "# Glossary Build Report",
        "",
        f"Generated at: {created_at}",
        "",
        "## Summary",
        "",
        f"- Legal terms: {len(legal_terms)}",
        f"- Colloquial mappings: {len(mappings)}",
        f"- Synonym rows: {len(synonyms)}",
        "",
        "## Category Counts",
        "",
    ]
    lines.extend(f"- {category}: {count}" for category, count in category_counts.most_common())
    lines.extend(["", "## High-Frequency Terms Top 30", ""])
    lines.extend(f"- {term}: {count}" for term, count in term_counts.most_common(30))
    lines.extend(["", "## Colloquial Mapping Samples", ""])
    for mapping in mappings[:12]:
        lines.append(f"- {mapping['colloquial_expression']} -> {', '.join(mapping['mapped_standard_terms'][:5])}")
    lines.extend(["", "## Synonym Mapping Samples", ""])
    for row in synonyms[:12]:
        lines.append(f"- {row['standard_term']} / {row['synonym']} ({row['relation_type']})")
    lines.extend(["", "## Low-Confidence Terms", ""])
    if low_confidence:
        for record in low_confidence[:80]:
            lines.append(f"- {record['term_id']}: {record['standard_term']} ({record['category']})")
        if len(low_confidence) > 80:
            lines.append(f"- ... {len(low_confidence) - 80} more low-confidence terms omitted.")
    else:
        lines.append("- None.")
    lines.extend(
        [
            "",
            "## Needs Human Review",
            "",
            "- Validate sentence-level obligation, prohibition, condition, and consequence candidates.",
            "- Review rule-generated colloquial mappings before using them for user-facing retrieval.",
            "- Confirm synonym relation types; current labels are candidate-level only.",
            "- Remove duplicate or overly broad terms before treating the vocabulary as authoritative.",
            "",
            "## Current Limitations",
            "",
            "- This builder uses AST fields and rule-generated Wiki data only; it does not perform legal reasoning.",
            "- Long legal sentences may appear as candidate terms for obligations or conditions.",
            "- Confidence reflects upstream AST confidence, not expert validation.",
            "- All generated entries remain `review_status: pending`.",
        ]
    )
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8-sig")


def write_glossary_outputs(
    legal_terms: list[dict[str, Any]],
    mappings: list[dict[str, Any]],
    synonyms: list[dict[str, Any]],
) -> None:
    OUTPUT_CSV_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON_DIR.mkdir(parents=True, exist_ok=True)

    legal_term_fields = [
        "term_id",
        "standard_term",
        "category",
        "related_domain",
        "related_issue",
        "synonyms",
        "colloquial_expressions",
        "source_node_ids",
        "source_doc_ids",
        "source_text",
        "confidence",
        "review_status",
        "notes",
    ]
    mapping_fields = [
        "mapping_id",
        "colloquial_expression",
        "mapped_standard_terms",
        "mapped_issue",
        "mapped_domain",
        "source_node_ids",
        "confidence",
        "review_status",
        "notes",
    ]
    synonym_fields = [
        "synonym_id",
        "standard_term",
        "synonym",
        "relation_type",
        "source_node_ids",
        "confidence",
        "review_status",
    ]

    write_csv(OUTPUT_CSV_DIR / "legal_terms.csv", legal_terms, legal_term_fields)
    write_xlsx(OUTPUT_CSV_DIR / "legal_terms.xlsx", legal_terms)
    write_json(OUTPUT_JSON_DIR / "legal_terms.json", legal_terms)
    write_csv(OUTPUT_CSV_DIR / "colloquial_mapping.csv", mappings, mapping_fields)
    write_json(OUTPUT_JSON_DIR / "colloquial_mapping.json", mappings)
    write_csv(OUTPUT_CSV_DIR / "synonym_table.csv", synonyms, synonym_fields)
    write_json(OUTPUT_JSON_DIR / "synonym_table.json", synonyms)


def build_glossary(
    *,
    ast_path: Path = PROCESSED_AST_NODES_DIR / "ast_nodes.json",
    report_path: Path = OUTPUT_REPORTS_DIR / "glossary_build_report.md",
    log=print,
) -> dict[str, int]:
    created_at = datetime.now(timezone.utc).isoformat()
    nodes = load_ast_nodes(ast_path)
    log("Starting glossary build")
    log(f"AST nodes loaded: {len(nodes)}")

    legal_terms, mappings, synonyms = build_glossary_records(nodes)
    write_glossary_outputs(legal_terms, mappings, synonyms)
    generate_glossary_report(legal_terms, mappings, synonyms, report_path, created_at)
    sync_glossary_wiki(legal_terms, mappings, synonyms, created_at)
    sync_index_and_log(legal_terms, mappings, synonyms, created_at)

    log(f"Legal terms: {len(legal_terms)}")
    log(f"Colloquial mappings: {len(mappings)}")
    log(f"Synonym rows: {len(synonyms)}")
    log(f"Glossary report saved: {report_path}")
    return {
        "legal_terms": len(legal_terms),
        "colloquial_mappings": len(mappings),
        "synonyms": len(synonyms),
    }
