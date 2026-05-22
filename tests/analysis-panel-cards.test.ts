import test from "node:test";
import assert from "node:assert/strict";
import {
  buildEvidenceCitationCards,
  buildExportPackageCards
} from "../lib/analysis-panel-cards.ts";
import type { EvidenceRecord } from "../lib/pillar6-schema.ts";
import type { LegalReviewExportOutput } from "../lib/types.ts";

const evidenceRecord: EvidenceRecord = {
  evidenceId: "EV-CHN-PIPL-38",
  country: "China",
  pillar: "Pillar 6",
  indicator: "Conditional Flow Regimes",
  indicatorCode: "P6_4_CONDITIONAL_FLOW",
  lawTitle: "Personal Information Protection Law",
  citation: "Article 38",
  verbatimSnippet:
    "Where a personal information processor needs to provide personal information outside China, it shall meet one legal transfer condition.",
  sourceUrl: "https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm",
  sourceLocator: "Article 38",
  sourceType: "Statute",
  discoveryTags: ["PIPL", "Article 38"],
  confidence: 0.98,
  reviewStatus: "Approved",
  reviewerNote: "Primary legal evidence.",
  originalLegalText: "Article 38 text.",
  aiExtraction: "Cross-border transfer requires a legal transfer condition.",
  pillar6Mapping: "Pillar 6 — Indicator 6.4 Conditional Flow Regimes",
  mappingRationale:
    "The rule permits transfer only after satisfying an approved legal condition.",
  riskImplication: "Medium compliance burden."
};

const exportPackage: LegalReviewExportOutput = {
  finalReport: "Final report text.",
  judgeSummary: "Judge summary text.",
  exportReadiness: "Ready for Judge Review",
  reviewSummary: {
    approvedCount: 1,
    needsRevisionCount: 0,
    rejectedCount: 0,
    humanReviewCount: 0
  },
  exportJson: { answerType: "REGULATION_EXPLANATION" },
  exportCsvRows: [{ evidenceId: "EV-CHN-PIPL-38", citation: "Article 38" }],
  exportMarkdown: "# Article 38\n\nMarkdown report."
};

test("buildEvidenceCitationCards creates source quote mapping cards", () => {
  const cards = buildEvidenceCitationCards([evidenceRecord]);

  assert.equal(cards.length, 1);
  assert.equal(cards[0].title, "Personal Information Protection Law");
  assert.equal(cards[0].citation, "Article 38");
  assert.equal(cards[0].sourceUrl, evidenceRecord.sourceUrl);
  assert.equal(cards[0].identityItems.some((item) => item.label === "Confidence"), true);
  assert.match(cards[0].decisiveBasis, /legal transfer condition/i);
  assert.match(cards[0].mappingRationale, /approved legal condition/i);
});

test("buildExportPackageCards summarizes readiness and three export formats", () => {
  const cards = buildExportPackageCards({
    exportPackage,
    analysisRunId: "RUN-1",
    fallbackJson: { fallback: true }
  });

  assert.equal(cards.readiness.status, "Ready for Judge Review");
  assert.equal(cards.readiness.metrics[0].label, "Approved");
  assert.deepEqual(
    cards.formats.map((format) => format.name),
    ["JSON", "CSV", "Markdown"]
  );
  assert.equal(cards.formats[0].fileName, "analysis.json");
  assert.equal(cards.formats[1].fileName, "analysis.csv");
  assert.equal(cards.formats[2].fileName, "analysis.md");
  assert.equal(cards.formats[2].preview, "# Article 38\n\nMarkdown report.");
});
