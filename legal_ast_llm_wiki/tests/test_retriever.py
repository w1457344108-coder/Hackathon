import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from modules.retriever import map_query_terms, retrieve_for_query


class RetrieverTests(unittest.TestCase):
    def test_map_query_terms_uses_colloquial_mapping_and_legal_terms(self):
        mappings = [
            {
                "mapping_id": "map_1",
                "colloquial_expression": "Can a company send my data overseas?",
                "mapped_standard_terms": ["cross-border transfer of personal data"],
                "mapped_issue": "cross_border_data_transfer",
                "mapped_domain": "data protection",
                "source_node_ids": ["node_1"],
            }
        ]
        legal_terms = [
            {
                "term_id": "term_1",
                "standard_term": "personal data",
                "synonyms": ["personal information"],
                "source_node_ids": ["node_1"],
                "source_doc_ids": ["doc_1"],
            }
        ]

        mapped_terms, matched_mappings = map_query_terms(
            "Can a company transfer personal data overseas?",
            mappings,
            legal_terms,
        )

        self.assertIn("cross-border transfer of personal data", mapped_terms)
        self.assertIn("personal data", mapped_terms)
        self.assertEqual(matched_mappings[0]["mapping_id"], "map_1")

    def test_retrieve_for_query_returns_traceable_enhanced_results(self):
        legal_terms = [
            {
                "term_id": "term_1",
                "standard_term": "personal data",
                "category": "professional_term",
                "related_domain": "data protection",
                "synonyms": ["personal information"],
                "source_node_ids": ["node_1"],
                "source_doc_ids": ["doc_1"],
                "source_text": ["personal data means data about an individual"],
                "confidence": "high",
            }
        ]
        mappings = [
            {
                "mapping_id": "map_1",
                "colloquial_expression": "What counts as personal data?",
                "mapped_standard_terms": ["definition of personal data"],
                "mapped_issue": "personal_data_protection",
                "mapped_domain": "data protection",
                "source_node_ids": ["node_1"],
            }
        ]
        ast_nodes = [
            {
                "node_id": "node_1",
                "doc_id": "doc_1",
                "chunk_id": "doc_1_chunk_0001",
                "source_file": "pdpa.pdf",
                "legal_domain": "data protection",
                "professional_terms": ["personal data"],
                "definitions": ["personal data means data about an individual"],
                "source_evidence": ["personal data means data about an individual"],
                "original_text": "personal data means data about an individual",
            }
        ]
        wiki_pages = [
            {
                "page_id": "concepts/personal_data",
                "title": "personal data",
                "path": "wiki/concepts/personal_data.md",
                "tags": ["legal-wiki", "data-protection"],
                "text": "# personal data\nSource nodes: node_1",
            }
        ]
        chunks = [
            {
                "chunk_id": "doc_1_chunk_0001",
                "doc_id": "doc_1",
                "source_file": "pdpa.pdf",
                "chunk_text": "personal data means data about an individual",
            }
        ]

        result = retrieve_for_query(
            "q1",
            "What counts as personal data in Singapore?",
            legal_terms=legal_terms,
            colloquial_mappings=mappings,
            ast_nodes=ast_nodes,
            wiki_pages=wiki_pages,
            chunks=chunks,
            top_k=3,
        )

        self.assertEqual(result["query_id"], "q1")
        self.assertIn("personal data", result["mapped_terms"])
        self.assertEqual(result["matched_ast_nodes"][0]["node_id"], "node_1")
        self.assertEqual(result["matched_wiki_pages"][0]["page_id"], "concepts/personal_data")
        self.assertIn("doc_1", result["source_doc_ids"])
        self.assertGreater(result["relevance_score"], 0)


if __name__ == "__main__":
    unittest.main()
