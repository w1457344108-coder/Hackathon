"""Rule-based and optional LLM-assisted AST-like legal node parsing."""

from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from config import (
    DEFAULT_REVIEW_STATUS,
    DEEPSEEK_API_KEY,
    OPENAI_API_KEY,
    OUTPUT_REPORTS_DIR,
    PROCESSED_AST_NODES_BY_DOC_DIR,
    PROCESSED_AST_NODES_DIR,
    PROCESSED_CHUNKS_DIR,
    USE_LLM,
)
from modules.chunker import backup_existing_file


@dataclass
class LegalAstNode:
    node_id: str
    doc_id: str
    chunk_id: str
    source_file: str
    original_text: str
    jurisdiction: str
    document_type: str
    legal_domain: str
    legal_subjects: list[str]
    legal_actions: list[str]
    legal_objects: list[str]
    conditions: list[str]
    obligations: list[str]
    rights: list[str]
    prohibitions: list[str]
    legal_consequences: list[str]
    exceptions: list[str]
    definitions: list[str]
    professional_terms: list[str]
    related_terms: list[str]
    possible_user_questions: list[str]
    source_evidence: list[str]
    confidence: str
    review_status: str
    notes: list[str]


DOMAIN_KEYWORDS = {
    "data protection": [
        "personal data",
        "data protection",
        "consent",
        "disclose",
        "disclosure",
        "transfer",
        "organisation",
        "individual",
        "data subject",
        "data controller",
        "个人信息",
        "个人数据",
        "同意",
        "处理个人信息",
    ],
    "cybersecurity": [
        "cybersecurity",
        "cyber security",
        "network security",
        "critical information infrastructure",
        "网络安全",
        "关键信息基础设施",
        "网络运营者",
    ],
    "AI governance": [
        "artificial intelligence",
        " ai ",
        "algorithm",
        "automated decision",
        "算法",
        "人工智能",
        "自动化决策",
    ],
    "electronic transactions": [
        "electronic transaction",
        "electronic record",
        "electronic signature",
        "digital signature",
        "电子交易",
        "电子记录",
        "电子签名",
    ],
    "consumer protection": [
        "consumer",
        "customer",
        "unfair practice",
        "ride-hailing",
        "platform",
        "消费者",
        "用户权益",
        "网络预约出租汽车",
    ],
    "digital governance": [
        "digital service",
        "digital economy",
        "platform",
        "online service",
        "internet",
        "信息化",
        "数字",
        "平台",
        "互联网",
    ],
}

SUBJECT_KEYWORDS = {
    "organisation": [r"\borganisation\b", r"\borganization\b", "组织"],
    "individual": [r"\bindividual\b", "个人"],
    "authority": [r"\bauthority\b", r"\bcommission\b", r"\bregistrar\b", "主管部门", "管理部门"],
    "business": [r"\bbusiness\b", r"\bcompany\b", r"\bcorporation\b", "企业", "公司", "经营者"],
    "data controller": [r"\bdata controller\b", "个人信息处理者"],
    "data subject": [r"\bdata subject\b", "个人信息主体"],
    "network operator": [r"\bnetwork operator\b", "网络运营者"],
}

ACTION_KEYWORDS = {
    "collect data": [r"\bcollect(?:ion|s|ed|ing)?\b", "收集"],
    "process data": [r"\bprocess(?:es|ed|ing)?\b", "处理"],
    "disclose data": [r"\bdisclos(?:e|es|ed|ing|ure)\b", "披露", "公开"],
    "transfer data": [r"\btransfer(?:s|red|ring)?\b", "转移", "传输", "跨境"],
    "obtain consent": [r"\bconsent\b", "同意"],
    "comply with obligation": [r"\bcomply\b", r"\bcompliance\b", "履行", "遵守"],
    "notify": [r"\bnotif(?:y|ies|ied|ication)\b", "告知", "通知"],
    "retain records": [r"\bretain\b", r"\brecords?\b", "保存", "记录"],
}

