import test from "node:test";
import assert from "node:assert/strict";
import {
  demoPrompts,
  getDemoJurisdictionDefaults,
  getDemoPromptForMode
} from "../lib/demo-prompts.ts";

test("demo prompts provide one ready-to-use mock question per front-end mode", () => {
  assert.deepEqual(Object.keys(demoPrompts).sort(), ["advisory", "case", "regulation"]);
  assert.match(getDemoPromptForMode("regulation"), /RDTII Pillar 6, Indicator 6\.4/i);
  assert.match(getDemoPromptForMode("case"), /ShopPilot AI operates in China/i);
  assert.match(getDemoPromptForMode("case"), /Pillar 7, Indicator 7\.4/i);
  assert.match(getDemoPromptForMode("advisory"), /Singapore AI SaaS company/i);
  assert.match(getDemoPromptForMode("advisory"), /standard privacy policy/i);
});

test("demo prompts pin the intended jurisdictions for each mode", () => {
  assert.deepEqual(getDemoJurisdictionDefaults("regulation"), {
    countryA: "China",
    countryB: "Singapore"
  });
  assert.deepEqual(getDemoJurisdictionDefaults("case"), {
    countryA: "China",
    countryB: "Singapore"
  });
  assert.deepEqual(getDemoJurisdictionDefaults("advisory"), {
    countryA: "China",
    countryB: "Singapore"
  });
});
