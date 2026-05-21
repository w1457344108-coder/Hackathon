"""Text normalization helpers for extracted legal and policy documents."""

from __future__ import annotations

import re


def clean_text(text: str) -> str:
    """Apply conservative text cleaning while preserving legal structure.

    The cleaner keeps line breaks, section labels, article numbers, list markers,
    parentheses, quotes, and other legally meaningful punctuation. It only removes
    repetitive spacing and collapses runs of blank lines to a single blank line.
    """

    if not text:
        return ""

    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    normalized = normalized.replace("\u00a0", " ").replace("\ufeff", "")

    cleaned_lines: list[str] = []
    blank_pending = False

    for raw_line in normalized.split("\n"):
        line = re.sub(r"[ \t]+", " ", raw_line).strip()

        if not line:
            blank_pending = True
            continue

        if blank_pending and cleaned_lines:
            cleaned_lines.append("")
        cleaned_lines.append(line)
        blank_pending = False

    return "\n".join(cleaned_lines).strip()
