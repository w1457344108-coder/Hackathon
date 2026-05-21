import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from modules.wiki_builder import frontmatter, obsidian_link, slugify_filename


class WikiBuilderTests(unittest.TestCase):
    def test_slugify_filename_uses_lowercase_underscores(self):
        self.assertEqual(slugify_filename("Cross-Border Transfer of Personal Data"), "cross_border_transfer_of_personal_data")
        self.assertEqual(slugify_filename("个人信息"), "term_c241ef1b")

    def test_obsidian_link_preserves_target_and_label(self):
        self.assertEqual(
            obsidian_link("sources/pdpa", "Personal Data Protection Act"),
            "[[sources/pdpa|Personal Data Protection Act]]",
        )

    def test_frontmatter_includes_pending_review_status(self):
        rendered = frontmatter(
            {
                "type": "concept",
                "jurisdiction": "Singapore",
                "domain": "data protection",
                "review_status": "pending",
                "tags": ["legal-wiki", "data-protection"],
            }
        )

        self.assertTrue(rendered.startswith("---\n"))
        self.assertIn("review_status: pending", rendered)
        self.assertIn("  - legal-wiki", rendered)


if __name__ == "__main__":
    unittest.main()
