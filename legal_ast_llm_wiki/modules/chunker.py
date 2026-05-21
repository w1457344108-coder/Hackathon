"""Chunking helpers for source-aligned text segments."""

from __future__ import annotations

import csv
import json
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean
from typing import Iterable

from config import (
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    OUTPUT_REPORTS_DIR,
    PROCESSED_CHUNKS_DIR,
    PROCESSED_METADATA_DIR,
    PROJECT_ROOT,
)


TARGET_MIN_CHARS = 800
TARGET_MAX_CHARS = 1500


@dataclass
class TextBlock:
    text: str
    start_char: int
    end_char: int
    heading_guess: str
    possible_legal_section: bool


@dataclass
class DocumentChunk:
    chunk_id: str
    doc_id: str
    source_file: str
    chunk_index: int
    heading_guess: str
    chunk_text: str
    start_char: int
    end_char: int
    char_count: int
    possible_legal_section: bool
    created_at: str


LEGAL_SECTION_PATTERNS = [
    re.compile(r"^(part|chapter|division|section|article|regulation|rule|schedule)\s+[\w\dIVXLCDM]+", re.I),
    re.compile(r"^\d+[A-Z]?\s*[.\-—–]+\s*(\(\d+\))?\s*\S+"),
    re.compile(r"^\d+[A-Z]?\.\s+\S+"),
    re.compile(r"^\([0-9a-zA-Z]+\)\s+\S+"),
    re.compile(r"^[a-zA-Z]\)\s+\S+"),
    re.compile(r"^第[一二三四五六七八九十百千万零〇\d]+[章节条款编]\s*\S*"),
    re.compile(r"^[一二三四五六七八九十]+、\s*\S+"),
    re.compile(r"^（[一二三四五六七八九十\d]+）\s*\S+"),
    re.compile(r"^\([一二三四五六七八九十\d]+\)\s*\S+"),
    re.compile(r"^(总则|附则|罚则|解释|定义)$"),
]


