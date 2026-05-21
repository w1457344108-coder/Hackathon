"""Markdown Wiki page generation from reviewed or pending AST nodes."""

from __future__ import annotations

import hashlib
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from config import (
    DEFAULT_REVIEW_STATUS,
    OUTPUT_REPORTS_DIR,
    PROCESSED_AST_NODES_DIR,
    RAW_DOCUMENTS_DIR,
    WIKI_CONCEPTS_DIR,
    WIKI_DIR,
    WIKI_GLOSSARY_DIR,
    WIKI_ISSUES_DIR,
    WIKI_LAWS_DIR,
    WIKI_SOURCES_DIR,
    WIKI_STRUCTURED_NODES_DIR,
)
from modules.chunker import backup_existing_file


CORE_CONCEPTS = [
    "personal data",
    "consent",
    "cross-border transfer",
    "digital governance",
    "cybersecurity",
    "electronic transaction",
    "AI governance",
]

ISSUE_DEFINITIONS = {
    "personal_data_protection": {
        "title": "Personal Data Protection",
        "description": "Questions about how personal data is protected, processed, disclosed, or otherwise handled.",
        "concepts": ["personal data", "data protection", "consent"],
        "keywords": ["personal data", "data protection", "organisation", "individual"],
    },
    "cross_border_data_transfer": {
        "title": "Cross-Border Data Transfer",
        "description": "Questions about transferring, transmitting, exporting, or disclosing personal data across borders.",
        "concepts": ["personal data", "cross-border transfer", "transfer"],
        "keywords": ["transfer", "overseas", "cross-border", "export", "transmission"],
    },
    "consent_requirement": {
        "title": "Consent Requirement",
        "description": "Questions about whether consent is needed before collecting, using, disclosing, or processing data.",
        "concepts": ["consent", "personal data", "individual"],
        "keywords": ["consent", "agree", "permission", "authorisation"],
    },
    "cybersecurity_obligation": {
        "title": "Cybersecurity Obligation",
        "description": "Questions about cybersecurity duties, network operators, and critical information infrastructure.",
        "concepts": ["cybersecurity", "network security", "network operator"],
        "keywords": ["cybersecurity", "network security", "critical information infrastructure", "network operator"],
    },
}

SYNONYM_GROUPS = [
    ("personal data", ["personal information", "个人信息", "个人数据"]),
    ("organisation", ["organization", "company", "business", "corporation"]),
    ("individual", ["person", "data subject", "个人", "自然人"]),
    ("disclosure", ["sharing", "provision", "making available", "披露", "公开"]),
    ("transfer", ["transmission", "export", "cross-border transfer", "转移", "传输"]),
    ("consent", ["permission", "authorisation", "agreement", "同意"]),
    ("cybersecurity", ["network security", "网络安全"]),
    ("electronic record", ["digital record", "电子记录"]),
]

COLLOQUIAL_MAPPINGS = [
    ("Can a company send my data overseas?", "cross-border transfer of personal data"),
    ("Do I need to agree before my data is used?", "consent requirement"),
    ("What counts as personal data?", "definition of personal data"),
    ("Can an organisation share my information?", "disclosure of personal data"),
    ("What happens if a company breaks the data law?", "penalty or liability for contravention"),
    ("What cybersecurity duties does a network operator have?", "cybersecurity obligation"),
]


def slugify_filename(value: str) -> str:
    value = value.strip()
    ascii_slug = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    ascii_slug = re.sub(r"_+", "_", ascii_slug)
    if ascii_slug:
        return ascii_slug[:120]
    digest = hashlib.sha1(value.encode("utf-8")).hexdigest()[:8]
    return f"term_{digest}"


def obsidian_link(target: str, label: str | None = None) -> str:
    if label and label != target:
        return f"[[{target}|{label}]]"
    return f"[[{target}]]"


def yaml_scalar(value: Any) -> str:
    if value is None:
        return '""'
    text = str(value).replace("\n", " ").strip()
    if text == "":
        return '""'
    if re.search(r"[:#\[\]{},&*?!|>'\"%@`]", text):
        return json.dumps(text, ensure_ascii=False)
    return text


