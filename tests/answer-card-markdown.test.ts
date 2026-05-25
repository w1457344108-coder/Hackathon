import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyAnswerDetail,
  getEvidenceDetailTone,
  getFindingDetailTone,
  getReviewDetailTone,
  getRoadmapDetailTone,
  parseAnswerCardMarkdown,
} from "../lib/answer-card-markdown.ts";

const ARTICLE_38_MARKDOWN = [
  "1. Direct Answer",
  "Article 38 creates a conditional regime for cross-border personal information transfers.",
  "Article 38 of China’s Personal Information Protection Law does not completely prohibit the overseas transfer of personal information.",
  "",
  "2. Regulation Snapshot",
  "- Jurisdiction: China",
  "- Law title: Personal Information Protection Law of the People's Republic of China",
  "- Effective date: 2021-11-01",
  "- Relevant article: Article 38",
  "- URL: https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm",
  "",
  "3. Evidence Passage",
  "- Article: Article 38",
  "- Exact passage: Where a personal information processor needs to provide personal information outside the territory of the People's Republic of China due to business or other needs, it shall meet one of the following conditions.",
  "- Key legal conditions:",
  "  - Security assessment organized by the national cyberspace authority",
  "  - Standard contract with the overseas recipient",
  "- Additional requirement: The personal information processor must take necessary measures.",
  "- URL: https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm",
  "",
  "4. Plain-language Explanation",
  "- What it requires: A company may transfer personal information overseas after satisfying one approved legal transfer mechanism.",
  "- Who is affected: Personal information processors that handle personal information in China.",
  "- When triggered: When personal information collected or processed in China is provided overseas."
].join("\n");

test("parses numbered article 38 markdown into display cards", () => {
  const cards = parseAnswerCardMarkdown(ARTICLE_38_MARKDOWN);

  assert.equal(cards.length, 4);
  assert.equal(cards[0].title, "Direct Answer");
  assert.equal(cards[0].kind, "direct-answer");
  assert.deepEqual(cards[0].badges, [
    "Pillar 6",
    "Indicator 6.4",
    "Conditional Flow Regimes"
  ]);
  assert.equal(cards[1].kind, "snapshot");
  assert.equal(cards[1].items?.[0].label, "Jurisdiction");
  assert.equal(cards[1].items?.[0].value, "China");
  assert.equal(cards[2].kind, "evidence");
  assert.equal(cards[2].items?.some((item) => item.label === "Exact passage"), true);
  assert.deepEqual(cards[2].children, [
    "Security assessment organized by the national cyberspace authority",
    "Standard contract with the overseas recipient"
  ]);
  assert.equal(cards[3].kind, "explanation");
  assert.equal(cards[3].items?.length, 3);
});

test("returns no cards for ordinary prose so the legacy renderer can handle it", () => {
  assert.deepEqual(parseAnswerCardMarkdown("The workflow is running."), []);
});

test("parses ShopPilot case markdown into the same card system", () => {
  const cards = parseAnswerCardMarkdown(
    [
      "1. Case Snapshot",
      "- Case name: ShopPilot AI Customer Support SaaS",
      "- Origin jurisdiction: China",
      "- Destination jurisdiction: Singapore",
      "",
      "2. Direct Answer",
      "ShopPilot primarily triggers Pillar 7.",
      "The case maps to P7:7.4 and links to P6:6.4 Conditional Flow Regimes.",
      "",
      "3. Pillar 7 Assessment",
      "- Classification: Domestic data protection issue",
      "- Primary indicator: P7:7.4",
      "- Reasoning: The transfer requires impact assessment and accountability safeguards.",
      "",
      "4. Pillar 6 Linkage",
      "- Reasoning: The overseas transfer is still a conditional outbound data flow.",
      "",
      "5. Compliance Impact",
      "- Risk level: Medium-High",
      "- Business burden: Medium",
      "- Impact summary: Assessment, notice, consent, and recipient safeguards are required."
    ].join("\n")
  );

  assert.equal(cards.length, 5);
  assert.equal(cards[0].title, "Case Snapshot");
  assert.equal(cards[0].kind, "snapshot");
  assert.equal(cards[1].kind, "direct-answer");
  assert.deepEqual(cards[1].badges, ["P7:7.4", "Linked P6:6.4"]);
  assert.equal(cards[2].kind, "assessment");
  assert.equal(cards[3].kind, "linkage");
  assert.equal(cards[4].kind, "impact");
});