OBJECT_KEYWORDS = {
    "personal data": [r"\bpersonal data\b", "个人信息", "个人数据"],
    "electronic record": [r"\belectronic record\b", "电子记录"],
    "digital service": [r"\bdigital service\b", "数字服务"],
    "AI system": [r"\bAI system\b", r"\bartificial intelligence system\b", "人工智能系统"],
    "network data": [r"\bnetwork data\b", "网络数据"],
    "electronic signature": [r"\belectronic signature\b", r"\bdigital signature\b", "电子签名"],
}

PROFESSIONAL_TERM_KEYWORDS = [
    "personal data",
    "data protection",
    "consent",
    "disclosure",
    "transfer",
    "organisation",
    "individual",
    "data subject",
    "data controller",
    "electronic record",
    "electronic signature",
    "digital signature",
    "cybersecurity",
    "critical information infrastructure",
    "network operator",
    "automated decision",
    "financial penalty",
    "offence",
    "liability",
    "enforcement",
    "个人信息",
    "个人信息处理者",
    "个人信息主体",
    "网络安全",
    "关键信息基础设施",
    "网络运营者",
    "自动化决策",
    "电子签名",
    "法律责任",
    "行政处罚",
]

RELATED_TERMS = {
    "personal data": ["personal information", "data subject information", "个人信息"],
    "consent": ["authorisation", "permission", "同意"],
    "organisation": ["organization", "business", "company"],
    "individual": ["person", "data subject", "自然人"],
    "cybersecurity": ["network security", "网络安全"],
    "electronic record": ["digital record", "电子记录"],
    "个人信息": ["personal data", "personal information"],
    "网络安全": ["cybersecurity", "network security"],
}


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def split_sentences(text: str) -> list[str]:
    compact = re.sub(r"\s+", " ", text).strip()
    if not compact:
        return []
    parts = re.split(r"(?<=[.;?!。！？])\s+|(?<=；)\s*", compact)
    return [part.strip() for part in parts if part.strip()]


def match_any(text: str, patterns: Iterable[str]) -> bool:
    return any(re.search(pattern, text, flags=re.I) for pattern in patterns)


def collect_keyword_matches(text: str, keyword_map: dict[str, list[str]]) -> list[str]:
    matches: list[str] = []
    for label, patterns in keyword_map.items():
        if match_any(text, patterns):
            matches.append(label)
    return matches


def infer_jurisdiction(text: str, source_file: str) -> tuple[str, str | None]:
    haystack = f"{source_file}\n{text}"
    if re.search(r"中华人民共和国|个人信息保护法|网络安全法|China|Chinese", haystack, flags=re.I):
        return "China", None
    if re.search(r"Singapore|Singapore Statutes|Personal Data Protection Act|Companies Act", haystack, flags=re.I):
        return "Singapore", None
    return "Singapore", "Jurisdiction defaulted to Singapore because no stronger local rule matched."


def infer_document_type(text: str, source_file: str) -> str:
    haystack = f"{source_file}\n{text[:800]}"
    if re.search(r"\b(act|law)\b|法\b", haystack, flags=re.I):
        return "law"
    if re.search(r"\b(regulation|regulations|rules)\b|条例|办法|规定", haystack, flags=re.I):
        return "regulation"
    if re.search(r"\b(policy|policies)\b|政策", haystack, flags=re.I):
        return "policy"
    if re.search(r"\b(guideline|guidelines|guide)\b|指南|指引", haystack, flags=re.I):
        return "guideline"
    if re.search(r"\b(report|study|white paper)\b|报告|研究", haystack, flags=re.I):
        return "report"
    return "unknown"


def infer_legal_domain(text: str) -> str:
    lower_text = f" {text.lower()} "
    scores = {
        domain: sum(1 for keyword in keywords if keyword.lower() in lower_text)
        for domain, keywords in DOMAIN_KEYWORDS.items()
    }
    best_domain, best_score = max(scores.items(), key=lambda item: item[1])
    return best_domain if best_score > 0 else "unknown"


