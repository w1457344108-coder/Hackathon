import json
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from modules.report_generator import build_final_report_markdown, collect_project_metrics, generate_final_report


class ReportGeneratorTests(unittest.TestCase):
    def test_collect_metrics_and_build_report_include_core_counts(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            (root / "processed/metadata").mkdir(parents=True)
            (root / "processed/chunks").mkdir(parents=True)
            (root / "processed/ast_nodes").mkdir(parents=True)
            (root / "wiki/sources").mkdir(parents=True)
            (root / "wiki/structured_nodes").mkdir(parents=True)
            (root / "wiki/glossary").mkdir(parents=True)
            (root / "outputs/json").mkdir(parents=True)
            (root / "outputs/reports").mkdir(parents=True)

            (root / "processed/metadata/documents_metadata.json").write_text(
                json.dumps([{"doc_id": "doc_1", "original_filename": "PDPA.pdf", "read_status": "success"}]),
                encoding="utf-8",
            )
            (root / "processed/chunks/document_chunks.json").write_text(
                json.dumps([{"chunk_id": "chunk_1", "doc_id": "doc_1"}]),
                encoding="utf-8",
            )
            (root / "processed/ast_nodes/ast_nodes.json").write_text(
                json.dumps([{"node_id": "node_1", "doc_id": "doc_1", "legal_domain": "data protection"}]),
                encoding="utf-8",
            )
            (root / "outputs/json/legal_terms.json").write_text(
                json.dumps([{"term_id": "term_1", "standard_term": "personal data"}]),
                encoding="utf-8",
            )
            (root / "outputs/json/colloquial_mapping.json").write_text(
                json.dumps([{"mapping_id": "map_1"}]),
                encoding="utf-8",
            )
            (root / "outputs/json/retrieval_results.json").write_text(
                json.dumps([{"query_id": "q01", "relevance_score": 0.5}]),
                encoding="utf-8",
            )
            (root / "wiki/sources/doc_1.md").write_text("# Source\n", encoding="utf-8")
            (root / "wiki/structured_nodes/node_1.md").write_text("# Node\n", encoding="utf-8")
            (root / "wiki/glossary/legal_terms.md").write_text("# Terms\n", encoding="utf-8")

            metrics = collect_project_metrics(root)
            report = build_final_report_markdown(metrics)

            self.assertEqual(metrics["document_count"], 1)
            self.assertEqual(metrics["chunk_count"], 1)
            self.assertEqual(metrics["ast_node_count"], 1)
            self.assertIn("类 AST", report)
            self.assertIn("| 文献数量 | 1 |", report)

    def test_generate_final_report_writes_markdown_and_docx(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            (root / "processed/metadata").mkdir(parents=True)
            (root / "processed/chunks").mkdir(parents=True)
            (root / "processed/ast_nodes").mkdir(parents=True)
            (root / "outputs/json").mkdir(parents=True)
            (root / "wiki").mkdir(parents=True)

            (root / "processed/metadata/documents_metadata.json").write_text("[]", encoding="utf-8")
            (root / "processed/chunks/document_chunks.json").write_text("[]", encoding="utf-8")
            (root / "processed/ast_nodes/ast_nodes.json").write_text("[]", encoding="utf-8")
            (root / "outputs/json/legal_terms.json").write_text("[]", encoding="utf-8")
            (root / "outputs/json/colloquial_mapping.json").write_text("[]", encoding="utf-8")
            (root / "outputs/json/retrieval_results.json").write_text("[]", encoding="utf-8")

            result = generate_final_report(project_root=root)

            self.assertTrue(result["markdown_path"].exists())
            self.assertTrue(result["docx_path"].exists())
            self.assertGreater(result["docx_path"].stat().st_size, 0)


if __name__ == "__main__":
    unittest.main()