test("parses Singapore AI advisory markdown into advisory cards", () => {
  const cards = parseAnswerCardMarkdown(
    [
      "1. Advisory Snapshot",
      "- Advisory name: Singapore AI SaaS China Entry",
      "- Target jurisdiction: China",
      "- The risk-related segments:",
      "  - Raw chat logs for model training",
      "  - Launch before transfer paperwork",
      "",
      "2. Direct Answer",
      "The current plan is No-Go until remediation is completed.",
      "The plan maps to P6:6.4, P7:7.1, and P7:7.4.",
      "",
      "3. Selected Indicators",
      "- P6:6.4 Conditional Flow Regimes — Primary",
      "- P7:7.1 Comprehensive Data Protection Framework — Linked",
      "",
      "4. Possible Non-compliance Findings",
      "- RISK_01: Launching transfer before selecting a legal route",
      "  - Risk level: High",
      "  - Recommended fix:",
      "    - Select a lawful transfer mechanism before launch",
      "",
      "5. Overall Assessment",
      "- Risk level: High before remediation",
      "- Recommendation: No-Go until remediation is completed",
      "",
      "6. Remediation Roadmap",
      "- Phase 1",
      "  - Priority: High",
      "  - Complete data classification"
    ].join("\n")
  );

  assert.equal(cards.length, 6);
  assert.equal(cards[0].kind, "snapshot");
  assert.deepEqual(cards[1].badges, ["P6:6.4", "P7:7.1", "P7:7.4"]);
  assert.equal(cards[2].kind, "indicators");
  assert.equal(cards[3].kind, "findings");
  assert.deepEqual(cards[3].children, [
    "RISK_01: Launching transfer before selecting a legal route",
    "Risk level: High",
    "Recommended fix:",
    "Select a lawful transfer mechanism before launch"
  ]);
  assert.equal(cards[4].kind, "assessment");
  assert.equal(cards[5].kind, "roadmap");
  assert.deepEqual(cards[5].children, [
    "Phase 1",
    "Priority: High",
    "Complete data classification"
  ]);
});

test("classifies advisory details for color-coded rendering", () => {
  assert.equal(classifyAnswerDetail("RISK_01: Launching transfer before selecting a legal route"), "finding");
  assert.equal(classifyAnswerDetail("Risk level: High"), "risk");
  assert.equal(classifyAnswerDetail("Related law: Personal Information Protection Law, Article 38"), "law");
  assert.equal(classifyAnswerDetail("CN_PIPL_ART38 (Article 38, Items 1-4, P6)"), "law");
  assert.equal(classifyAnswerDetail("Recommended fix:"), "action");
  assert.equal(classifyAnswerDetail("Select a lawful transfer mechanism before launch"), "action");
  assert.equal(classifyAnswerDetail("URL: https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm"), "source");
  assert.equal(classifyAnswerDetail("Possible legal conflict: The company may transfer before selecting a lawful route"), "conflict");
});

test("finding detail tone is off by default", () => {
  assert.equal(
    getFindingDetailTone("RISK_01: Launching transfer before selecting a legal route"),
    "default"
  );
  assert.equal(getFindingDetailTone("Risk level: High"), "default");
  assert.equal(getFindingDetailTone("Recommended fix:"), "default");
  assert.equal(
    getFindingDetailTone("Select a lawful transfer mechanism before launch", true),
    "default"
  );
});

test("finding detail tone highlights selected risk id, risk level, and fixes", () => {
  const enabledHighlights = {
    finding: true,
    risk: true,
    action: true,
    conflict: false,
    law: false,
    indicator: false,
    context: false
  };

  assert.equal(
    getFindingDetailTone("RISK_01: Launching transfer before selecting a legal route", false, enabledHighlights),
    "finding"
  );
  assert.equal(getFindingDetailTone("Risk level: High", false, enabledHighlights), "risk");
  assert.equal(getFindingDetailTone("Recommended fix:", false, enabledHighlights), "action");
  assert.equal(
    getFindingDetailTone("Select a lawful transfer mechanism before launch", true, enabledHighlights),
    "action"
  );
  assert.equal(getFindingDetailTone("Possible legal conflict: Transfer may start too early"), "default");
  assert.equal(getFindingDetailTone("Related law: Personal Information Protection Law, Article 38"), "default");
  assert.equal(getFindingDetailTone("Related RDTII indicators: P6:6.4"), "default");
  assert.equal(getFindingDetailTone("Why it matters: The launch may create compliance exposure"), "default");
});