def is_possible_legal_section(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    return any(pattern.search(stripped) for pattern in LEGAL_SECTION_PATTERNS)


def guess_heading(block_text: str) -> str:
    lines = [line.strip() for line in block_text.splitlines() if line.strip()]
    if not lines:
        return ""

    for line in lines[:4]:
        if is_possible_legal_section(line):
            return line[:160]

    first_line = lines[0]
    if len(first_line) <= 120 and (
        first_line.isupper()
        or re.search(r"^(PART|CHAPTER|DIVISION|SCHEDULE)\b", first_line, re.I)
        or re.search(r"^第[一二三四五六七八九十百千万零〇\d]+[章节编]", first_line)
    ):
        return first_line[:160]

    return first_line[:160]


def extract_text_blocks(text: str) -> list[TextBlock]:
    blocks: list[TextBlock] = []

    for match in re.finditer(r"\S[\s\S]*?(?=\n\s*\n|\Z)", text):
        raw = match.group(0)
        leading = len(raw) - len(raw.lstrip())
        trailing_text = raw.rstrip()
        if not trailing_text:
            continue

        start = match.start() + leading
        end = match.start() + len(trailing_text)
        block_text = text[start:end]
        heading = guess_heading(block_text)
        possible_section = any(
            is_possible_legal_section(line) for line in block_text.splitlines()[:4]
        )

        blocks.append(
            TextBlock(
                text=block_text,
                start_char=start,
                end_char=end,
                heading_guess=heading,
                possible_legal_section=possible_section,
            )
        )

    return blocks


def adjust_segment_bounds(full_text: str, start_char: int, end_char: int) -> tuple[str, int, int]:
    segment = full_text[start_char:end_char]
    leading = len(segment) - len(segment.lstrip())
    trailing_length = len(segment.rstrip())
    adjusted_start = start_char + leading
    adjusted_end = start_char + trailing_length
    return full_text[adjusted_start:adjusted_end], adjusted_start, adjusted_end


def make_chunk(
    *,
    full_text: str,
    doc_id: str,
    source_file: str,
    chunk_index: int,
    start_char: int,
    end_char: int,
    heading_guess: str,
    possible_legal_section: bool,
    created_at: str,
) -> DocumentChunk:
    chunk_text, adjusted_start, adjusted_end = adjust_segment_bounds(full_text, start_char, end_char)
    return DocumentChunk(
        chunk_id=f"{doc_id}_chunk_{chunk_index:04d}",
        doc_id=doc_id,
        source_file=source_file,
        chunk_index=chunk_index,
        heading_guess=heading_guess,
        chunk_text=chunk_text,
        start_char=adjusted_start,
        end_char=adjusted_end,
        char_count=len(chunk_text),
        possible_legal_section=possible_legal_section,
        created_at=created_at,
    )


def choose_breakpoint(text: str, start_char: int, hard_end: int, minimum_end: int) -> int:
    window = text[start_char:hard_end]
    candidates = [
        window.rfind("\n\n"),
        window.rfind("\n"),
        window.rfind(". "),
        window.rfind("。"),
        window.rfind("; "),
        window.rfind("；"),
    ]
    valid = [start_char + item + 1 for item in candidates if item >= 0 and start_char + item + 1 >= minimum_end]
    if valid:
        return max(valid)
    return hard_end


def split_long_block(
    *,
    full_text: str,
    block: TextBlock,
    doc_id: str,
    source_file: str,
    next_chunk_index: int,
    target_max_chars: int,
    overlap_chars: int,
    created_at: str,
) -> list[DocumentChunk]:
    chunks: list[DocumentChunk] = []
    position = block.start_char

    while position < block.end_char:
        hard_end = min(block.end_char, position + target_max_chars)
        minimum_end = min(block.end_char, position + max(200, target_max_chars // 2))
        segment_end = hard_end if hard_end == block.end_char else choose_breakpoint(full_text, position, hard_end, minimum_end)
        segment_start = position if not chunks else max(block.start_char, position - overlap_chars)

        chunks.append(
            make_chunk(
                full_text=full_text,
                doc_id=doc_id,
                source_file=source_file,
                chunk_index=next_chunk_index + len(chunks),
                start_char=segment_start,
                end_char=segment_end,
                heading_guess=block.heading_guess,
                possible_legal_section=block.possible_legal_section,
                created_at=created_at,
            )
        )

        if segment_end <= position:
            break
        position = segment_end

    return chunks


def chunk_text(
    *,
    doc_id: str,
    source_file: str,
    text: str,
    target_min_chars: int = TARGET_MIN_CHARS,
    target_max_chars: int = TARGET_MAX_CHARS,
    overlap_chars: int = CHUNK_OVERLAP,
) -> list[DocumentChunk]:
    """Chunk one cleaned document using legal structure first, length fallback second."""

    if not text.strip():
        return []

    created_at = datetime.now(timezone.utc).isoformat()
    blocks = extract_text_blocks(text)
    if not blocks:
        blocks = [
            TextBlock(
                text=text.strip(),
                start_char=0,
                end_char=len(text),
                heading_guess=guess_heading(text),
                possible_legal_section=False,
            )
        ]

    chunks: list[DocumentChunk] = []
    current_blocks: list[TextBlock] = []

    def emit_current() -> None:
        nonlocal current_blocks
        if not current_blocks:
            return

        start_char = current_blocks[0].start_char
        end_char = current_blocks[-1].end_char
        if chunks and overlap_chars > 0:
            start_char = max(0, start_char - overlap_chars)

        heading = next((block.heading_guess for block in current_blocks if block.heading_guess), "")
        possible_section = any(block.possible_legal_section for block in current_blocks)
        chunks.append(
            make_chunk(
                full_text=text,
                doc_id=doc_id,
                source_file=source_file,
                chunk_index=len(chunks) + 1,
                start_char=start_char,
                end_char=end_char,
                heading_guess=heading,
                possible_legal_section=possible_section,
                created_at=created_at,
            )
        )
        current_blocks = []

    for block in blocks:
        if len(block.text) > target_max_chars:
            emit_current()
            long_chunks = split_long_block(
                full_text=text,
                block=block,
                doc_id=doc_id,
                source_file=source_file,
                next_chunk_index=len(chunks) + 1,
                target_max_chars=target_max_chars,
                overlap_chars=overlap_chars,
                created_at=created_at,
            )
            chunks.extend(long_chunks)
            continue

        if not current_blocks:
            current_blocks.append(block)
            continue

        candidate_length = block.end_char - current_blocks[0].start_char
        current_length = current_blocks[-1].end_char - current_blocks[0].start_char

        if candidate_length > target_max_chars:
            emit_current()
            current_blocks.append(block)
        else:
            current_blocks.append(block)

    emit_current()
    return chunks


def load_document_metadata(metadata_dir: Path = PROCESSED_METADATA_DIR) -> list[dict[str, str]]:
    metadata_path = metadata_dir / "documents_metadata.json"
    if not metadata_path.exists():
        raise FileNotFoundError(f"Missing metadata file: {metadata_path}")

    return json.loads(metadata_path.read_text(encoding="utf-8"))


def backup_existing_file(path: Path) -> Path | None:
    if not path.exists():
        return None

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = path.with_name(f"{path.stem}.{timestamp}.bak{path.suffix}")
    path.replace(backup_path)
    return backup_path


def write_chunks(chunks: Iterable[DocumentChunk], chunks_dir: Path = PROCESSED_CHUNKS_DIR) -> None:
    chunks_dir.mkdir(parents=True, exist_ok=True)
    records = [asdict(chunk) for chunk in chunks]
    json_path = chunks_dir / "document_chunks.json"
    csv_path = chunks_dir / "document_chunks.csv"

    backup_existing_file(json_path)
    backup_existing_file(csv_path)

    json_path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")

    fieldnames = [
        "chunk_id",
        "doc_id",
        "source_file",
        "chunk_index",
        "heading_guess",
        "chunk_text",
        "start_char",
        "end_char",
        "char_count",
        "possible_legal_section",
        "created_at",
    ]
    with csv_path.open("w", newline="", encoding="utf-8-sig") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)


def generate_chunking_quality_report(
    chunks: list[DocumentChunk],
    metadata_records: list[dict[str, str]],
    report_path: Path = OUTPUT_REPORTS_DIR / "chunking_quality_report.md",
) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    backup_existing_file(report_path)

    by_doc: dict[str, list[DocumentChunk]] = {}
    for chunk in chunks:
        by_doc.setdefault(chunk.doc_id, []).append(chunk)

    issues: list[str] = []
    if not chunks:
        issues.append("No chunks were generated.")

    short_chunks = [chunk for chunk in chunks if chunk.char_count < 400]
    long_chunks = [chunk for chunk in chunks if chunk.char_count > 1800]
    if short_chunks:
        issues.append(f"{len(short_chunks)} chunks are shorter than 400 characters; review whether they are headings or fragments.")
    if long_chunks:
        issues.append(f"{len(long_chunks)} chunks are longer than 1800 characters; review whether a provision should be split further.")

    lines = [
        "# Chunking Quality Report",
        "",
        f"Generated at: {datetime.now(timezone.utc).isoformat()}",
        f"Total documents in metadata: {len(metadata_records)}",
        f"Total chunks: {len(chunks)}",
        "",
        "## Per-Document Summary",
        "",
        "| doc_id | source_file | chunks | avg_length | min_length | max_length |",
        "| --- | --- | ---: | ---: | ---: | ---: |",
    ]

    for record in metadata_records:
        doc_id = str(record.get("doc_id", ""))
        doc_chunks = by_doc.get(doc_id, [])
        lengths = [chunk.char_count for chunk in doc_chunks]
        avg_length = round(mean(lengths), 1) if lengths else 0
        min_length = min(lengths) if lengths else 0
        max_length = max(lengths) if lengths else 0
        lines.append(
            f"| {doc_id} | {record.get('original_filename', '')} | {len(doc_chunks)} | {avg_length} | {min_length} | {max_length} |"
        )

    lines.extend(["", "## Possible Issues", ""])
    if issues:
        lines.extend(f"- {issue}" for issue in issues)
    else:
        lines.append("- No obvious chunk size issues detected.")

    lines.extend(
        [
            "",
            "## AST Parsing Recommendations",
            "",
            "- Use `heading_guess` and `possible_legal_section` as weak signals, not final legal labels.",
            "- Preserve `doc_id`, `chunk_id`, `start_char`, and `end_char` in every AST node for traceability.",
            "- Prefer extracting obligations, rights, prohibitions, definitions, exceptions, and consequences only when explicit evidence appears in `chunk_text`.",
            "- Keep all generated AST nodes at `review_status = pending` until human review.",
        ]
    )

    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8-sig")


def process_text_chunks(
    *,
    metadata_dir: Path = PROCESSED_METADATA_DIR,
    chunks_dir: Path = PROCESSED_CHUNKS_DIR,
    report_path: Path = OUTPUT_REPORTS_DIR / "chunking_quality_report.md",
    target_min_chars: int = TARGET_MIN_CHARS,
    target_max_chars: int = CHUNK_SIZE,
    overlap_chars: int = CHUNK_OVERLAP,
    log=print,
) -> list[DocumentChunk]:
    metadata_records = load_document_metadata(metadata_dir)
    chunks: list[DocumentChunk] = []

    log("开始文本切块")
    log(f"切块目标长度: {target_min_chars}-{target_max_chars} 字符, overlap={overlap_chars}")

    for record in metadata_records:
        if record.get("read_status") != "success":
            log(f"跳过读取失败文献: {record.get('original_filename')}")
            continue

        text_file_path = record.get("text_file_path", "")
        full_text_path = PROJECT_ROOT / text_file_path
        if not full_text_path.exists():
            log(f"跳过缺失文本文件: {text_file_path}")
            continue

        text = full_text_path.read_text(encoding="utf-8")
        doc_chunks = chunk_text(
            doc_id=str(record["doc_id"]),
            source_file=str(record["original_filename"]),
            text=text,
            target_min_chars=target_min_chars,
            target_max_chars=target_max_chars,
            overlap_chars=overlap_chars,
        )
        chunks.extend(doc_chunks)
        log(f"切块完成: {record['original_filename']} -> {len(doc_chunks)} chunks")

    write_chunks(chunks, chunks_dir)
    generate_chunking_quality_report(chunks, metadata_records, report_path)
    log(f"chunk CSV 已保存: {chunks_dir / 'document_chunks.csv'}")
    log(f"chunk JSON 已保存: {chunks_dir / 'document_chunks.json'}")
    log(f"切块质量报告已保存: {report_path}")
    log(f"文本切块完成: total_chunks={len(chunks)}")

    return chunks
