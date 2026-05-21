import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from modules.glossary_builder import build_glossary_records, stable_id


class GlossaryBuilderTests(unittest.TestCase):
    def test_build_glossary_records_preserves_traceability_and_pending_status(self):
        nodes = [
            {
                "node_id": "node_1",
                "doc_id": "doc_1",
                "legal_domain": "data protection",
                "confidence": "high",
                "legal_subjects": ["organisation"],
                "legal_actions": ["collect data"],
                "legal_objects": ["personal data"],
                "conditions": ["unless the individual gives consent"],
                "obligations": ["An organisation shall protect personal data."],
                "rights": ["An individual may request access."],
                "prohibitions": ["shall not disclose personal data"],
                "legal_consequences": ["financial penalty"],
                "definitions": ["personal data means data about an individual"],
                "professional_terms": ["personal data", "consent"],
                "related_terms": ["personal information"],
                "possible_user_questions": ["Can a company use my personal data?"],
                "source_evidence": ["An organisation shall protect personal data."],
            }
        ]

        legal_terms, mappings, synonyms = build_glossary_records(nodes)

        personal_data = next(item for item in legal_terms if item["standard_term"] == "personal data")
        self.assertEqual(personal_data["review_status"], "pending")
        self.assertIn("node_1", personal_data["source_node_ids"])
        self.assertIn("doc_1", personal_data["source_doc_ids"])
        self.assertGreater(len(mappings), 0)
        self.assertEqual(mappings[0]["review_status"], "pending")
        self.assertGreater(len(synonyms), 0)
        self.assertEqual(synonyms[0]["review_status"], "pending")

    def test_stable_id_is_deterministic_and_prefixed(self):
        self.assertEqual(stable_id("term", "personal data"), stable_id("term", "personal data"))
        self.assertTrue(stable_id("term", "personal data").startswith("term_"))


if __name__ == "__main__":
    unittest.main()