def find_sentences(text: str, patterns: list[str], limit: int = 6) -> list[str]:
    results: list[str] = []
    for sentence in split_sentences(text):
        if match_any(sentence, patterns):
            normalized = normalize_text(sentence)
            if normalized and normalized not in results:
                results.append(normalized[:500])
        if len(results) >= limit:
            break
    return results


def extract_definitions(text: str) -> list[str]:
    sentences = split_sentences(text)
    definitions: list[str] = []
    patterns = [
        r"\b.{1,120}?\bmeans\b.{1,350}",
        r"\b.{1,120}?\brefers to\b.{1,350}",
        r"\b.{1,120}?\bis defined as\b.{1,350}",
        r"“[^”]{1,80}”\s*(是指|指)\s*[^。；]{1,260}",
        r"[\u4e00-\u9fffA-Za-z0-9（）()]{1,40}\s*(是指|指)\s*[^。；]{1,260}",
    ]
    for sentence in sentences:
        if match_any(sentence, patterns):
            normalized = normalize_text(sentence)
            if normalized not in definitions:
                definitions.append(normalized[:500])
    return definitions[:8]


def extract_conditions(text: str) -> list[str]:
    return find_sentences(
        text,
        [
            r"\b(if|where|when|unless|provided that|subject to|in the event)\b",
            r"如果|若|在.*情况下|除非|条件|前提|按照|依照",
        ],
    )


def extract_obligations(text: str) -> list[str]:
    return find_sentences(
        text,
        [
            r"\b(shall|must|is required to|are required to|should|has a duty to|duty to)\b",
            r"应当|必须|应该|需要|负有.*义务|履行",
        ],
    )


def extract_prohibitions(text: str) -> list[str]:
    return find_sentences(
        text,
        [
            r"\b(shall not|must not|may not|prohibited|forbidden|no person shall|not permitted)\b",
            r"不得|禁止|不予|不得.*处理|不得.*收集",
        ],
    )


def extract_rights(text: str) -> list[str]:
    return find_sentences(
        text,
        [
            r"\b(right to|entitled to|may request|may apply|has the right)\b",
            r"有权|权利|可以.*请求|可以.*申请|依法享有",
        ],
    )


def extract_legal_consequences(text: str) -> list[str]:
    return find_sentences(
        text,
        [
            r"\b(penalty|fine|offence|liability|enforcement|sanction|guilty|conviction|contravention)\b",
            r"罚款|处罚|法律责任|责任|违法|犯罪|处分|追究",
        ],
    )


def extract_exceptions(text: str) -> list[str]:
    return find_sentences(
        text,
        [
            r"\b(except|exception|unless|exempt|exemption|does not apply|not apply)\b",
            r"除外|例外|但是|但|不适用|豁免",
        ],
    )


def extract_professional_terms(text: str, definitions: list[str]) -> list[str]:
    lower_text = text.lower()
    terms: list[str] = []
    for keyword in PROFESSIONAL_TERM_KEYWORDS:
        if keyword.lower() in lower_text and keyword not in terms:
            terms.append(keyword)

    for definition in definitions:
        quoted = re.search(r"[“\"]([^”\"]{2,80})[”\"]\s*(?:,?\s*[^,.;。；]{0,120})?\s+(?:means|refers to|is defined as)\b", definition, flags=re.I)
        chinese_quoted = re.search(r"“([^”]{2,80})”\s*(?:是指|指)", definition)
        plain = re.match(r"([A-Za-z][A-Za-z0-9 \-]{2,60})\s+(?:means|refers to|is defined as)\b", definition, flags=re.I)

        term = ""
        if quoted:
            term = normalize_text(quoted.group(1))
        elif chinese_quoted:
            term = normalize_text(chinese_quoted.group(1))
        elif plain:
            candidate = normalize_text(plain.group(1)).strip(" ,;:，；：“”\"'")
            stop_prefixes = ("in this", "by ", "where ", "when ", "if ", "for ", "such ", "the ")
            if len(candidate.split()) <= 6 and not candidate.lower().startswith(stop_prefixes):
                term = candidate

        if 1 < len(term) <= 80 and term not in terms:
            terms.append(term)

    return terms[:12]


