import test from "node:test";
import assert from "node:assert/strict";
import { runMultiAgentWorkflow } from "../lib/agents.ts";

test("demo workflow routes user-specified pillar indicators without Agent2 on the mainline", async () => {
  const result = await runMultiAgentWorkflow("China", "Singapore", {
    taskType: "case-analysis",
    userQuery:
      "For this demo, analyze Pillar 6 indicator 6.4 for employee HR data moving from China to Singapore."
  });

  const traceIds = result.agentTrace.map((item) => item.agentId);

  assert.deepEqual(traceIds, [
    "intent-arbiter",
    "document-reader",
    "indicator-mapping",
    "legal-reasoner",
    "rebuttal-agent",
    "risk-cost-quantifier",
    "audit-citation",
    "legal-review-export"
  ]);
  assert.equal(result.mainlineAgentResults.intentArbiter.data?.taskType, "case-analysis");
  assert.equal(result.mainlineAgentResults.intentArbiter.data?.workflowMode, "case-analysis");
  assert.equal(result.mainlineAgentResults.intentArbiter.data?.selectedPillarId, "P6");
  assert.equal(result.mainlineAgentResults.intentArbiter.data?.selectedIndicatorId, "6.4");
  assert.equal(result.mainlineAgentResults.intentArbiter.data?.scopeConfirmed, true);
  assert.ok(result.mainlineAgentResults.intentArbiter.data?.businessScenario);
  assert.equal("sourceDiscovery" in result.mainlineAgentResults, false);
  assert.equal("relevanceFilter" in result.supportingAgentResults, false);
  assert.ok(result.mainlineAgentResults.documentReader.data?.passages.length);
  assert.ok(result.mainlineAgentResults.documentReader.data?.passages.every((item) => item.passageId));
  assert.ok(
    result.mainlineAgentResults.indicatorMapping.data?.mappedEvidence.every(
      (item) => item.pillarId === "P6" && item.indicatorId === "6.4"
    )
  );
  assert.ok(
    result.mainlineAgentResults.legalReasoner.data?.legalFindings.every(
      (item) => item.evidenceIds.length > 0 && item.passageIds.length > 0
    )
  );
  assert.ok("rebuttalAgent" in result.supportingAgentResults);
  assert.ok(result.supportingAgentResults.rebuttalAgent.data?.reviews.length);
  assert.equal(
    typeof result.supportingAgentResults.riskCostQuantifier.data?.riskSummary.businessImpactSummary,
    "string"
  );
  assert.ok(result.supportingAgentResults.auditCitation.data);
});
