import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyLegalTaskType,
  buildModeSpecificReportFallback,
  getLegalReasonerInstructions,
  getReportAgentInstructions,
  intentArbiterAgent
} from "../lib/agents.ts";

test("legal task labels map to explicit task types", () => {
  assert.equal(classifyLegalTaskType("regulation interpretation"), "regulation-interpretation");
  assert.equal(classifyLegalTaskType("case analysis"), "case-analysis");
  assert.equal(classifyLegalTaskType("forward-looking advisory"), "forward-looking-advisory");
});

test("intent arbiter produces mode-specific normalized intents", () => {
  const sharedInput = {
    countryA: "China" as const,
    countryB: "Singapore" as const,
    userQuery: "Can customer personal data be transferred for cloud analytics?"
  };

  const regulationIntent = intentArbiterAgent({
    ...sharedInput,
    businessScenario: "regulation interpretation"
  }).data;
  const caseIntent = intentArbiterAgent({
    ...sharedInput,
    businessScenario: "case analysis"
  }).data;
  const advisoryIntent = intentArbiterAgent({
    ...sharedInput,
    businessScenario: "forward-looking advisory"
  }).data;

  assert.equal(regulationIntent?.taskType, "regulation-interpretation");
  assert.equal(caseIntent?.taskType, "case-analysis");
  assert.equal(advisoryIntent?.taskType, "forward-looking-advisory");
  assert.match(regulationIntent?.normalizedIntent ?? "", /explain/i);
  assert.match(caseIntent?.normalizedIntent ?? "", /existing case|facts/i);
  assert.match(advisoryIntent?.normalizedIntent ?? "", /planned|future|market-entry/i);
  assert.notEqual(regulationIntent?.normalizedIntent, caseIntent?.normalizedIntent);
  assert.notEqual(caseIntent?.normalizedIntent, advisoryIntent?.normalizedIntent);
});

test("legal reasoner and report prompts are complete for each task type", () => {
  assert.match(getLegalReasonerInstructions("regulation-interpretation"), /Rule Explanation/i);
  assert.match(getReportAgentInstructions("regulation-interpretation"), /Legal Source Located/i);
  assert.doesNotMatch(getLegalReasonerInstructions("regulation-interpretation"), /Pillar 7/i);
  assert.doesNotMatch(getReportAgentInstructions("regulation-interpretation"), /Pillar 7/i);

  assert.match(getLegalReasonerInstructions("case-analysis"), /Case Facts Identified/i);
  assert.match(getReportAgentInstructions("case-analysis"), /Compliance Risk Assessment/i);

  assert.match(getLegalReasonerInstructions("forward-looking-advisory"), /Potential Legal Barriers/i);
  assert.match(getReportAgentInstructions("forward-looking-advisory"), /Compliance Roadmap/i);
});

test("mode-specific report fallback preserves user facts and produces task-specific content", () => {
  const caseReport = buildModeSpecificReportFallback({
    taskType: "case-analysis",
    userQuery:
      "Our company already transfers employee HR data from Singapore to Japan for payroll processing.",
    countryA: "Singapore",
    countryB: "Japan",
    overallRisk: "Low",
    evidenceSummary: "Singapore requires comparable protection; Japan requires a valid transfer basis.",
    sourceLimit: "Source limits test.",
    evidenceLabels: ["PDPA Transfer Limitation", "APPI foreign third party guidance"],
    sourceUrls: ["https://www.pdpc.gov.sg/example", "https://www.ppc.go.jp/example"]
  });

  assert.match(caseReport.finalNarrative, /employee HR data/i);
  assert.match(caseReport.finalNarrative, /payroll/i);
  assert.match(caseReport.finalNarrative, /controller|processor|recipient/i);
  assert.match(caseReport.finalNarrative, /comparable protection/i);
  assert.match(caseReport.policyRecommendations.join(" "), /contract|transfer mechanism/i);

  const advisoryReport = buildModeSpecificReportFallback({
    taskType: "forward-looking-advisory",
    userQuery:
      "We plan to launch a new AI health analytics service in Japan using cloud infrastructure in Singapore.",
    countryA: "Japan",
    countryB: "Singapore",
    overallRisk: "Low",
    evidenceSummary: "Japan and Singapore both require a lawful cross-border transfer basis.",
    sourceLimit: "Source limits test.",
    evidenceLabels: ["APPI foreign transfer guidance", "PDPA Transfer Limitation"],
    sourceUrls: ["https://www.ppc.go.jp/example", "https://www.pdpc.gov.sg/example"]
  });

  assert.match(advisoryReport.finalNarrative, /AI health analytics/i);
  assert.match(advisoryReport.finalNarrative, /cloud infrastructure/i);
  assert.match(advisoryReport.finalNarrative, /sensitive|health/i);
  assert.match(advisoryReport.finalNarrative, /pre-launch|launch/i);
  assert.match(advisoryReport.policyRecommendations.join(" "), /roadmap|before launch/i);

  const regulationReport = buildModeSpecificReportFallback({
    taskType: "regulation-interpretation",
    userQuery: "Explain the PIPL rule for transferring personal information outside China.",
    countryA: "China",
    countryB: "Singapore",
    overallRisk: "High",
    evidenceSummary: "PIPL Chapter III imposes conditions on outbound personal-information transfers.",
    sourceLimit: "Source limits test.",
    evidenceLabels: ["PIPL Chapter III", "CAC outbound data flow provisions"],
    sourceUrls: ["https://www.npc.gov.cn/example", "https://www.cac.gov.cn/example"]
  });

  assert.match(regulationReport.finalNarrative, /PIPL/i);
  assert.match(regulationReport.finalNarrative, /legal elements/i);
  assert.match(regulationReport.finalNarrative, /conditions|requirements/i);
  assert.match(regulationReport.policyRecommendations.join(" "), /exact article|clause/i);
});