def build_related_terms(professional_terms: list[str]) -> list[str]:
    related: list[str] = []
    for term in professional_terms:
        for value in RELATED_TERMS.get(term, []):
            if value not in related:
                related.append(value)
    return related[:20]


def build_possible_questions(
    *,
    legal_subjects: list[str],
    legal_actions: list[str],
    legal_objects: list[str],
    professional_terms: list[str],
    legal_domain: str,
) -> list[str]:
    questions: list[str] = []
    if legal_subjects and legal_actions:
        questions.append(f"What must {legal_subjects[0]} do about {legal_actions[0]}?")
    if legal_objects:
        questions.append(f"What does this document say about {legal_objects[0]}?")
    if professional_terms:
        questions.append(f"What does {professional_terms[0]} mean in this source?")
    if legal_domain != "unknown":
        questions.append(f"Which {legal_domain} obligations or risks appear here?")
    return questions[:5]


def build_source_evidence(text: str, extracted_groups: Iterable[Iterable[str]]) -> list[str]:
    evidence: list[str] = []
    for group in extracted_groups:
        for item in group:
            normalized = normalize_text(item)
            if normalized and normalized not in evidence:
                evidence.append(normalized[:500])
            if len(evidence) >= 8:
                return evidence

    for sentence in split_sentences(text)[:2]:
        normalized = normalize_text(sentence)
        if normalized and normalized not in evidence:
            evidence.append(normalized[:500])
    return evidence[:8]


def infer_confidence(
    *,
    legal_domain: str,
    document_type: str,
    legal_subjects: list[str],
    legal_actions: list[str],
    legal_objects: list[str],
    rule_groups: list[list[str]],
) -> str:
    signal_count = sum(1 for group in rule_groups if group)
    if legal_domain != "unknown":
        signal_count += 1
    if document_type != "unknown":
        signal_count += 1
    if legal_subjects:
        signal_count += 1
    if legal_actions:
        signal_count += 1
    if legal_objects:
        signal_count += 1

    if signal_count >= 5:
        return "high"
    if signal_count >= 3:
        return "medium"
    return "low"


def parse_chunk_to_node(chunk: dict[str, str], use_llm: bool = USE_LLM) -> LegalAstNode:
    chunk_id = str(chunk.get("chunk_id", ""))
    doc_id = str(chunk.get("doc_id", ""))
    source_file = str(chunk.get("source_file", ""))
    original_text = str(chunk.get("chunk_text", ""))
    notes: list[str] = []

    jurisdiction, jurisdiction_note = infer_jurisdiction(original_text, source_file)
    if jurisdiction_note:
        notes.append(jurisdiction_note)

    document_type = infer_document_type(original_text, source_file)
    legal_domain = infer_legal_domain(original_text)
    legal_subjects = collect_keyword_matches(original_text, SUBJECT_KEYWORDS)
    legal_actions = collect_keyword_matches(original_text, ACTION_KEYWORDS)
    legal_objects = collect_keyword_matches(original_text, OBJECT_KEYWORDS)

    definitions = extract_definitions(original_text)
    conditions = extract_conditions(original_text)
    obligations = extract_obligations(original_text)
    rights = extract_rights(original_text)
    prohibitions = extract_prohibitions(original_text)
    legal_consequences = extract_legal_consequences(original_text)
    exceptions = extract_exceptions(original_text)
    professional_terms = extract_professional_terms(original_text, definitions)
    related_terms = build_related_terms(professional_terms)
    possible_user_questions = build_possible_questions(
        legal_subjects=legal_subjects,
        legal_actions=legal_actions,
        legal_objects=legal_objects,
        professional_terms=professional_terms,
        legal_domain=legal_domain,
    )

    rule_groups = [
        definitions,
        conditions,
        obligations,
        rights,
        prohibitions,
        legal_consequences,
        exceptions,
        professional_terms,
    ]
    confidence = infer_confidence(
        legal_domain=legal_domain,
        document_type=document_type,
        legal_subjects=legal_subjects,
        legal_actions=legal_actions,
        legal_objects=legal_objects,
        rule_groups=rule_groups,
    )

    if confidence == "low":
        notes.append("No strong rule signal was detected; human review is required.")
    if use_llm:
        if OPENAI_API_KEY or DEEPSEEK_API_KEY:
            notes.append("LLM parsing interface is reserved; current node uses local rule extraction.")
        else:
            notes.append("USE_LLM=True but no API key is configured; local rule extraction was used.")

    source_evidence = build_source_evidence(
        original_text,
        [
            definitions,
            prohibitions,
            obligations,
            rights,
            conditions,
            legal_consequences,
            exceptions,
        ],
    )

    return LegalAstNode(
        node_id=f"{chunk_id}_ast",
        doc_id=doc_id,
        chunk_id=chunk_id,
        source_file=source_file,
        original_text=original_text,
        jurisdiction=jurisdiction,
        document_type=document_type,
        legal_domain=legal_domain,
        legal_subjects=legal_subjects,
        legal_actions=legal_actions,
        legal_objects=legal_objects,
        conditions=conditions,
        obligations=obligations,
        rights=rights,
        prohibitions=prohibitions,
        legal_consequences=legal_consequences,
        exceptions=exceptions,
        definitions=definitions,
        professional_terms=professional_terms,
        related_terms=related_terms,
        possible_user_questions=possible_user_questions,
        source_evidence=source_evidence,
        confidence=confidence,
        review_status=DEFAULT_REVIEW_STATUS,
        notes=notes,
    )


