"use client";

import { useEffect, useState } from "react";
import { buildSearchProfile, preferredSourceOptions } from "@/lib/mock-evidence";
import { PreferredSourceType } from "@/lib/pillar6-schema";

export function LegalSearchWorkspace({ defaultJurisdiction }: { defaultJurisdiction: string }) {
  const [jurisdiction, setJurisdiction] = useState(defaultJurisdiction);
  const [plainLanguageQuery, setPlainLanguageQuery] = useState(
    "Find legal evidence describing how cross-border data transfers are permitted, conditioned, or restricted."
  );
  const [legalTerms, setLegalTerms] = useState(
    "cross-border transfer, personal data export, data localization, security assessment"
  );
  const [synonyms, setSynonyms] = useState(
    "offshore transfer, overseas disclosure, data export, local computing facilities"
  );
  const [exclusionTerms, setExclusionTerms] = useState("tax data, telecom tariffs, customs duty");
  const [preferredSources, setPreferredSources] = useState<PreferredSourceType[]>([
    "Official legislation portal",
    "Regulator guidance",
    "International agreement database"
  ]);
  const [profileJson, setProfileJson] = useState(() =>
    JSON.stringify(
      buildSearchProfile({
        jurisdiction: defaultJurisdiction,
        plainLanguageQuery:
          "Find legal evidence describing how cross-border data transfers are permitted, conditioned, or restricted.",
        legalTerms:
          "cross-border transfer, personal data export, data localization, security assessment",
        synonyms:
          "offshore transfer, overseas disclosure, data export, local computing facilities",
        exclusionTerms: "tax data, telecom tariffs, customs duty",
        preferredSources: [
          "Official legislation portal",
          "Regulator guidance",
          "International agreement database"
        ]
      }),
      null,
      2
    )
  );

  useEffect(() => {
    setJurisdiction(defaultJurisdiction);
  }, [defaultJurisdiction]);

  function togglePreferredSource(source: PreferredSourceType) {
    setPreferredSources((current) =>
      current.includes(source)
        ? current.filter((item) => item !== source)
        : [...current, source]
    );
  }

  function generateProfile() {
    const profile = buildSearchProfile({
      jurisdiction,
      plainLanguageQuery,
      legalTerms,
      synonyms,
      exclusionTerms,
      preferredSources
    });

    setProfileJson(JSON.stringify(profile, null, 2));
  }

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="glass-panel rounded-[2rem] border border-white/70 p-6">
        <div className="mb-5">
          <p className="section-title text-xs font-semibold text-blue-700">Legal Search Workspace</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Build a Pillar 6 Search Profile
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Jurisdiction">
            <input
              value={jurisdiction}
              onChange={(event) => setJurisdiction(event.target.value)}
              className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
            />
          </Field>

          <Field label="Preferred sources">
            <div className="grid gap-2">
              {preferredSourceOptions.map((source) => (
                <label
                  key={source}
                  className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={preferredSources.includes(source)}
                    onChange={() => togglePreferredSource(source)}
                    className="h-4 w-4 rounded border-blue-200 text-blue-600"
                  />
                  <span>{source}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-4 grid gap-4">
          <Field label="Plain-language query">
            <textarea
              value={plainLanguageQuery}
              onChange={(event) => setPlainLanguageQuery(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-400"
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Legal terms">
              <textarea
                value={legalTerms}
                onChange={(event) => setLegalTerms(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-400"
              />
            </Field>
            <Field label="Synonyms">
              <textarea
                value={synonyms}
                onChange={(event) => setSynonyms(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-400"
              />
            </Field>
            <Field label="Exclusion terms">
              <textarea
                value={exclusionTerms}
                onChange={(event) => setExclusionTerms(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-400"
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={generateProfile}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Generate Search Profile JSON
          </button>
          <span className="rounded-2xl border border-blue-100 bg-white/80 px-4 py-3 text-sm text-slate-600">
            Built for law students doing evidence discovery, mapping, and review.
          </span>
        </div>
      </div>

      <div className="glass-panel rounded-[2rem] border border-white/70 p-6">
        <p className="section-title text-xs font-semibold text-blue-700">Generated Output</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Search Profile JSON</h2>
        <pre className="mt-5 overflow-x-auto rounded-[1.5rem] border border-blue-100 bg-slate-950 p-4 text-xs leading-6 text-cyan-100">
          {profileJson}
        </pre>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