test("finding optional highlights are controlled independently", () => {
  assert.equal(
    getFindingDetailTone("Possible legal conflict: Transfer may start too early", false, {
      finding: true,
      risk: true,
      action: true,
      conflict: true,
      law: false,
      indicator: false,
      context: false
    }),
    "conflict"
  );
  assert.equal(
    getFindingDetailTone("Related law: Personal Information Protection Law, Article 38", false, {
      finding: true,
      risk: true,
      action: true,
      conflict: false,
      law: true,
      indicator: false,
      context: false
    }),
    "law"
  );
  assert.equal(
    getFindingDetailTone("Related RDTII indicators: P6:6.4", false, {
      finding: true,
      risk: true,
      action: true,
      conflict: false,
      law: false,
      indicator: true,
      context: false
    }),
    "indicator"
  );
  assert.equal(
    getFindingDetailTone("Why it matters: The launch may create compliance exposure", false, {
      finding: true,
      risk: true,
      action: true,
      conflict: false,
      law: false,
      indicator: false,
      context: true
    }),
    "context"
  );
});

test("finding default highlights can be switched off", () => {
  const disabledHighlights = {
    finding: false,
    risk: false,
    action: false,
    conflict: false,
    law: false,
    indicator: false,
    context: false
  };

  assert.equal(
    getFindingDetailTone("RISK_01: Launching transfer before selecting a legal route", false, disabledHighlights),
    "default"
  );
  assert.equal(getFindingDetailTone("Risk level: High", false, disabledHighlights), "default");
  assert.equal(getFindingDetailTone("Recommended fix:", false, disabledHighlights), "default");
  assert.equal(
    getFindingDetailTone("Select a lawful transfer mechanism before launch", true, disabledHighlights),
    "default"
  );
});

test("roadmap and review detail tones are controlled independently", () => {
  assert.equal(getRoadmapDetailTone("Phase 1 — Freeze high-risk transfer design"), "default");
  assert.equal(getRoadmapDetailTone("Priority: High"), "default");
  assert.equal(getRoadmapDetailTone("Complete data classification"), "default");
  assert.equal(getReviewDetailTone("Confirm whether transfer volume crosses thresholds."), "default");
  assert.equal(getReviewDetailTone("CN_PIPL_ART55 (Article 55, Item 5, P7)"), "default");

  assert.equal(
    getRoadmapDetailTone("Phase 1 — Freeze high-risk transfer design", {
      phase: true,
      priority: false,
      action: false
    }),
    "finding"
  );
  assert.equal(
    getRoadmapDetailTone("Priority: High", {
      phase: false,
      priority: true,
      action: false
    }),
    "risk"
  );
  assert.equal(
    getRoadmapDetailTone("Complete data classification", {
      phase: false,
      priority: false,
      action: true
    }),
    "action"
  );
  assert.equal(
    getReviewDetailTone("Confirm whether transfer volume crosses thresholds.", {
      content: true,
      law: false
    }),
    "action"
  );
  assert.equal(
    getReviewDetailTone("CN_PIPL_ART55 (Article 55, Item 5, P7)", {
      content: false,
      law: true
    }),
    "law"
  );
});

test("evidence detail tones are controlled independently", () => {
  assert.equal(getEvidenceDetailTone("CN_PIPL_ART55 (Article 55, P7)"), "default");
  assert.equal(getEvidenceDetailTone("Role: Supports the impact assessment finding"), "default");
  assert.equal(getEvidenceDetailTone("Summary: Article 55 requires a personal information protection impact assessment."), "default");

  assert.equal(
    getEvidenceDetailTone("CN_PIPL_ART55 (Article 55, P7)", {
      law: true,
      role: false,
      summary: false
    }),
    "law"
  );
  assert.equal(
    getEvidenceDetailTone("Role: Supports the impact assessment finding", {
      law: false,
      role: true,
      summary: false
    }),
    "risk"
  );
  assert.equal(
    getEvidenceDetailTone("Summary: Article 55 requires a personal information protection impact assessment.", {
      law: false,
      role: false,
      summary: true
    }),
    "action"
  );
});
