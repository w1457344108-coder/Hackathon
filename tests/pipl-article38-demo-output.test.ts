import test from "node:test";
import assert from "node:assert/strict";
import { runMultiAgentWorkflow } from "../lib/agents.ts";

const DEMO_QUERY =
  "Please explain the requirements under Article 38 of China’s Personal Information Protection Law for providing personal information overseas. This question corresponds to RDTII Pillar 6, Indicator 6.4 Conditional Flow Regimes.";

const SHOPPILOT_QUERY = `Please analyze an existing China-to-Singapore data transfer case.

ShopPilot AI operates in China as an AI customer support SaaS provider for e-commerce merchants. It transfers ordinary personal information of about 200,000 Chinese consumers per year to a Singapore analytics center for model optimization and service quality analysis. The case does not involve sensitive personal information, minors' data, medical data, financial account data, or officially identified important data.

This question focuses on RDTII Pillar 7, Indicator 7.4 Data Protection Impact Assessment / Data Protection Officer Requirements. Please also explain how this Pillar 7 issue links to Pillar 6, Indicator 6.4 Conditional Flow Regimes.`;

const SINGAPORE_AI_ADVISORY_QUERY =
  "Please provide a forward-looking legal advisory for a Singapore AI SaaS company planning to enter the Chinese market. The company plans to provide AI customer support tools for Chinese e-commerce merchants and route Chinese consumers’ customer support data to a Singapore analytics center for model training and service optimization. To move faster, the team is considering launching first, finishing the outbound transfer paperwork later, covering the product with its standard privacy policy, and sending raw chat logs plus contact details to Singapore. Please advise what the company should prepare before launch under RDTII Pillar 6 Conditional Flow Regimes and Pillar 7 domestic data protection obligations.";

test("PIPL Article 38 demo returns the regulation explanation package in display order", async () => {
  const result = await runMultiAgentWorkflow("China", null, {
    taskType: "regulation-interpretation",
    userQuery: DEMO_QUERY
  });

  const exportJson = result.supportingAgentResults.legalReviewExport.data?.exportJson;
  assert.ok(exportJson);
  assert.equal(exportJson.answerType, "REGULATION_EXPLANATION");
  assert.equal(exportJson.status, "success");

  const query = exportJson.query as Record<string, unknown>;
  assert.equal(query.taskType, "regulation-interpretation");
  assert.equal(query.workflowMode, "regulation-interpretation");
  assert.equal(query.countryA, "China");
  assert.equal(query.countryB, null);
  assert.equal(query.selectedPillarId, "P6");
  assert.equal(query.selectedIndicatorId, "6.4");
  assert.deepEqual(query.focusIndicators, ["P6:6.4"]);
  assert.equal(query.scopeConfirmed, true);

  const evidence = exportJson.evidence as Record<string, unknown>;
  assert.equal(evidence.article, "Article 38");
  assert.match(String(evidence.exactPassage), /security assessment/i);
  assert.match(String(evidence.exactPassage), /standard contract/i);
  assert.equal("screenshotPath" in evidence, false);
  assert.equal("workflowTrace" in exportJson, false);
  assert.equal(result.report.finalNarrative.includes("## "), false);
  assert.equal(result.report.finalNarrative.includes("Chinese title:"), false);
  assert.equal(result.report.finalNarrative.includes("Screenshot"), false);
  assert.equal(result.report.finalNarrative.includes("**Article 38"), false);
  assert.equal(result.report.finalNarrative.includes("5. RDTII Mapping"), false);
  assert.equal(result.report.finalNarrative.includes("6. Compliance Impact"), false);
  assert.equal(result.report.finalNarrative.includes("7. Human Review Notes"), false);
  assert.equal(result.report.finalNarrative.includes("8. Export-ready Summary"), false);

  const headings = [
    "1. Direct Answer",
    "2. Regulation Snapshot",
    "3. Evidence Passage",
    "4. Plain-language Explanation"
  ];
  let previousIndex = -1;

  for (const heading of headings) {
    const index = result.report.finalNarrative.indexOf(heading);
    assert.ok(index > previousIndex, `${heading} should appear after the previous section`);
    previousIndex = index;
  }
});

