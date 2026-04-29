"use client";

import { useEffect, useState } from "react";
import {
  buildAiSuggestedTerms,
  buildSearchProfile,
  preferredSourceOptions
} from "@/lib/mock-evidence";
import { PreferredSourceType } from "@/lib/pillar6-schema";

export function LegalSearchWorkspace({ defaultJurisdiction }: { defaultJurisdiction: string }) {
  const [jurisdiction, setJurisdiction] = useState(defaultJurisdiction);
  const [businessScenario, setBusinessScenario] = useState("fintech");
  const [plainLanguageQuery, setPlainLanguageQuery] = useState(
    "Find legal evidence describing how cross-border data transfers are permitted, conditioned, or restricted."
  );
  const [aiGeneratedTerms, setAiGeneratedTerms] = useState(
    buildAiSuggestedTerms(defaultJurisdiction, "fintech")
  );
  const [lawStudentTerms, setLawStudentTerms] = useState(
    "important data, transfer mechanism, regulator approval"
  );
  const [exclusionTerms, setExclusionTerms] = useState("tax data, telecom tariffs, customs duty");
  const [preferredSources, setPreferredSources] = useState<PreferredSourceType[]>([
    "Official legislation portal",
    "Regulator guidance",
    "Government ministry website",
    "RDTII / UN ESCAP source"
  ]);
  const [profileJson, setProfileJson] = useState(() =>
    JSON.stringify(
      buildSearchProfile({
        jurisdiction: defaultJurisdiction,
        businessScenario: "fintech",
        plainLanguageQuery:
          "Find legal evidence describing how cross-border data transfers are permitted, conditioned, or restricted.",
        aiGeneratedTerms: buildAiSuggestedTerms(defaultJurisdiction, "fintech"),
        lawStudentTerms: "important data, transfer mechanism, regulator approval",
        exclusionTerms: "tax data, telecom tariffs, customs duty",
        preferredSources: [
          "Official legislation portal",
          "Regulator guidance",
          "Government ministry website",
          "RDTII / UN ESCAP source"
        ]
      }),
      null,
      2
    )
  );

  useEffect(() => {
    setJurisdiction(defaultJurisdiction);
  }, [defaultJurisdiction]);

  useEffect(() => {
    setAiGeneratedTerms(buildAiSuggestedTerms(jurisdiction, businessScenario));
  }, [jurisdiction, businessScenario]);

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
      businessScenario,
      plainLanguageQuery,
      aiGeneratedTerms,
      lawStudentTerms,
      exclusionTerms,
      preferredSources
    });

    setProfileJson(JSON.stringify(profile, null, 2));
  }

  return (
    <section className="mt-8 grid gap-6 2xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div className="glass-panel min-w-0 rounded-[2rem] border border-white/70 p-6">
        <div className="mb-5">
          <p className="section-title text-xs font-semibold text-blue-700">Legal Search Workspace</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Build a Pillar 6 Search Profile
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Designed for human-in-the-loop legal evidence discovery. Query Builder Agent proposes
            an initial term set, and law students can refine it before generating the final search
            profile JSON.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Human-in-the-Loop Review
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Law students should review the AI-suggested legal terms, add specialist vocabulary,
            and tighten exclusion terms before locking the Pillar 6 search profile.
          </p>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <Field label="1. Plain-language user query">
            <textarea
              value={plainLanguageQuery}
              onChange={(event) => setPlainLanguageQuery(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-400"
            />
          </Field>

          <div className="grid gap-4">
            <Field label="2. Jurisdiction">
              <input
                value={jurisdiction}
                onChange={(event) => setJurisdiction(event.target.value)}
                className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
              />
            </Field>

            <Field label="3. Business scenario">
              <input
                value={businessScenario}
                onChange={(event) => setBusinessScenario(event.target.value)}
                placeholder="fintech, e-commerce, cloud service, health data platform"
                className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
              />
            </Field>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <Field label="4. Legal terms suggested by AI">
            <textarea
              value={aiGeneratedTerms}
              onChange={(event) => setAiGeneratedTerms(event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-cyan-100 bg-cyan-50/60 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-cyan-400"
            />
          </Field>

          <Field label="5. Legal terms added by law students">
            <textarea
              value={lawStudentTerms}
              onChange={(event) => setLawStudentTerms(event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-400"
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Field label="6. Exclusion terms">
            <textarea
              value={exclusionTerms}
              onChange={(event) => setExclusionTerms(event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-400"
            />
          </Field>

          <Field label="7. Preferred source types">
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

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={generateProfile}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            8. Generate Search Profile JSON
          </button>
          <span className="rounded-2xl border border-blue-100 bg-white/80 px-4 py-3 text-sm text-slate-600">
            Law students can tune the evidence search path before the downstream Pillar 6 agents run.
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <ReviewHint
            title="Student role"
            text="Add specialist legal terms and narrow the research scope to concrete Pillar 6 rules."
          />
          <ReviewHint
            title="AI role"
            text="Suggest jurisdiction- and business-specific terms that align with transfer, localization, and commitments."
          />
          <ReviewHint
            title="Review goal"
            text="Produce a search profile that is precise enough for evidence discovery and later citation review."
          />
        </div>
      </div>

      <div className="glass-panel min-w-0 rounded-[2rem] border border-white/70 p-6">
        <p className="section-title text-xs font-semibold text-blue-700">Generated Output</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Search Profile JSON</h2>
        <pre className="mt-5 min-w-0 overflow-x-auto rounded-[1.5rem] border border-blue-100 bg-slate-950 p-4 text-xs leading-6 text-cyan-100">
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

function ReviewHint({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.35rem] border border-blue-100 bg-white/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
