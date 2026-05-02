import test from "node:test";
import assert from "node:assert/strict";
import { resolveEvidenceContext } from "../lib/server/source-pipeline.ts";
import { countryPolicyProfiles } from "../lib/mock-data.ts";

const allowedHosts = new Set([
  "www.unescap.org",
  "unescap.org",
  "dtri.uneca.org",
  "www.npc.gov.cn",
  "www.cac.gov.cn",
  "sso.agc.gov.sg",
  "www.pdpc.gov.sg",
  "www.japaneselawtranslation.go.jp",
  "www.ppc.go.jp",
  "eur-lex.europa.eu",
  "data.europa.eu"
]);

test("source pipeline returns traceable evidence records for requested jurisdictions", async () => {
  const context = await resolveEvidenceContext("China", "Singapore");

  assert.ok(context.evidenceRecords.length >= 2);
  assert.ok(["real", "mock", "hybrid"].includes(context.sourceMode));
  assert.ok(context.evidenceRecords.every((record) => record.sourceUrl.startsWith("https://")));
  assert.ok(context.evidenceRecords.every((record) => record.citation.length > 0));
  assert.ok(context.evidenceRecords.every((record) => record.indicatorCode.startsWith("P6_")));
  assert.ok(
    context.evidenceRecords.every((record) => {
      const host = new URL(record.sourceUrl).host;
      return allowedHosts.has(host);
    })
  );
  assert.ok(context.evidenceRecords.every((record) => Boolean(record.sourceLocator)));
  assert.ok(context.evidenceRecords.every((record) => Boolean(record.sourceStrength)));
  assert.ok(context.evidenceRecords.every((record) => Boolean(record.traceabilityTier)));
  assert.ok(
    context.evidenceRecords.some(
      (record) =>
        record.sourceStrength === "row-level-law" ||
        record.sourceUrl.includes("unescap.org/projects/rcdtra") ||
        record.sourceUrl.includes("dtri.uneca.org/assets/data/publications/") ||
        record.sourceUrl.includes("dtri.uneca.org/v1/uploads/country-profile/")
    )
  );
  assert.ok(context.sourceBasis.some((item) => item.includes("Policy Pillar 6.Cross-border Data Policies")));
});

test("source pipeline expands real row-level legal URL coverage for Japan and Singapore", async () => {
  const context = await resolveEvidenceContext("Japan", "Singapore");

  assert.equal(context.sourceMode, "real");
  assert.ok(context.evidenceRecords.some((record) => record.country === "Japan"));
  assert.ok(context.evidenceRecords.some((record) => record.country === "Singapore"));
  assert.ok(context.evidenceRecords.every((record) => !record.sourceUrl.includes("example.")));
  assert.ok(
    context.evidenceRecords.some(
      (record) => record.country === "Japan" && record.sourceStrength === "row-level-law"
    )
  );
  assert.ok(
    context.evidenceRecords.some(
      (record) =>
        record.country === "Singapore" && record.traceabilityTier === "law-url-level"
    )
  );
  assert.ok(context.sourceBasis.some((item) => item.includes("Policy Pillar 6.Cross-border Data Policies")));
});

test("row-level legal evidence avoids RDTII score-table spillover", async () => {
  const context = await resolveEvidenceContext("Singapore");
  const singaporeLaw = context.evidenceRecords.find(
    (record) => record.country === "Singapore" && record.sourceStrength === "row-level-law"
  );

  assert.ok(singaporeLaw);
  assert.doesNotMatch(singaporeLaw.verbatimSnippet, /Pillar 1:|Pillar 2:|Pillar 3:/i);
  assert.doesNotMatch(singaporeLaw.verbatimSnippet, /Table: Singapore'?s RDTII 2025 overall score/i);
  assert.match(singaporeLaw.sourceLocator ?? "", /RDTII Policy Pillar 6/);
});

test("source pipeline expands real row-level legal URL coverage for the European Union and China", async () => {
  const context = await resolveEvidenceContext("European Union", "China");

  assert.equal(context.sourceMode, "real");
  assert.ok(context.evidenceRecords.some((record) => record.country === "European Union"));
  assert.ok(context.evidenceRecords.some((record) => record.country === "China"));
  assert.ok(context.evidenceRecords.every((record) => !record.sourceUrl.includes("example.")));
  assert.ok(
    context.evidenceRecords.some(
      (record) =>
        record.country === "European Union" && record.sourceStrength === "row-level-law"
    )
  );
  assert.ok(
    context.evidenceRecords.some(
      (record) =>
        record.country === "China" && record.sourceLocator?.includes("URL")
    )
  );
});

test("launch-stage supported jurisdictions stay within the RDTII row-level source path", async () => {
  const contexts = await Promise.all([
    resolveEvidenceContext("China"),
    resolveEvidenceContext("Singapore"),
    resolveEvidenceContext("Japan"),
    resolveEvidenceContext("European Union")
  ]);

  for (const context of contexts) {
    assert.equal(context.sourceMode, "real");
    assert.ok(context.evidenceRecords.length > 0);
    assert.ok(
      context.evidenceRecords.every((record) => {
        const host = new URL(record.sourceUrl).host;
        return allowedHosts.has(host);
      })
    );
    assert.ok(
      context.evidenceRecords.every(
        (record) => record.sourceLocator && record.sourceStrength && record.traceabilityTier
      )
    );
    assert.ok(context.evidenceRecords.some((record) => record.sourceStrength === "row-level-law"));
  }
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
