import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from modules.ast_parser import parse_chunk_to_node


class AstParserTests(unittest.TestCase):
    def test_parse_chunk_extracts_data_protection_obligation_and_definition(self):
        chunk = {
            "chunk_id": "pdpa_chunk_0001",
            "doc_id": "pdpa",
            "source_file": "Personal Data Protection Act 2012.pdf",
            "chunk_text": (
                "personal data means data about an individual who can be identified. "
                "An organisation shall not collect, use or disclose personal data unless "
                "the individual gives consent. A contravention may result in a financial penalty."
            ),
        }

        node = parse_chunk_to_node(chunk)

        self.assertEqual(node.doc_id, "pdpa")
        self.assertEqual(node.chunk_id, "pdpa_chunk_0001")
        self.assertEqual(node.review_status, "pending")
        self.assertEqual(node.jurisdiction, "Singapore")
        self.assertEqual(node.document_type, "law")
        self.assertEqual(node.legal_domain, "data protection")
        self.assertIn("organisation", node.legal_subjects)
        self.assertIn("personal data", node.legal_objects)
        self.assertTrue(any("shall not collect" in item for item in node.prohibitions))
        self.assertTrue(any("means" in item for item in node.definitions))
        self.assertTrue(any("financial penalty" in item for item in node.legal_consequences))
        self.assertGreater(len(node.source_evidence), 0)
        self.assertIn(node.confidence, {"high", "medium"})

    def test_parse_chunk_marks_uncertain_content_low_confidence(self):
        chunk = {
            "chunk_id": "unknown_chunk_0001",
            "doc_id": "unknown",
            "source_file": "unknown.txt",
            "chunk_text": "This paragraph gives general background without a clear legal rule.",
        }

        node = parse_chunk_to_node(chunk)

        self.assertEqual(node.legal_domain, "unknown")
        self.assertEqual(node.document_type, "unknown")
        self.assertEqual(node.confidence, "low")
        self.assertEqual(node.review_status, "pending")
        self.assertIn("No strong rule signal", " ".join(node.notes))


if __name__ == "__main__":
    unittest.main()
