import test from "node:test";
import assert from "node:assert/strict";
import { resolveEvidenceContext } from "../lib/server/source-pipeline.ts";

test("source pipeline returns traceable evidence records for requested jurisdictions", async () => {
  const context = await resolveEvidenceContext("China", "Singapore");

  assert.ok(context.evidenceRecords.length >= 2);
  assert.ok(["real", "mock", "hybrid"].includes(context.sourceMode));
  assert.ok(context.evidenceRecords.every((record) => record.sourceUrl.startsWith("https://")));
  assert.ok(context.evidenceRecords.every((record) => record.citation.length > 0));
  assert.ok(context.evidenceRecords.every((record) => record.indicatorCode.startsWith("P6_")));
  assert.ok(
    context.evidenceRecords.some(
      (record) =>
        record.sourceUrl.includes("unescap.org/projects/rcdtra") ||
        record.sourceUrl.includes("dtri.uneca.org/assets/data/publications/")
    )
  );
  assert.ok(context.sourceBasis.some((item) => item.includes("Competition-designated source set")));
});
