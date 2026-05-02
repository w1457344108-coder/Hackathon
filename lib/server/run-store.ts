import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { EvidenceReviewStatus } from "../pillar6-schema";
import type { WorkflowResult } from "../types";

const DEFAULT_LOCAL_STORE_ROOT = resolve(process.cwd(), "data", "runtime");
const DEFAULT_VERCEL_STORE_ROOT = resolve("/tmp", "cross-border-data-policy-multi-agent-analyst");
const STORE_ROOT = resolve(
  process.env.RUN_STORE_ROOT ||
    (process.env.VERCEL ? DEFAULT_VERCEL_STORE_ROOT : DEFAULT_LOCAL_STORE_ROOT)
);
const RUNS_DIR = resolve(STORE_ROOT, "runs");
const inMemoryRuns = new Map<string, StoredWorkflowRun>();

export interface StoredEvidenceReview {
  evidenceId: string;
  reviewStatus: EvidenceReviewStatus;
  reviewerNote: string;
  updatedAt: string;
}

interface StoredWorkflowRun {
  runId: string;
  createdAt: string;
  updatedAt: string;
  workflowResult: WorkflowResult;
}

async function ensureStore() {
  await mkdir(RUNS_DIR, { recursive: true });
}

function getRunFilePath(runId: string) {
  return resolve(RUNS_DIR, `${runId}.json`);
}

async function writeRun(run: StoredWorkflowRun) {
  inMemoryRuns.set(run.runId, run);

  try {
    await ensureStore();
    await writeFile(getRunFilePath(run.runId), JSON.stringify(run, null, 2), "utf8");
  } catch {
    // Serverless deployments can reject writes outside /tmp. Keep an in-memory
    // fallback so the active request can still complete gracefully.
  }
}

export async function createWorkflowRun(workflowResult: WorkflowResult) {
  const runId = workflowResult.analysisRunId ?? randomUUID();
  const now = new Date().toISOString();
  const storedRun: StoredWorkflowRun = {
    runId,
    createdAt: now,
    updatedAt: now,
    workflowResult: {
      ...workflowResult,
      analysisRunId: runId
    }
  };

  await writeRun(storedRun);

  return {
    runId,
    filePath: getRunFilePath(runId)
  };
}

export async function getWorkflowRun(runId: string) {
  try {
    const file = await readFile(getRunFilePath(runId), "utf8");
    return JSON.parse(file) as StoredWorkflowRun;
  } catch (error) {
    const cachedRun = inMemoryRuns.get(runId);

    if (cachedRun) {
      return cachedRun;
    }

    throw error;
  }
}

export async function saveWorkflowRun(workflowResult: WorkflowResult) {
  if (!workflowResult.analysisRunId) {
    return createWorkflowRun(workflowResult);
  }

  const now = new Date().toISOString();
  const storedRun = await getWorkflowRun(workflowResult.analysisRunId).catch(() => null);
  const createdAt = storedRun?.createdAt ?? now;

  await writeRun({
    runId: workflowResult.analysisRunId,
    createdAt,
    updatedAt: now,
    workflowResult
  });

  return {
    runId: workflowResult.analysisRunId,
    filePath: getRunFilePath(workflowResult.analysisRunId)
  };
}

export async function updateWorkflowRun(
  runId: string,
  updater: (workflowResult: WorkflowResult) => WorkflowResult
) {
  const storedRun = await getWorkflowRun(runId);
  const updatedWorkflowResult = updater(storedRun.workflowResult);
  const nextRun: StoredWorkflowRun = {
    ...storedRun,
    updatedAt: new Date().toISOString(),
    workflowResult: updatedWorkflowResult
  };

  await writeRun(nextRun);
  return nextRun.workflowResult;
}
