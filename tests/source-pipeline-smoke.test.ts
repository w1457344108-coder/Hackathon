import test from "node:test";
import assert from "node:assert/strict";
import { resolveEvidenceContext } from "../lib/server/source-pipeline.ts";
import { countryPolicyProfiles } from "../lib/mock-data.ts";

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

test("source pipeline expands real coverage for Japan and the United States", async () => {
  const context = await resolveEvidenceContext("Japan", "United States");

  assert.equal(context.sourceMode, "real");
  assert.ok(context.evidenceRecords.some((record) => record.country === "Japan"));
  assert.ok(context.evidenceRecords.some((record) => record.country === "United States"));
  assert.ok(
    context.evidenceRecords.every((record) => !record.sourceUrl.includes("example."))
  );
  assert.ok(
    context.evidenceRecords.some((record) =>
      record.sourceUrl.includes("jpn-country-profile-en.pdf")
    )
  );
  assert.ok(context.sourceBasis.some((item) => item.includes("Competition-designated source set")));
});

test("source pipeline expands real coverage for the European Union and the United States", async () => {
  const context = await resolveEvidenceContext("European Union", "United States");

  assert.equal(context.sourceMode, "real");
  assert.ok(context.evidenceRecords.some((record) => record.country === "European Union"));
  assert.ok(context.evidenceRecords.some((record) => record.country === "United States"));
  assert.ok(context.evidenceRecords.every((record) => !record.sourceUrl.includes("example.")));
  assert.ok(
    context.evidenceRecords.some(
      (record) =>
        record.country === "European Union" && record.lawTitle.includes("Regulatory Database")
    )
  );
});

test("prototype baseline profiles no longer expose mock wording in user-facing country summaries", () => {
  for (const profile of Object.values(countryPolicyProfiles)) {
    assert.doesNotMatch(profile.dataTransferPolicy, /mock profile|demo profile|mock model/i);
    assert.doesNotMatch(profile.localizationRules, /mock profile|demo profile|mock model/i);
    assert.doesNotMatch(profile.approvalMechanism, /mock profile|demo profile|mock model/i);
    assert.doesNotMatch(profile.demoDisclaimer, /mock data/i);
    assert.match(profile.demoDisclaimer, /prototype baseline/i);
  }
});
