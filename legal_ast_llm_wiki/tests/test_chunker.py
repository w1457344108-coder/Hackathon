import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from modules.chunker import chunk_text, is_possible_legal_section


class ChunkerTests(unittest.TestCase):
    def test_detects_common_legal_section_markers(self):
        self.assertTrue(is_possible_legal_section("Section 10 Duty to comply"))
        self.assertTrue(is_possible_legal_section("10.—(1) An organisation shall keep records."))
        self.assertTrue(is_possible_legal_section("第三条 国家保护个人信息权益。"))
        self.assertTrue(is_possible_legal_section("(a) keep the document available."))
        self.assertFalse(is_possible_legal_section("This is a general explanatory paragraph."))

    def test_chunk_text_keeps_heading_and_metadata(self):
        text = "\n\n".join(
            [
                "PART 1",
                "PRELIMINARY",
                "Section 1 Short title",
                "This Act is the Personal Data Protection Act.",
                "Section 2 Interpretation",
                "organisation means any individual, company, association or body of persons.",
            ]
        )

        chunks = chunk_text(
            doc_id="pdpa",
            source_file="pdpa.txt",
            text=text,
            target_min_chars=80,
            target_max_chars=180,
            overlap_chars=20,
        )

        self.assertGreaterEqual(len(chunks), 1)
        self.assertEqual(chunks[0].doc_id, "pdpa")
        self.assertEqual(chunks[0].source_file, "pdpa.txt")
        self.assertEqual(chunks[0].chunk_index, 1)
        self.assertIn("PART 1", chunks[0].chunk_text)
        self.assertTrue(any(chunk.possible_legal_section for chunk in chunks))
        self.assertTrue(all(chunk.chunk_id.startswith("pdpa_chunk_") for chunk in chunks))

    def test_long_unstructured_text_uses_fixed_length_fallback(self):
        text = " ".join(["plain paragraph"] * 240)

        chunks = chunk_text(
            doc_id="plain",
            source_file="plain.txt",
            text=text,
            target_min_chars=100,
            target_max_chars=300,
            overlap_chars=40,
        )

        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(chunk.char_count <= 340 for chunk in chunks))
        self.assertEqual(chunks[0].start_char, 0)
        self.assertTrue(chunks[1].start_char < chunks[0].end_char)


if __name__ == "__main__":
    unittest.main()
