import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from modules.file_loader import create_doc_id, discover_documents
from modules.text_cleaner import clean_text


class IngestionTests(unittest.TestCase):
    def test_clean_text_removes_extra_spacing_without_removing_numbering(self):
        raw_text = "Section   10\n\n\n(1)   A person   must comply.\n  (a)   Keep records.  "

        cleaned = clean_text(raw_text)

        self.assertEqual(cleaned, "Section 10\n\n(1) A person must comply.\n(a) Keep records.")

    def test_create_doc_id_is_stable_and_filesystem_safe(self):
        first = create_doc_id(Path("Personal Data Protection Act 2012.pdf"))
        second = create_doc_id(Path("Personal Data Protection Act 2012.pdf"))

        self.assertEqual(first, second)
        self.assertTrue(first.startswith("personal_data_protection_act_2012_"))
        self.assertNotIn(" ", first)

    def test_discover_documents_ignores_unsupported_and_hidden_files(self):
        with TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            (root / "a.pdf").write_text("pdf placeholder", encoding="utf-8")
            (root / "b.docx").write_text("docx placeholder", encoding="utf-8")
            (root / ".gitkeep").write_text("", encoding="utf-8")
            (root / "notes.xlsx").write_text("unsupported", encoding="utf-8")

            found = discover_documents(root)

        self.assertEqual([item.name for item in found], ["a.pdf", "b.docx"])


if __name__ == "__main__":
    unittest.main()