def frontmatter(values: dict[str, Any]) -> str:
    lines = ["---"]
    for key, value in values.items():
        if isinstance(value, list):
            lines.append(f"{key}:")
            if value:
                for item in value:
                    lines.append(f"  - {yaml_scalar(item)}")
            else:
                lines.append("  []")
        else:
            lines.append(f"{key}: {yaml_scalar(value)}")
    lines.append("---")
    return "\n".join(lines) + "\n\n"


def load_ast_nodes(ast_path: Path = PROCESSED_AST_NODES_DIR / "ast_nodes.json") -> list[dict[str, Any]]:
    if not ast_path.exists():
        raise FileNotFoundError(f"Missing AST node file: {ast_path}")
    return json.loads(ast_path.read_text(encoding="utf-8"))


def ensure_wiki_dirs() -> None:
    for directory in [
        WIKI_DIR,
        WIKI_SOURCES_DIR,
        WIKI_LAWS_DIR,
        WIKI_CONCEPTS_DIR,
        WIKI_ISSUES_DIR,
        WIKI_GLOSSARY_DIR,
        WIKI_STRUCTURED_NODES_DIR,
    ]:
        directory.mkdir(parents=True, exist_ok=True)


def list_value(node: dict[str, Any], key: str) -> list[str]:
    value = node.get(key, [])
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(item) for item in parsed if str(item).strip()]
        except json.JSONDecodeError:
            return [value]
    return []


def first_common(values: Iterable[str], fallback: str = "unknown") -> str:
    clean = [value for value in values if value]
    if not clean:
        return fallback
    return Counter(clean).most_common(1)[0][0]


def unique_preserve(items: Iterable[str], limit: int | None = None) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for item in items:
        clean = str(item).strip()
        if clean and clean not in seen:
            seen.add(clean)
            output.append(clean)
            if limit is not None and len(output) >= limit:
                break
    return output


def md_list(items: Iterable[str], empty: str = "None identified.") -> str:
    values = list(items)
    if not values:
        return f"- {empty}\n"
    return "".join(f"- {item}\n" for item in values)


def md_link_list(items: Iterable[tuple[str, str]], empty: str = "None identified.") -> str:
    values = list(items)
    if not values:
        return f"- {empty}\n"
    return "".join(f"- {obsidian_link(target, label)}\n" for target, label in values)


def truncate_text(text: str, limit: int = 2200) -> str:
    clean = text.strip()
    if len(clean) <= limit:
        return clean
    return clean[:limit].rstrip() + "\n\n[Excerpt truncated for Wiki readability. See AST JSON for full node text.]"


def domain_slug(domain: str) -> str:
    return slugify_filename(domain if domain != "unknown" else "unknown_domain")


def concept_slug(concept: str) -> str:
    return slugify_filename(concept)


def node_link(node: dict[str, Any]) -> tuple[str, str]:
    node_id = str(node["node_id"])
    return f"structured_nodes/{slugify_filename(node_id)}", node_id


def source_link(doc_id: str, label: str | None = None) -> tuple[str, str]:
    return f"sources/{slugify_filename(doc_id)}", label or doc_id


def concept_link(term: str) -> tuple[str, str]:
    return f"concepts/{concept_slug(term)}", term