test("ShopPilot case demo returns the Pillar 7 case analysis package without changing problem 1", async () => {
  const result = await runMultiAgentWorkflow("China", "Singapore", {
    businessScenario: "case analysis",
    taskType: "case-analysis",
    userQuery: SHOPPILOT_QUERY
  });

  const exportJson = result.supportingAgentResults.legalReviewExport.data?.exportJson;
  assert.ok(exportJson);
  assert.equal(exportJson.answerType, "CASE_ANALYSIS");
  assert.equal(exportJson.status, "success");

  const query = exportJson.query as Record<string, unknown>;
  assert.equal(query.taskType, "case-analysis");
  assert.equal(query.workflowMode, "case-analysis");
  assert.equal(query.countryA, "China");
  assert.equal(query.countryB, "Singapore");
  assert.equal(query.selectedPillarId, "P7");
  assert.equal(query.selectedIndicatorId, "7.4");
  assert.deepEqual(query.focusIndicators, ["P7:7.4"]);
  assert.equal(query.scopeConfirmed, true);

  const facts = exportJson.caseFactsExtracted as Record<string, unknown>;
  assert.equal(facts.isCrossBorderTransfer, true);
  assert.equal(facts.isSensitivePersonalInformationInvolved, false);
  assert.equal(facts.annualOrdinaryPersonalInformationVolume, 200000);

  assert.equal(result.mainlineAgentResults.intentArbiter.data?.selectedPillarId, "P7");
  assert.equal(result.mainlineAgentResults.intentArbiter.data?.selectedIndicatorId, "7.4");
  assert.equal(result.mainlineAgentResults.intentArbiter.data?.workflowMode, "case-analysis");
  assert.equal(result.report.finalNarrative.includes("ShopPilot AI Customer Support SaaS"), true);
  assert.equal(result.report.finalNarrative.includes("P7:7.4"), true);
  assert.equal(result.report.finalNarrative.includes("P6:6.4"), true);
  assert.equal(result.report.finalNarrative.includes("- Impact assessment:"), false);
  assert.equal(result.report.finalNarrative.includes("- Data protection officer:"), false);
  assert.equal(result.report.finalNarrative.includes("- DPO reason:"), false);
  assert.equal(result.report.finalNarrative.includes("- Reason:"), true);
  assert.equal(result.report.finalNarrative.includes("- Linked indicator:"), false);
  assert.equal(result.report.finalNarrative.includes("7. Decision Path"), false);
  assert.equal(result.report.finalNarrative.includes("CN_PIPL_ART55 (Article 55, P7)"), true);
  assert.equal(result.report.finalNarrative.includes("URL: https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm"), true);
  assert.equal(result.report.finalNarrative.includes("Pillar 7 Assessment"), true);
  assert.equal(result.report.finalNarrative.includes("mock case"), false);
  assert.equal(result.report.finalNarrative.includes("- Main compliance actions:"), false);
  assert.equal(result.report.finalNarrative.includes("- Excluded data types:"), false);
  assert.equal(result.report.finalNarrative.includes("3. Case Facts Extracted"), false);
  assert.ok(
    result.report.finalNarrative.indexOf("6. Human Review Notes") <
      result.report.finalNarrative.indexOf("7. Evidence")
  );
});

test("Singapore AI SaaS advisory demo returns the forward-looking package without changing earlier demos", async () => {
  const result = await runMultiAgentWorkflow("China", null, {
    businessScenario: "forward-looking advisory",
    taskType: "forward-looking-advisory",
    userQuery: SINGAPORE_AI_ADVISORY_QUERY
  });

  const exportJson = result.supportingAgentResults.legalReviewExport.data?.exportJson;
  assert.ok(exportJson);
  assert.equal(exportJson.answerType, "FORWARD_LOOKING_ADVISORY");
  assert.equal(exportJson.status, "needs_review");

  const query = exportJson.query as Record<string, unknown>;
  assert.equal(query.taskType, "forward-looking-advisory");
  assert.equal(query.workflowMode, "forward-looking-advisory");
  assert.equal(query.countryA, "China");
  assert.equal(query.countryB, null);
  assert.equal(query.plannedOverseasDestination, "Singapore");
  assert.equal(query.selectedPillarId, "P6");
  assert.equal(query.selectedIndicatorId, "6.4");
  assert.deepEqual(query.focusIndicators, ["P6:6.4", "P7:7.1", "P7:7.4"]);
  assert.equal(query.scopeConfirmed, true);

  const overallAssessment = exportJson.overallAssessment as Record<string, unknown>;
  assert.equal(overallAssessment.goNoGoRecommendation, "No-Go until remediation is completed");
  assert.equal(overallAssessment.riskLevel, "High before remediation; Medium after remediation");

  const findings = exportJson.possibleNonComplianceFindings as Array<Record<string, unknown>>;
  assert.equal(findings.length, 6);
  assert.equal(findings[0].findingId, "RISK_01");
  assert.match(String(findings[0].possibleLegalConflict), /Article 38|legally recognized condition/i);

  assert.equal(result.mainlineAgentResults.intentArbiter.data?.workflowMode, "forward-looking-advisory");
  assert.equal(result.mainlineAgentResults.intentArbiter.data?.selectedPillarId, "P6");
  assert.equal(result.mainlineAgentResults.intentArbiter.data?.selectedIndicatorId, "6.4");
  assert.deepEqual(result.mainlineAgentResults.intentArbiter.data?.focusIndicators, [
    "P6:6.4",
    "P7:7.1",
    "P7:7.4"
  ]);
  assert.equal(result.report.finalNarrative.includes("No-Go until remediation is completed"), true);
  assert.equal(result.report.finalNarrative.includes("RISK_01"), true);
  assert.equal(result.report.finalNarrative.includes("P7:7.4"), true);
  assert.equal(result.report.finalNarrative.includes("Grey-area Advisory"), false);
  assert.equal(result.report.finalNarrative.includes("Grey-area facts"), false);
  assert.equal(result.report.finalNarrative.includes("The risk-related segments"), true);
  assert.equal(result.report.finalNarrative.includes("7. Decision Path"), false);
  assert.equal(
    result.report.finalNarrative.includes(
      "This is a mock advisory output and should be reviewed by legal professionals before being used in a real business context."
    ),
    false
  );
  assert.equal(result.report.finalNarrative.includes("CN_PIPL_ART38 (Article 38, Items 1-4, P6)"), true);
  assert.equal(result.report.finalNarrative.includes("CN_PIPL_ART39 (Article 39, P7)"), true);
  assert.equal(result.report.finalNarrative.includes("URL: https://www.cac.gov.cn/2024-03/22/c_1712776611775634.htm"), true);
});
