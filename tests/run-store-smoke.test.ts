import test from "node:test";
import assert from "node:assert/strict";
import { createWorkflowRun, getWorkflowRun } from "../lib/server/run-store.ts";
import type { WorkflowResult } from "../lib/types.ts";

test("filesystem run store persists and reloads an analysis run", async () => {
  const workflowResult = {
    analysisRunId: null,
    providerId: "mock",
    providerModel: null,
    evidenceSourceMode: "mock",
    evidenceRecords: [],
    input: {
      countryA: "China",
      countryB: "Singapore",
      businessScenario: "fintech",
      taskType: "case-analysis",
      userQuery: "Test query"
    },
    research: {
      profiles: [],
      summary: "Smoke test",
      sourceBasis: ["Smoke test source basis"]
    },
    policyAnalysis: [],
    comparison: null,
    report: {
      title: "Smoke test report",
      overallRisk: "Low",
      finalNarrative: "Smoke test narrative",
      policyRecommendations: ["Smoke test recommendation"],
      comparisonTable: []
    },
    mainlineAgentResults: {
      intentArbiter: {
        status: "success",
        agentId: "intent-arbiter",
        data: {
          normalizedIntent: "Smoke test intent",
          workflowMode: "cross-jurisdiction",
          taskType: "case-analysis",
          pillar6ScopeConfirmed: true,
          focusIndicators: ["P6_4_CONDITIONAL_FLOW"]
        },
        message: "ok"
      },
      sourceDiscovery: {
        status: "success",
        agentId: "source-discovery",
        data: {
          candidateSources: []
        },
        message: "ok"
      },
      documentReader: {
        status: "success",
        agentId: "document-reader",
        data: {
          passages: []
        },
        message: "ok"
      },
      indicatorMapping: {
        status: "success",
        agentId: "indicator-mapping",
        data: {
          mappedEvidence: []
        },
        message: "ok"
      },
      legalReasoner: {
        status: "success",
        agentId: "legal-reasoner",
        data: {
          legalFindings: []
        },
        message: "ok"
      }
    },
    supportingAgentResults: {
      queryBuilder: {
        status: "success",
        agentId: "query-builder",
        data: {
          normalizedIntent: "Smoke test intent",
          sourcePriorityOrder: ["Official legislation portal"],
          queryPlan: [],
          searchQueries: [],
          targetIndicators: ["P6_4_CONDITIONAL_FLOW"],
          reviewChecklist: []
        },
        message: "ok"
      },
      relevanceFilter: {
        status: "success",
        agentId: "relevance-filter",
        data: {
          shortlistedPassages: [],
          filteredOutEvidenceIds: [],
          reviewSummary: {
            shortlistedCount: 0,
            filteredOutCount: 0,
            humanReviewCount: 0
          },
          reviewerChecklist: []
        },
        message: "ok"
      },
      riskCostQuantifier: {
        status: "success",
        agentId: "risk-cost-quantifier",
        data: {
          riskSummary: {
            riskLevel: "Low",
            businessCostDrivers: [],
            operationalImpact: "Smoke test impact",
            uncertaintyLevel: "Low",
            humanReviewNeeded: false
          }
        },
        message: "ok"
      },
      auditCitation: {
        status: "success",
        agentId: "audit-citation",
        data: {
          auditItems: [],
          coverageSummary: {
            totalFindings: 0,
            linkedFindings: 0,
            needsReviewCount: 0
          }
        },
        message: "ok"
      },
      legalReviewExport: {
        status: "success",
        agentId: "legal-review-export",
        data: {
          finalReport: "Smoke test final report",
          judgeSummary: "Smoke test summary",
          exportReadiness: "Ready for Judge Review",
          reviewSummary: {
            approvedCount: 0,
            needsRevisionCount: 0,
            rejectedCount: 0,
            humanReviewCount: 0
          },
          exportJson: {},
          exportCsvRows: [],
          exportMarkdown: "# Smoke"
        },
        message: "ok"
      }
    },
    agentTrace: [],
    demoNarrative: {
      title: "Smoke narrative",
      scenario: "Smoke scenario",
      primaryJurisdiction: "China",
      comparisonJurisdiction: "Singapore",
      walkthrough: [],
      successCriteria: []
    },
    generatedAt: new Date().toISOString()
  } satisfies WorkflowResult;

  const created = await createWorkflowRun(workflowResult);
  const loaded = await getWorkflowRun(created.runId);

  assert.equal(loaded.runId, created.runId);
  assert.equal(loaded.workflowResult.input.countryA, "China");
  assert.equal(loaded.workflowResult.report.title, "Smoke test report");
});
