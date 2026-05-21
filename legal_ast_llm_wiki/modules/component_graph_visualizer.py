"""Generate an Obsidian-style component graph visual for the prototype."""

from __future__ import annotations

import math
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import matplotlib.pyplot as plt
from matplotlib import rcParams

from config import OUTPUT_REPORTS_DIR


rcParams["font.sans-serif"] = ["Microsoft YaHei", "SimHei", "Microsoft JhengHei", "Arial"]
rcParams["axes.unicode_minus"] = False


@dataclass(frozen=True)
class GraphNode:
    node_id: str
    label: str
    group: str
    size: float


@dataclass(frozen=True)
class GraphEdge:
    source: str
    target: str
    weight: float = 1.0


GROUP_CENTERS = {
    "source": (-3.2, 1.5),
    "processing": (-1.5, 0.7),
    "ast": (0.0, 0.5),
    "wiki": (1.7, 0.7),
    "glossary": (2.7, -1.0),
    "retrieval": (0.9, -1.6),
    "llm": (3.6, 1.4),
    "rdtii": (-2.4, -1.4),
    "reports": (0.0, -2.7),
}


def build_component_graph() -> tuple[list[GraphNode], list[GraphEdge]]:
    nodes = [
        GraphNode("raw_documents", "raw/documents\n9 source documents", "source", 680),
        GraphNode("companies_act", "Companies Act 1967", "source", 120),
        GraphNode("pdpa_2012", "Singapore PDPA 2012", "source", 190),
        GraphNode("pdpa_amendment", "PDPA Amendment 2020", "source", 150),
        GraphNode("pipl", "China PIPL", "source", 230),
        GraphNode("cybersecurity_law", "China Cybersecurity Law", "source", 170),
        GraphNode("file_loader", "file_loader.py", "processing", 260),
        GraphNode("text_cleaner", "text_cleaner.py", "processing", 230),
        GraphNode("chunker", "chunker.py", "processing", 300),
        GraphNode("texts", "processed/texts", "processing", 240),
        GraphNode("chunks", "1769 chunks", "processing", 520),
        GraphNode("ast_parser", "ast_parser.py", "ast", 340),
        GraphNode("ast_nodes", "1769 AST-like nodes", "ast", 650),
        GraphNode("ast_by_doc", "ast_nodes_by_doc", "ast", 240),
        GraphNode("wiki_builder", "wiki_builder.py", "wiki", 330),
        GraphNode("wiki_index", "wiki/index.md", "wiki", 560),
        GraphNode("source_pages", "wiki/sources", "wiki", 300),
        GraphNode("law_pages", "wiki/laws", "wiki", 260),
        GraphNode("concept_pages", "wiki/concepts", "wiki", 380),
        GraphNode("issue_pages", "wiki/issues", "wiki", 320),
        GraphNode("structured_nodes", "wiki/structured_nodes", "wiki", 580),
        GraphNode("glossary_pages", "wiki/glossary", "glossary", 360),
        GraphNode("glossary_builder", "glossary_builder.py", "glossary", 320),
        GraphNode("legal_terms", "5690 legal terms", "glossary", 500),
        GraphNode("colloquial_mapping", "116 colloquial mappings", "glossary", 360),
        GraphNode("synonym_table", "652 synonym rows", "glossary", 310),
        GraphNode("retriever", "retriever.py", "retrieval", 370),
        GraphNode("evaluator", "evaluator.py", "retrieval", 270),
        GraphNode("retrieval_results", "retrieval_results\n8 questions", "retrieval", 360),
        GraphNode("retrieval_report", "retrieval report", "reports", 260),
        GraphNode("final_report", "final build report", "reports", 300),
        GraphNode("component_graph", "component graph", "reports", 260),
        GraphNode("llm_agent", "LLM using Wiki", "llm", 520),
        GraphNode("answer_draft", "evidence-based answer", "llm", 360),
        GraphNode("source_evidence", "source evidence", "llm", 300),
        GraphNode("rdtii_p6", "RDTII Pillar 6\nConditional Flow", "rdtii", 330),
        GraphNode("rdtii_p7", "RDTII Pillar 7\nDPIA / DPO", "rdtii", 330),
        GraphNode("pipl_art38", "PIPL Article 38\n第三十八条", "rdtii", 360),
        GraphNode("pipl_art39", "PIPL Article 39\n告知 + 单独同意", "rdtii", 260),
        GraphNode("pipl_art40", "PIPL Article 40\n安全评估", "rdtii", 260),
        GraphNode("pipl_art52", "PIPL Article 52\n负责人", "rdtii", 240),
        GraphNode("pipl_art55", "PIPL Article 55\n影响评估", "rdtii", 270),
        GraphNode("pipl_art56", "PIPL Article 56\n评估内容", "rdtii", 240),
        GraphNode("question_1", "Q1 Article 38", "llm", 220),
        GraphNode("question_2", "Q2 China-to-Singapore case", "llm", 240),
        GraphNode("question_3", "Q3 forward-looking advisory", "llm", 240),
    ]

    edges = [
        GraphEdge("companies_act", "raw_documents"),
        GraphEdge("pdpa_2012", "raw_documents"),
        GraphEdge("pdpa_amendment", "raw_documents"),
        GraphEdge("pipl", "raw_documents"),
        GraphEdge("cybersecurity_law", "raw_documents"),
        GraphEdge("raw_documents", "file_loader", 1.4),
        GraphEdge("file_loader", "texts", 1.4),
        GraphEdge("texts", "text_cleaner", 1.2),
        GraphEdge("text_cleaner", "chunker", 1.2),
        GraphEdge("chunker", "chunks", 1.5),
        GraphEdge("chunks", "ast_parser", 1.4),
        GraphEdge("ast_parser", "ast_nodes", 1.6),
        GraphEdge("ast_nodes", "ast_by_doc"),
        GraphEdge("ast_nodes", "wiki_builder", 1.3),
        GraphEdge("wiki_builder", "wiki_index", 1.4),
        GraphEdge("wiki_builder", "source_pages"),
        GraphEdge("wiki_builder", "law_pages"),
        GraphEdge("wiki_builder", "concept_pages"),
        GraphEdge("wiki_builder", "issue_pages"),
        GraphEdge("wiki_builder", "structured_nodes", 1.4),
        GraphEdge("ast_nodes", "structured_nodes", 1.3),
        GraphEdge("ast_nodes", "glossary_builder", 1.2),
        GraphEdge("glossary_builder", "legal_terms", 1.4),
        GraphEdge("glossary_builder", "colloquial_mapping"),
        GraphEdge("glossary_builder", "synonym_table"),
        GraphEdge("glossary_builder", "glossary_pages"),
        GraphEdge("legal_terms", "glossary_pages"),
        GraphEdge("colloquial_mapping", "glossary_pages"),
        GraphEdge("synonym_table", "glossary_pages"),
        GraphEdge("wiki_index", "retriever"),
        GraphEdge("source_pages", "retriever"),
        GraphEdge("law_pages", "retriever"),
        GraphEdge("concept_pages", "retriever"),
        GraphEdge("issue_pages", "retriever"),
        GraphEdge("structured_nodes", "retriever", 1.3),
        GraphEdge("glossary_pages", "retriever"),
        GraphEdge("legal_terms", "retriever", 1.4),
        GraphEdge("colloquial_mapping", "retriever", 1.2),
        GraphEdge("synonym_table", "retriever"),
        GraphEdge("ast_nodes", "retriever"),
        GraphEdge("chunks", "retriever"),
        GraphEdge("retriever", "retrieval_results", 1.4),
        GraphEdge("retrieval_results", "evaluator"),
        GraphEdge("evaluator", "retrieval_report"),
        GraphEdge("retrieval_results", "final_report"),
        GraphEdge("wiki_index", "final_report"),
        GraphEdge("ast_nodes", "final_report"),
        GraphEdge("legal_terms", "final_report"),
        GraphEdge("wiki_index", "llm_agent", 1.5),
        GraphEdge("structured_nodes", "llm_agent", 1.4),
        GraphEdge("legal_terms", "llm_agent"),
        GraphEdge("colloquial_mapping", "llm_agent"),
        GraphEdge("retriever", "llm_agent"),
        GraphEdge("llm_agent", "answer_draft", 1.4),
        GraphEdge("source_evidence", "answer_draft"),
        GraphEdge("ast_nodes", "source_evidence"),
        GraphEdge("pipl", "pipl_art38", 1.3),
        GraphEdge("pipl", "pipl_art39"),
        GraphEdge("pipl", "pipl_art40"),
        GraphEdge("pipl", "pipl_art52"),
        GraphEdge("pipl", "pipl_art55"),
        GraphEdge("pipl", "pipl_art56"),
        GraphEdge("pipl_art38", "rdtii_p6", 1.4),
        GraphEdge("pipl_art39", "rdtii_p6"),
        GraphEdge("pipl_art40", "rdtii_p6"),
        GraphEdge("pipl_art52", "rdtii_p7"),
        GraphEdge("pipl_art55", "rdtii_p7", 1.4),
        GraphEdge("pipl_art56", "rdtii_p7"),
        GraphEdge("rdtii_p6", "question_1"),
        GraphEdge("rdtii_p6", "question_2"),
        GraphEdge("rdtii_p7", "question_2"),
        GraphEdge("rdtii_p6", "question_3"),
        GraphEdge("rdtii_p7", "question_3"),
        GraphEdge("question_1", "llm_agent"),
        GraphEdge("question_2", "llm_agent"),
        GraphEdge("question_3", "llm_agent"),
        GraphEdge("pipl_art38", "structured_nodes"),
        GraphEdge("pipl_art55", "structured_nodes"),
        GraphEdge("pdpa_2012", "source_pages"),
        GraphEdge("pdpa_amendment", "source_pages"),
        GraphEdge("pipl", "source_pages"),
        GraphEdge("component_graph", "final_report"),
    ]
    return nodes, edges


