import test from "node:test";
import assert from "node:assert/strict";
import { formatEvidenceSnippetForDisplay } from "../lib/evidence-display.ts";

test("evidence display formats Pillar 6 score rows into readable English", () => {
  const formatted = formatEvidenceSnippetForDisplay({
    lawTitle: "Singapore Economy Profile 2025",
    verbatimSnippet:
      "Pillar 6: Cross-border data policies 0.17 -44% -40% Pillar 7: Domestic data protection and privacy 0.38 -10% -9%"
  });

  assert.equal(
    formatted,
    [
      "Pillar 6 score: 0.17",
      "44% lower complexity than the Asia-Pacific average.",
      "40% lower complexity than the subregional average."
    ].join("\n")
  );
});

test("evidence display formats guide table of contents references into readable English", () => {
  const formatted = formatEvidenceSnippetForDisplay({
    lawTitle: "RDTII 2.1 Guide - Pillar 6 methodology reference",
    verbatimSnippet:
      "Pillar 5. Telecommunications regulations and competition ................. 40 Pillar 6. Cross-border data policies ................................................ 48 Pillar 7. Domestic data protection and privacy ................................ 57"
  });

  assert.equal(
    formatted,
    "Guide section reference: Pillar 6, Cross-border data policies, begins on guide page 48."
  );
});