def load_chunks(chunks_path: Path = PROCESSED_CHUNKS_DIR / "document_chunks.csv") -> list[dict[str, str]]:
    if not chunks_path.exists():
        raise FileNotFoundError(f"Missing chunk file: {chunks_path}")
    with chunks_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        return list(csv.DictReader(csv_file))


def node_to_csv_record(node: LegalAstNode) -> dict[str, str]:
    record = asdict(node)
    for key, value in record.items():
        if isinstance(value, list):
            record[key] = json.dumps(value, ensure_ascii=False)
    return record


def write_ast_nodes(nodes: list[LegalAstNode], output_dir: Path = PROCESSED_AST_NODES_DIR) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    PROCESSED_AST_NODES_BY_DOC_DIR.mkdir(parents=True, exist_ok=True)

    json_path = output_dir / "ast_nodes.json"
    csv_path = output_dir / "ast_nodes.csv"
    backup_existing_file(json_path)
    backup_existing_file(csv_path)

    records = [asdict(node) for node in nodes]
    json_path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")

    fieldnames = list(asdict(nodes[0]).keys()) if nodes else list(LegalAstNode.__dataclass_fields__.keys())
    with csv_path.open("w", encoding="utf-8-sig", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(node_to_csv_record(node) for node in nodes)

    backup_by_doc_outputs(PROCESSED_AST_NODES_BY_DOC_DIR)

    by_doc: dict[str, list[dict[str, object]]] = defaultdict(list)
    for record in records:
        by_doc[str(record["doc_id"])].append(record)

    for doc_id, doc_records in by_doc.items():
        doc_path = PROCESSED_AST_NODES_BY_DOC_DIR / f"{doc_id}.json"
        doc_path.write_text(json.dumps(doc_records, ensure_ascii=False, indent=2), encoding="utf-8")


def backup_by_doc_outputs(by_doc_dir: Path) -> Path | None:
    current_json_files = [path for path in by_doc_dir.glob("*.json") if path.is_file()]
    if not current_json_files:
        return None

    backup_dir = by_doc_dir / "_backups" / datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir.mkdir(parents=True, exist_ok=True)
    for path in current_json_files:
        path.replace(backup_dir / path.name)
    return backup_dir


def generate_ast_report(
    nodes: list[LegalAstNode],
    report_path: Path = OUTPUT_REPORTS_DIR / "ast_parsing_report.md",
) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    backup_existing_file(report_path)

    by_doc = Counter(node.doc_id for node in nodes)
    domains = Counter(node.legal_domain for node in nodes)
    terms = Counter(term for node in nodes for term in node.professional_terms)
    low_confidence_nodes = [node for node in nodes if node.confidence == "low"]

    lines = [
        "# AST Parsing Report",
        "",
        f"Generated at: {datetime.now(timezone.utc).isoformat()}",
        f"Total AST nodes: {len(nodes)}",
        "",
        "## Nodes by Document",
        "",
        "| doc_id | nodes |",
        "| --- | ---: |",
    ]
    lines.extend(f"| {doc_id} | {count} |" for doc_id, count in by_doc.most_common())

    lines.extend(["", "## Legal Domain Distribution", "", "| legal_domain | nodes |", "| --- | ---: |"])
    lines.extend(f"| {domain} | {count} |" for domain, count in domains.most_common())

    lines.extend(["", "## Professional Terms Top 30", "", "| term | count |", "| --- | ---: |"])
    lines.extend(f"| {term} | {count} |" for term, count in terms.most_common(30))

    lines.extend(["", "## Low Confidence Nodes", ""])
    if low_confidence_nodes:
        lines.append("| node_id | source_file | reason |")
        lines.append("| --- | --- | --- |")
        for node in low_confidence_nodes[:80]:
            reason = "; ".join(node.notes) if node.notes else "Low rule signal."
            lines.append(f"| {node.node_id} | {node.source_file} | {reason} |")
        if len(low_confidence_nodes) > 80:
            lines.append(f"| ... | ... | {len(low_confidence_nodes) - 80} additional low-confidence nodes omitted from this report. |")
    else:
        lines.append("- No low-confidence nodes detected.")

    lines.extend(
        [
            "",
            "## Issues Requiring Human Review",
            "",
            "- Confirm whether each inferred jurisdiction is correct, especially where the parser defaulted to Singapore.",
            "- Review short table-of-contents chunks and page-header chunks before treating them as legal rules.",
            "- Validate extracted obligations and prohibitions against the exact source text.",
            "- Check Chinese source filenames and Chinese legal terms in downstream tools that are not UTF-8 aware.",
            "- Merge or split nodes if a chunk contains multiple unrelated provisions.",
            "",
            "## Current Rule Parser Limitations",
            "",
            "- The parser uses keywords and regular expressions only; it does not perform legal reasoning.",
            "- It may classify table-of-contents entries as legal sections because they contain section-like numbering.",
            "- It cannot reliably distinguish binding obligations from explanatory summaries without human review.",
            "- It does not infer legal conclusions beyond evidence present in `original_text`.",
            "- LLM-assisted parsing is only reserved as an optional interface; local rule output remains the source of this report.",
        ]
    )

    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8-sig")


def parse_chunks_to_ast(
    *,
    chunks_path: Path = PROCESSED_CHUNKS_DIR / "document_chunks.csv",
    output_dir: Path = PROCESSED_AST_NODES_DIR,
    report_path: Path = OUTPUT_REPORTS_DIR / "ast_parsing_report.md",
    use_llm: bool = USE_LLM,
    log=print,
) -> list[LegalAstNode]:
    chunks = load_chunks(chunks_path)
    nodes: list[LegalAstNode] = []

    log("Starting AST-like legal structure parsing")
    log(f"Chunks loaded: {len(chunks)}")
    log(f"USE_LLM={use_llm}; parser mode={'reserved LLM interface + local fallback' if use_llm else 'local rules'}")

    for index, chunk in enumerate(chunks, start=1):
        nodes.append(parse_chunk_to_node(chunk, use_llm=use_llm))
        if index % 250 == 0:
            log(f"Parsed AST nodes: {index}/{len(chunks)}")

    write_ast_nodes(nodes, output_dir)
    generate_ast_report(nodes, report_path)

    log(f"AST JSON saved: {output_dir / 'ast_nodes.json'}")
    log(f"AST CSV saved: {output_dir / 'ast_nodes.csv'}")
    log(f"AST by-doc JSON saved in: {PROCESSED_AST_NODES_BY_DOC_DIR}")
    log(f"AST parsing report saved: {report_path}")
    log(f"AST parsing complete: total_nodes={len(nodes)}")
    return nodes