def force_layout(
    nodes: list[GraphNode],
    edges: list[GraphEdge],
    *,
    iterations: int = 650,
    seed: int = 42,
) -> dict[str, tuple[float, float]]:
    random.seed(seed)
    positions: dict[str, list[float]] = {}
    node_ids = [node.node_id for node in nodes]
    for node in nodes:
        cx, cy = GROUP_CENTERS.get(node.group, (0.0, 0.0))
        positions[node.node_id] = [cx + random.uniform(-0.45, 0.45), cy + random.uniform(-0.45, 0.45)]

    node_size = {node.node_id: node.size for node in nodes}
    edge_pairs = [(edge.source, edge.target, edge.weight) for edge in edges]

    for step in range(iterations):
        temperature = 0.045 * (1 - step / iterations) + 0.004
        displacement = {node_id: [0.0, 0.0] for node_id in node_ids}

        for i, source in enumerate(node_ids):
            sx, sy = positions[source]
            for target in node_ids[i + 1 :]:
                tx, ty = positions[target]
                dx = sx - tx
                dy = sy - ty
                distance_sq = dx * dx + dy * dy + 0.02
                distance = math.sqrt(distance_sq)
                repulsion = 0.028 * (node_size[source] ** 0.5) * (node_size[target] ** 0.5) / distance_sq
                fx = repulsion * dx / distance
                fy = repulsion * dy / distance
                displacement[source][0] += fx
                displacement[source][1] += fy
                displacement[target][0] -= fx
                displacement[target][1] -= fy

        for source, target, weight in edge_pairs:
            sx, sy = positions[source]
            tx, ty = positions[target]
            dx = tx - sx
            dy = ty - sy
            distance = math.sqrt(dx * dx + dy * dy + 0.02)
            attraction = 0.010 * weight * distance
            fx = attraction * dx / distance
            fy = attraction * dy / distance
            displacement[source][0] += fx
            displacement[source][1] += fy
            displacement[target][0] -= fx
            displacement[target][1] -= fy

        for node in nodes:
            cx, cy = GROUP_CENTERS.get(node.group, (0.0, 0.0))
            x, y = positions[node.node_id]
            displacement[node.node_id][0] += (cx - x) * 0.010
            displacement[node.node_id][1] += (cy - y) * 0.010

        for node_id in node_ids:
            dx, dy = displacement[node_id]
            length = math.sqrt(dx * dx + dy * dy) or 1
            positions[node_id][0] += min(length, temperature) * dx / length
            positions[node_id][1] += min(length, temperature) * dy / length

    return {node_id: (coords[0], coords[1]) for node_id, coords in positions.items()}


