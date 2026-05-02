import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyLegalTaskType,
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

  assert.match(getLegalReasonerInstructions("case-analysis"), /Case Facts Identified/i);
  assert.match(getReportAgentInstructions("case-analysis"), /Compliance Risk Assessment/i);

  assert.match(getLegalReasonerInstructions("forward-looking-advisory"), /Potential Legal Barriers/i);
  assert.match(getReportAgentInstructions("forward-looking-advisory"), /Compliance Roadmap/i);
});
