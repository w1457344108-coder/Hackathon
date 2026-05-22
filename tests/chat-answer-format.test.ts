import test from "node:test";
import assert from "node:assert/strict";
import { formatBackendAnswerMarkdown } from "../lib/chat-answer-format.ts";
import { parseAnswerCardMarkdown } from "../lib/answer-card-markdown.ts";

const sampleResult = {
  analysisRunId: "RUN-42",
  providerId: "deepseek",
  providerModel: "deepseek-chat",
  evidenceSourceMode: "real",
  report: {
    finalNarrative:
      "1. Direct Answer\n**Article 38** creates a conditional transfer route.\n\n- Security assessment may be required.\n- Standard contracts may be used.",
    overallRisk: "High"
  },
  evidenceRecords: [
    {
      lawTitle: "Personal Information Protection Law",
      citation: "Article 38",
      sourceUrl: "https://www.cac.gov.cn/pipl-article-38",
      sourceLocator: "Article 38",
      sourceType: "Statute",
      verbatimSnippet:
        "Where a personal information processor needs to provide personal information outside China, it shall meet one of the statutory transfer conditions.",
      country: "China"
    }
  ],
  supportingAgentResults: {
    legalReviewExport: {
      data: {
        exportReadiness: "Needs Human Review",
        exportJson: { answerType: "REGULATION_EXPLANATION" }
      }
    }
  },
  mainlineAgentResults: {
    legalReasoner: {
      data: {
        legalFindings: [
          {
            conclusion: "Outbound transfer requires a lawful transfer mechanism.",
            legalEffect: "The business should select and document the mechanism before export."
          }
        ]
      }
    }
  }
} as const;

test("keeps backend answer cards while adding evidence and clickable sources", () => {
  const markdown = formatBackendAnswerMarkdown(sampleResult, "regulation");

  assert.equal(markdown.match(/^\d+\.\s+Direct Answer/gm)?.length, 1);
  assert.doesNotMatch(markdown, /Answer Snapshot/);
  assert.match(markdown, /\d+\. Evidence Passage/);
  assert.match(markdown, /\d+\. Compliance Impact/);
  assert.match(markdown, /\d+\. Source URLs Used/);
  assert.match(markdown, /\*\*Article 38\*\*/);
  assert.match(markdown, /\[Personal Information Protection Law\]\(https:\/\/www\.cac\.gov\.cn\/pipl-article-38\)/);

  const cards = parseAnswerCardMarkdown(markdown);
  assert.ok(cards.length >= 4);
  assert.equal(cards[0].kind, "direct-answer");
  assert.equal(cards.some((card) => card.kind === "evidence"), true);
  assert.equal(cards.some((card) => card.kind === "snapshot"), false);

  const sourceCard = cards.find((card) => card.kind === "sources");
  assert.ok(sourceCard);
  assert.deepEqual(sourceCard.items, []);
  assert.deepEqual(sourceCard.children, [
    "[Personal Information Protection Law](https://www.cac.gov.cn/pipl-article-38)"
  ]);
  assert.equal(sourceCard.sourceUrl, "https://www.cac.gov.cn/pipl-article-38");
});
