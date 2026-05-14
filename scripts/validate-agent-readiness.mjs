import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function assertIncludes(file, expected) {
  const content = read(file);

  if (!content.includes(expected)) {
    throw new Error(`${file} must include: ${expected}`);
  }
}

function assertOrdered(file, expectedItems) {
  const content = read(file);
  let lastIndex = -1;

  for (const item of expectedItems) {
    const nextIndex = content.indexOf(item, lastIndex + 1);

    if (nextIndex === -1) {
      throw new Error(`${file} is missing ordered item: ${item}`);
    }

    if (nextIndex <= lastIndex) {
      throw new Error(`${file} has ${item} out of orchestration order.`);
    }

    lastIndex = nextIndex;
  }
}

const workflowAgentOrder = [
  "intent-arbiter",
  "document-reader",
  "indicator-mapping",
  "legal-reasoner",
  "rebuttal-agent",
  "risk-cost-quantifier",
  "audit-citation",
  "legal-review-export"
];

assertIncludes("lib/types.ts", "export interface WorkflowAgentTrace");
assertIncludes("lib/types.ts", "export interface DemoNarrative");
assertIncludes("lib/types.ts", "humanReviewGate");
assertIncludes("lib/agents.ts", "buildWorkflowAgentTrace");
assertIncludes("lib/agents.ts", "agentTrace");
assertIncludes("lib/agents.ts", "demoNarrative");
assertOrdered("lib/agents.ts", workflowAgentOrder);
assertIncludes("lib/agents.ts", "queryBuilderAgent");
assertIncludes("docs/agent-parameters.md", "Canonical field casing");
assertIncludes("docs/agent-parameters.md", "camelCase");
assertIncludes("docs/agent-parameters.md", "Human review gates");
assertIncludes("README.md", "Current implementation boundary");
assertIncludes("README.md", "Demo narrative");
assertIncludes("README.md", "Demo workflow readiness");

console.log("Agent orchestration readiness checks passed.");
