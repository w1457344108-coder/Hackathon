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
    const nextIndex = content.indexOf(item);

    if (nextIndex === -1) {
      throw new Error(`${file} is missing ordered item: ${item}`);
    }

    if (nextIndex <= lastIndex) {
      throw new Error(`${file} has ${item} out of mainline order.`);
    }

    lastIndex = nextIndex;
  }
}

const mainlineOrder = [
  "intent-arbiter",
  "source-discovery",
  "document-reader",
  "indicator-mapping",
  "legal-reasoner"
];

assertIncludes("lib/types.ts", "export interface AgentResult");
assertIncludes("lib/types.ts", "export interface IntentArbiterOutput");
assertIncludes("lib/types.ts", "export interface SourceDiscoveryOutput");
assertIncludes("lib/types.ts", "export interface DocumentReaderOutput");
assertIncludes("lib/types.ts", "export interface IndicatorMappingOutput");
assertIncludes("lib/types.ts", "export interface LegalReasonerOutput");
assertIncludes("lib/types.ts", "export interface MainlineAgentResults");
assertIncludes("lib/types.ts", "mainlineAgentResults");

assertIncludes("lib/agents.ts", "runMainlineAgents");
assertIncludes("lib/agents.ts", "intentArbiterAgent");
assertIncludes("lib/agents.ts", "sourceDiscoveryAgent");
assertIncludes("lib/agents.ts", "documentReaderAgent");
assertIncludes("lib/agents.ts", "indicatorMappingAgent");
assertIncludes("lib/agents.ts", "legalReasonerAgent");
assertOrdered("lib/agents.ts", mainlineOrder);

assertIncludes("README.md", "Mainline agent orchestration");
assertIncludes("package.json", "validate:mainline");

console.log("Mainline agent orchestration checks passed.");
