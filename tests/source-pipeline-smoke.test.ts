import test from "node:test";
import assert from "node:assert/strict";
import { resolveEvidenceContext } from "../lib/server/source-pipeline.ts";
import { countryPolicyProfiles } from "../lib/mock-data.ts";

const allowedHosts = new Set([
  "www.npc.gov.cn",
  "npc.gov.cn",
  "www.cac.gov.cn",
  "cac.gov.cn",
  "www.pdpc.gov.sg",
  "pdpc.gov.sg",
  "www.ppc.go.jp",
  "ppc.go.jp",
  "eur-lex.europa.eu",
  "www.commerce.gov",
  "commerce.gov",
  "www.dataprivacyframework.gov",
  "dataprivacyframework.gov"
]);

test("source pipeline returns traceable official-source evidence for requested jurisdictions", async () => {
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
  assert.ok(context.evidenceRecords.some((record) => record.sourceUrl.includes("npc.gov.cn")));
  assert.ok(context.evidenceRecords.some((record) => record.sourceUrl.includes("pdpc.gov.sg")));
  assert.ok(
    context.sourceBasis.every(
      (item) =>
        !/competition-designated|ai_hackathon|hackathon|RDTII 2\.1 Guide|RCDTRA/i.test(item)
    )
  );
});

test("supported jurisdictions stay inside the selected official-source allowlist", async () => {
  const contexts = await Promise.all([
    resolveEvidenceContext("China"),
    resolveEvidenceContext("Singapore"),
    resolveEvidenceContext("Japan"),
    resolveEvidenceContext("European Union"),
    resolveEvidenceContext("United States")
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
  }
});

test("China evidence focuses on statute and implementing rule sources", async () => {
  const context = await resolveEvidenceContext("China");
  const combinedText = context.evidenceRecords
    .map((record) => `${record.verbatimSnippet} ${record.originalLegalText}`)
    .join(" ");

  assert.ok(
    context.evidenceRecords.some((record) =>
      record.lawTitle.includes("Personal Information Protection Law")
    )
  );
  assert.ok(
    context.evidenceRecords.some((record) =>
      record.lawTitle.includes("Provisions on Promoting and Regulating Cross-border Data Flows")
    )
  );
  assert.ok(
    /provide personal information outside the territory|跨境流动|安全评估|标准合同|认证|consent/i.test(
      combinedText
    )
  );
});

test("Singapore evidence focuses on the Transfer Limitation Obligation", async () => {
  const context = await resolveEvidenceContext("Singapore");

  assert.ok(
    context.evidenceRecords.some((record) =>
      /Transfer Limitation Obligation/i.test(record.lawTitle + record.citation + record.verbatimSnippet)
    )
  );
  assert.ok(
    context.evidenceRecords.some((record) =>
      /comparable to the protection under the PDPA/i.test(
        `${record.verbatimSnippet} ${record.originalLegalText}`
      )
    )
  );
  assert.doesNotMatch(
    context.evidenceRecords.map((record) => record.verbatimSnippet).join(" "),
    /Pillar 1:|Pillar 2:|Pillar 3:|Pillar 5:|Pillar 7:|Pillar 8:/i
  );
});

test("EU evidence surfaces GDPR Chapter V transfer conditions", async () => {
  const context = await resolveEvidenceContext("European Union");

  assert.ok(
    context.evidenceRecords.some((record) => /Article 44/i.test(record.citation))
  );
  assert.ok(
    context.evidenceRecords.some((record) => /Article 46/i.test(record.citation))
  );
  assert.ok(
    context.evidenceRecords.some((record) =>
      /third country|international organisation|appropriate safeguards/i.test(
        `${record.verbatimSnippet} ${record.originalLegalText}`
      )
    )
  );
});

test("United States evidence stays on official federal framework sources", async () => {
  const context = await resolveEvidenceContext("United States");

  assert.ok(
    context.evidenceRecords.every((record) =>
      /commerce\.gov|dataprivacyframework\.gov/i.test(record.sourceUrl)
    )
  );
  assert.ok(
    context.evidenceRecords.some((record) =>
      /Data Privacy Framework|cross-border data flows/i.test(
        `${record.lawTitle} ${record.verbatimSnippet}`
      )
    )
  );
});

test("user-facing evidence text no longer exposes hackathon wording", async () => {
  const contexts = await Promise.all([
    resolveEvidenceContext("China"),
    resolveEvidenceContext("Singapore"),
    resolveEvidenceContext("Japan"),
    resolveEvidenceContext("European Union"),
    resolveEvidenceContext("United States")
  ]);

  for (const context of contexts) {
    for (const record of context.evidenceRecords) {
      const combined = [
        record.reviewerNote,
        record.originalLegalText,
        record.aiExtraction,
        record.pillar6Mapping,
        record.mappingRationale,
        record.riskImplication
      ].join(" ");

      assert.doesNotMatch(combined, /competition-designated|ai_hackathon|hackathon/i);
    }
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
