import test from "node:test";
import assert from "node:assert/strict";
import {
  detectUnsupportedJurisdictions,
  inferCountries
} from "../lib/jurisdiction-inference.ts";

test("inferCountries maps supported jurisdictions from English prompts", () => {
  assert.deepEqual(
    inferCountries("Find official legal evidence for cross-border transfer rules in China and Singapore."),
    {
      countryA: "China",
      countryB: "Singapore"
    }
  );
});

test("detectUnsupportedJurisdictions flags unsupported jurisdictions instead of silently defaulting", () => {
  assert.deepEqual(
    detectUnsupportedJurisdictions("Search for data localization rules in Vietnam."),
    ["Vietnam"]
  );
});