def write_markdown(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    backup_existing_markdown(path)
    path.write_text(content, encoding="utf-8-sig")


def backup_existing_markdown(path: Path) -> Path | None:
    if not path.exists():
        return None

    backup_dir = path.parent / "_backups" / datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup_path = backup_dir / path.name
    path.replace(backup_path)
    return backup_path


def group_nodes_by_doc(nodes: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for node in nodes:
        grouped[str(node["doc_id"])].append(node)
    return dict(grouped)


def term_counter(nodes: list[dict[str, Any]]) -> Counter[str]:
    return Counter(term for node in nodes for term in list_value(node, "professional_terms"))


def source_page(doc_id: str, nodes: list[dict[str, Any]], created_at: str) -> str:
    source_file = str(nodes[0].get("source_file", "unknown"))
    document_type = first_common(str(node.get("document_type", "unknown")) for node in nodes)
    jurisdiction = first_common(str(node.get("jurisdiction", "unknown")) for node in nodes)
    domains = Counter(str(node.get("legal_domain", "unknown")) for node in nodes).most_common(5)
    terms = [term for term, _ in Counter(term for node in nodes for term in list_value(node, "professional_terms")).most_common(20)]
    concepts = [term for term in terms if term][:12]
    raw_path = RAW_DOCUMENTS_DIR / source_file
    summary = (
        f"This source page summarizes {len(nodes)} generated AST-like nodes. "
        f"The rule parser classified the source mainly as `{document_type}` in `{jurisdiction}`, "
        f"with prominent domains: {', '.join(domain for domain, _ in domains) or 'unknown'}. "
        "This is a pending-review machine summary, not a legal conclusion."
    )

    content = frontmatter(
        {
            "type": "source",
            "doc_id": doc_id,
            "jurisdiction": jurisdiction,
            "domain": domains[0][0] if domains else "unknown",
            "source_count": len(nodes),
            "review_status": DEFAULT_REVIEW_STATUS,
            "created_at": created_at,
            "updated_at": created_at,
            "tags": ["legal-wiki", "source", slugify_filename(jurisdiction)],
        }
    )
    content += f"# {source_file}\n\n"
    content += f"- Document name: {source_file}\n"
    content += f"- File name: `{source_file}`\n"
    content += f"- Document type: `{document_type}`\n"
    content += f"- Jurisdiction: `{jurisdiction}`\n"
    content += f"- Main themes: {', '.join(f'`{domain}`' for domain, _ in domains) or '`unknown`'}\n"
    content += f"- Original file path: `{raw_path}`\n"
    content += f"- Review status: `{DEFAULT_REVIEW_STATUS}`\n\n"
    content += "## Summary\n\n" + summary + "\n\n"
    content += "## Core Professional Terms\n\n" + md_list([obsidian_link(*concept_link(term)) for term in terms])
    content += "\n## Related AST Nodes\n\n" + md_link_list(node_link(node) for node in nodes)
    content += "\n## Related Concept Pages\n\n" + md_link_list(concept_link(term) for term in concepts)
    return content


def structured_node_page(node: dict[str, Any], created_at: str) -> str:
    node_id = str(node["node_id"])
    doc_id = str(node["doc_id"])
    domain = str(node.get("legal_domain", "unknown"))
    jurisdiction = str(node.get("jurisdiction", "unknown"))
    terms = list_value(node, "professional_terms")

    content = frontmatter(
        {
            "type": "structured_node",
            "node_id": node_id,
            "doc_id": doc_id,
            "chunk_id": node.get("chunk_id", ""),
            "jurisdiction": jurisdiction,
            "domain": domain,
            "confidence": node.get("confidence", "low"),
            "review_status": node.get("review_status", DEFAULT_REVIEW_STATUS),
            "created_at": created_at,
            "updated_at": created_at,
            "tags": ["legal-wiki", "structured-node", slugify_filename(domain)],
        }
    )
    content += f"# {node_id}\n\n"
    content += f"- Source document: {obsidian_link(*source_link(doc_id, str(node.get('source_file', doc_id))))}\n"
    content += f"- Source file: `{node.get('source_file', '')}`\n"
    content += f"- Chunk id: `{node.get('chunk_id', '')}`\n"
    content += f"- Document type: `{node.get('document_type', 'unknown')}`\n"
    content += f"- Review status: `{node.get('review_status', DEFAULT_REVIEW_STATUS)}`\n\n"
    content += "## Original Excerpt\n\n```text\n" + truncate_text(str(node.get("original_text", ""))) + "\n```\n\n"
    sections = [
        ("Legal Subjects", "legal_subjects"),
        ("Legal Actions", "legal_actions"),
        ("Legal Objects", "legal_objects"),
        ("Conditions", "conditions"),
        ("Obligations", "obligations"),
        ("Rights", "rights"),
        ("Prohibitions", "prohibitions"),
        ("Legal Consequences", "legal_consequences"),
        ("Exceptions", "exceptions"),
        ("Professional Terms", "professional_terms"),
        ("Possible User Questions", "possible_user_questions"),
        ("Source Evidence", "source_evidence"),
    ]
    for title, key in sections:
        content += f"## {title}\n\n" + md_list(list_value(node, key)) + "\n"
    content += "## Related Pages\n\n"
    related_links = [source_link(doc_id, str(node.get("source_file", doc_id)))]
    related_links.extend(concept_link(term) for term in terms[:8])
    if domain != "unknown":
        related_links.append((f"laws/{domain_slug(domain)}", domain))
    content += md_link_list(related_links)
    return content


def concept_page(term: str, nodes: list[dict[str, Any]], created_at: str) -> str:
    related_nodes = [node for node in nodes if term in list_value(node, "professional_terms") or term == str(node.get("legal_domain"))]
    if not related_nodes:
        related_nodes = [
            node
            for node in nodes
            if term.lower() in str(node.get("original_text", "")).lower()
        ][:30]
    related_nodes = related_nodes[:80]
    domains = Counter(str(node.get("legal_domain", "unknown")) for node in related_nodes)
    docs = unique_preserve((str(node["doc_id"]) for node in related_nodes), limit=40)
    related_terms = unique_preserve(
        term_value
        for node in related_nodes
        for term_value in list_value(node, "related_terms") + list_value(node, "professional_terms")
        if term_value != term
    )
    questions = unique_preserve(
        question
        for node in related_nodes
        for question in list_value(node, "possible_user_questions")
    )

    explanation = (
        f"`{term}` is a machine-organized concept page built from AST nodes where the term or related domain appears. "
        "The text below is an index of evidence-bearing nodes and should be reviewed before use as legal knowledge."
    )

    content = frontmatter(
        {
            "type": "concept",
            "jurisdiction": first_common(str(node.get("jurisdiction", "unknown")) for node in related_nodes),
            "domain": domains.most_common(1)[0][0] if domains else "unknown",
            "source_count": len(docs),
            "review_status": DEFAULT_REVIEW_STATUS,
            "created_at": created_at,
            "updated_at": created_at,
            "tags": ["legal-wiki", "concept", slugify_filename(term)],
        }
    )
    content += f"# {term}\n\n"
    content += "## Brief Explanation\n\n" + explanation + "\n\n"
    content += "## Source Nodes\n\n" + md_link_list(node_link(node) for node in related_nodes[:60])
    content += "\n## Related Terms\n\n" + md_list(related_terms[:30])
    content += "\n## Related Documents\n\n" + md_link_list(source_link(doc_id) for doc_id in docs)
    content += "\n## User Colloquial Expressions\n\n" + md_list(questions[:20])
    content += "\n## Related Wiki Pages\n\n"
    links = [source_link(doc_id) for doc_id in docs[:10]]
    if domains:
        links.append((f"laws/{domain_slug(domains.most_common(1)[0][0])}", domains.most_common(1)[0][0]))
    content += md_link_list(links)
    return content


def law_page(domain: str, nodes: list[dict[str, Any]], created_at: str) -> str:
    domain_nodes = [node for node in nodes if str(node.get("legal_domain")) == domain]
    docs = unique_preserve((str(node["doc_id"]) for node in domain_nodes), limit=50)
    terms = [term for term, _ in Counter(term for node in domain_nodes for term in list_value(node, "professional_terms")).most_common(30)]
    content = frontmatter(
        {
            "type": "law_topic",
            "jurisdiction": first_common(str(node.get("jurisdiction", "unknown")) for node in domain_nodes),
            "domain": domain,
            "source_count": len(docs),
            "review_status": DEFAULT_REVIEW_STATUS,
            "created_at": created_at,
            "updated_at": created_at,
            "tags": ["legal-wiki", "law-topic", slugify_filename(domain)],
        }
    )
    content += f"# {domain}\n\n"
    content += "This topic page groups AST nodes by detected legal or policy domain. It is a navigation layer, not a legal conclusion.\n\n"
    content += "## Related Documents\n\n" + md_link_list(source_link(doc_id) for doc_id in docs)
    content += "\n## Core Terms\n\n" + md_link_list(concept_link(term) for term in terms[:20])
    content += "\n## Related AST Nodes\n\n" + md_link_list(node_link(node) for node in domain_nodes[:100])
    return content


def issue_page(issue_id: str, issue: dict[str, Any], nodes: list[dict[str, Any]], created_at: str) -> str:
    keywords = [keyword.lower() for keyword in issue["keywords"]]
    matched = [
        node
        for node in nodes
        if any(keyword in str(node.get("original_text", "")).lower() for keyword in keywords)
    ][:120]
    docs = unique_preserve((str(node["doc_id"]) for node in matched), limit=50)
    typical_questions = unique_preserve(
        question for node in matched for question in list_value(node, "possible_user_questions")
    )

    content = frontmatter(
        {
            "type": "issue",
            "jurisdiction": first_common(str(node.get("jurisdiction", "unknown")) for node in matched),
            "domain": first_common(str(node.get("legal_domain", "unknown")) for node in matched),
            "source_count": len(docs),
            "review_status": DEFAULT_REVIEW_STATUS,
            "created_at": created_at,
            "updated_at": created_at,
            "tags": ["legal-wiki", "issue", issue_id],
        }
    )
    content += f"# {issue['title']}\n\n"
    content += f"## Issue Description\n\n{issue['description']}\n\n"
    content += "## Related Legal or Policy Evidence\n\n" + md_link_list(node_link(node) for node in matched[:80])
    content += "\n## Related Concepts\n\n" + md_link_list(concept_link(concept) for concept in issue["concepts"])
    content += "\n## Related AST Nodes\n\n" + md_link_list(node_link(node) for node in matched[:80])
    content += "\n## Typical User Questions\n\n" + md_list(typical_questions[:20])
    content += "\n## Retrieval Keywords\n\n" + md_list(issue["keywords"])
    return content


def legal_terms_page(nodes: list[dict[str, Any]], created_at: str) -> str:
    term_nodes: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for node in nodes:
        for term in list_value(node, "professional_terms"):
            term_nodes[term].append(node)

    content = frontmatter(
        {
            "type": "glossary",
            "review_status": DEFAULT_REVIEW_STATUS,
            "created_at": created_at,
            "updated_at": created_at,
            "tags": ["legal-wiki", "glossary", "legal-terms"],
        }
    )
    content += "# Legal Terms\n\n"
    content += "| standard_term | category | related_domain | source_nodes | source_documents | confidence | review_status |\n"
    content += "| --- | --- | --- | --- | --- | --- | --- |\n"
    for term, term_related_nodes in sorted(term_nodes.items(), key=lambda item: (-len(item[1]), item[0].lower())):
        domains = Counter(str(node.get("legal_domain", "unknown")) for node in term_related_nodes)
        confidences = Counter(str(node.get("confidence", "low")) for node in term_related_nodes)
        docs = unique_preserve((str(node["doc_id"]) for node in term_related_nodes), limit=8)
        source_nodes = ", ".join(obsidian_link(*node_link(node)) for node in term_related_nodes[:8])
        source_docs = ", ".join(obsidian_link(*source_link(doc_id)) for doc_id in docs)
        category = "professional_term"
        content += (
            f"| {term} | {category} | {domains.most_common(1)[0][0]} | "
            f"{source_nodes} | {source_docs} | {confidences.most_common(1)[0][0]} | {DEFAULT_REVIEW_STATUS} |\n"
        )
    return content


def colloquial_mapping_page(created_at: str) -> str:
    content = frontmatter(
        {
            "type": "colloquial_mapping",
            "review_status": DEFAULT_REVIEW_STATUS,
            "created_at": created_at,
            "updated_at": created_at,
            "tags": ["legal-wiki", "glossary", "colloquial-mapping"],
        }
    )
    content += "# Colloquial Mapping\n\n"
    content += "| user_expression | standard_term |\n| --- | --- |\n"
    for expression, term in COLLOQUIAL_MAPPINGS:
        content += f"| {expression} | {obsidian_link(*concept_link(term))} |\n"
    return content


def synonym_table_page(created_at: str) -> str:
    content = frontmatter(
        {
            "type": "synonym_table",
            "review_status": DEFAULT_REVIEW_STATUS,
            "created_at": created_at,
            "updated_at": created_at,
            "tags": ["legal-wiki", "glossary", "synonyms"],
        }
    )
    content += "# Synonym Table\n\n"
    content += "| standard_term | synonyms |\n| --- | --- |\n"
    for term, synonyms in SYNONYM_GROUPS:
        content += f"| {obsidian_link(*concept_link(term))} | {' / '.join(synonyms)} |\n"
    return content


def index_page(
    nodes: list[dict[str, Any]],
    source_doc_ids: list[str],
    concept_terms: list[str],
    domains: list[str],
    created_at: str,
) -> str:
    content = frontmatter(
        {
            "type": "index",
            "review_status": DEFAULT_REVIEW_STATUS,
            "created_at": created_at,
            "updated_at": created_at,
            "tags": ["legal-wiki", "index"],
        }
    )
    content += "# LLM Wiki Index\n\n"
    content += f"Last updated: {created_at}\n\n"
    content += "## Source Pages\n\n" + md_link_list(source_link(doc_id) for doc_id in source_doc_ids)
    content += "\n## Main Legal Domains\n\n" + md_link_list((f"laws/{domain_slug(domain)}", domain) for domain in domains)
    content += "\n## Core Concepts\n\n" + md_link_list(concept_link(term) for term in concept_terms[:40])
    content += "\n## Core Issues\n\n" + md_link_list((f"issues/{issue_id}", issue["title"]) for issue_id, issue in ISSUE_DEFINITIONS.items())
    content += "\n## Glossary\n\n"
    content += md_link_list(
        [
            ("glossary/legal_terms", "Legal Terms"),
            ("glossary/colloquial_mapping", "Colloquial Mapping"),
            ("glossary/synonym_table", "Synonym Table"),
        ]
    )
    content += "\n## Structured Nodes\n\n"
    content += f"- Total structured nodes: {len(nodes)}\n"
    content += f"- Entry folder: [[structured_nodes]]\n"
    return content


def log_page(
    nodes: list[dict[str, Any]],
    source_doc_ids: list[str],
    page_counts: dict[str, int],
    created_at: str,
) -> str:
    content = frontmatter(
        {
            "type": "build_log",
            "review_status": DEFAULT_REVIEW_STATUS,
            "created_at": created_at,
            "updated_at": created_at,
            "tags": ["legal-wiki", "build-log"],
        }
    )
    content += "# Wiki Build Log\n\n"
    content += f"- Build time: {created_at}\n"
    content += f"- Documents processed: {len(source_doc_ids)}\n"
    content += f"- AST nodes used: {len(nodes)}\n"
    content += "- Source documents:\n"
    for doc_id in source_doc_ids:
        content += f"  - {obsidian_link(*source_link(doc_id))}\n"
    content += "\n## Created Pages\n\n"
    for page_type, count in page_counts.items():
        content += f"- {page_type}: {count}\n"
    content += "\n## Needs Human Review\n\n"
    content += "- All generated Wiki pages have `review_status: pending`.\n"
    content += "- Check machine-generated summaries before relying on them.\n"
    content += "- Review low-confidence AST nodes and table-of-contents-derived nodes.\n"
    return content


def wiki_build_report(page_counts: dict[str, int], nodes: list[dict[str, Any]], created_at: str) -> str:
    low_confidence = sum(1 for node in nodes if str(node.get("confidence")) == "low")
    pending = sum(1 for node in nodes if str(node.get("review_status")) == DEFAULT_REVIEW_STATUS)
    content = "# Wiki Build Report\n\n"
    content += f"Generated at: {created_at}\n\n"
    content += "## Page Counts\n\n"
    for page_type, count in page_counts.items():
        content += f"- {page_type}: {count}\n"
    content += "\n## Source AST Summary\n\n"
    content += f"- AST nodes used: {len(nodes)}\n"
    content += f"- Pending-review nodes: {pending}\n"
    content += f"- Low-confidence nodes: {low_confidence}\n"
    content += "\n## Review Notes\n\n"
    content += "- Wiki pages preserve source node and source document links.\n"
    content += "- Generated summaries are evidence indexes and should not be treated as final legal advice.\n"
    content += "- Concept and issue pages are navigation layers over AST nodes.\n"
    return content


def select_concepts(nodes: list[dict[str, Any]]) -> list[str]:
    terms = [term for term, _ in term_counter(nodes).most_common(50)]
    combined = unique_preserve(CORE_CONCEPTS + terms)
    return combined[:60]


def build_wiki(
    *,
    ast_path: Path = PROCESSED_AST_NODES_DIR / "ast_nodes.json",
    wiki_dir: Path = WIKI_DIR,
    report_path: Path = OUTPUT_REPORTS_DIR / "wiki_build_report.md",
    log=print,
) -> dict[str, int]:
    ensure_wiki_dirs()
    nodes = load_ast_nodes(ast_path)
    created_at = datetime.now(timezone.utc).isoformat()

    log("Starting LLM Wiki build")
    log(f"AST nodes loaded: {len(nodes)}")

    nodes_by_doc = group_nodes_by_doc(nodes)
    source_doc_ids = sorted(nodes_by_doc)
    concepts = select_concepts(nodes)
    domains = [domain for domain, _ in Counter(str(node.get("legal_domain", "unknown")) for node in nodes).most_common() if domain != "unknown"]
    if "unknown" in {str(node.get("legal_domain", "unknown")) for node in nodes}:
        domains.append("unknown")

    page_counts: dict[str, int] = {}

    for doc_id, doc_nodes in nodes_by_doc.items():
        write_markdown(WIKI_SOURCES_DIR / f"{slugify_filename(doc_id)}.md", source_page(doc_id, doc_nodes, created_at))
    page_counts["sources"] = len(nodes_by_doc)

    for node in nodes:
        write_markdown(WIKI_STRUCTURED_NODES_DIR / f"{slugify_filename(str(node['node_id']))}.md", structured_node_page(node, created_at))
    page_counts["structured_nodes"] = len(nodes)

    for domain in domains:
        write_markdown(WIKI_LAWS_DIR / f"{domain_slug(domain)}.md", law_page(domain, nodes, created_at))
    page_counts["laws"] = len(domains)

    for concept in concepts:
        write_markdown(WIKI_CONCEPTS_DIR / f"{concept_slug(concept)}.md", concept_page(concept, nodes, created_at))
    page_counts["concepts"] = len(concepts)

    for issue_id, issue in ISSUE_DEFINITIONS.items():
        write_markdown(WIKI_ISSUES_DIR / f"{issue_id}.md", issue_page(issue_id, issue, nodes, created_at))
    page_counts["issues"] = len(ISSUE_DEFINITIONS)

    write_markdown(WIKI_GLOSSARY_DIR / "legal_terms.md", legal_terms_page(nodes, created_at))
    write_markdown(WIKI_GLOSSARY_DIR / "colloquial_mapping.md", colloquial_mapping_page(created_at))
    write_markdown(WIKI_GLOSSARY_DIR / "synonym_table.md", synonym_table_page(created_at))
    page_counts["glossary"] = 3

    write_markdown(wiki_dir / "index.md", index_page(nodes, source_doc_ids, concepts, domains, created_at))
    write_markdown(wiki_dir / "log.md", log_page(nodes, source_doc_ids, page_counts, created_at))
    page_counts["index_and_log"] = 2

    report_path.parent.mkdir(parents=True, exist_ok=True)
    backup_existing_file(report_path)
    report_path.write_text(wiki_build_report(page_counts, nodes, created_at), encoding="utf-8-sig")

    log(f"Wiki index saved: {wiki_dir / 'index.md'}")
    log(f"Wiki build report saved: {report_path}")
    log(f"Wiki build complete: total_pages={sum(page_counts.values())}")
    return page_counts