def draw_component_graph(
    output_png: Path = OUTPUT_REPORTS_DIR / "component_graph_visual.png",
    output_svg: Path = OUTPUT_REPORTS_DIR / "component_graph_visual.svg",
) -> tuple[Path, Path]:
    nodes, edges = build_component_graph()
    positions = force_layout(nodes, edges)
    node_by_id = {node.node_id: node for node in nodes}

    output_png.parent.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(14, 9.8), dpi=160)
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")

    for edge in edges:
        sx, sy = positions[edge.source]
        tx, ty = positions[edge.target]
        alpha = 0.13 + min(edge.weight, 1.8) * 0.08
        ax.plot([sx, tx], [sy, ty], color="#B8B8B8", linewidth=0.75 * edge.weight, alpha=alpha, zorder=1)

    for node in nodes:
        x, y = positions[node.node_id]
        is_key = node.node_id in {
            "wiki_index",
            "ast_nodes",
            "raw_documents",
            "llm_agent",
            "chunks",
            "structured_nodes",
            "legal_terms",
        }
        color = "#404040" if is_key else "#595959"
        alpha = 0.94 if is_key else 0.82
        ax.scatter([x], [y], s=node.size, c=color, alpha=alpha, edgecolors="white", linewidths=0.8, zorder=3)

    for node in nodes:
        x, y = positions[node.node_id]
        is_key = node.size >= 500
        label_color = "#6F6F6F" if is_key else "#AAAAAA"
        font_size = 8.6 if is_key else 7.1
        ax.text(x, y - 0.18, node.label, ha="center", va="top", fontsize=font_size, color=label_color, zorder=4)

    ax.text(
        0.02,
        0.97,
        "AST + LLM Wiki Component Graph",
        transform=ax.transAxes,
        fontsize=13,
        color="#2E2E2E",
        ha="left",
        va="top",
    )
    ax.text(
        0.02,
        0.93,
        "Nodes = project components / Wiki knowledge units. Edges = data flow, evidence links, or retrieval use.",
        transform=ax.transAxes,
        fontsize=8.5,
        color="#8A8A8A",
        ha="left",
        va="top",
    )

    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.margins(0.12)
    plt.tight_layout(pad=0.4)
    fig.savefig(output_png, facecolor="white", bbox_inches="tight")
    fig.savefig(output_svg, facecolor="white", bbox_inches="tight")
    plt.close(fig)
    return output_png, output_svg


if __name__ == "__main__":
    png, svg = draw_component_graph()
    print(png)
    print(svg)
