"use client";

import { useEffect, useState } from "react";
import {
  buildAiSuggestedTerms,
  buildSourceDiscoveryCandidates,
  buildSearchProfile,
  preferredSourceOptions
} from "@/lib/mock-evidence";
import {
  CandidateSource,
  PreferredSourceType,
  QueryBuilderOutput,
  QueryPlanItem,
  SearchQueryReviewStatus
} from "@/lib/types";
import { SearchProfileJson } from "@/lib/pillar6-schema";

function buildInitialProfile(defaultJurisdiction: string) {
  return buildSearchProfile({
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
  });
}

export function LegalSearchWorkspace({
  defaultJurisdiction,
  linkedQueryBuilder,
  linkedSourceDiscovery
}: {
  defaultJurisdiction: string;
  linkedQueryBuilder?: QueryBuilderOutput | null;
  linkedSourceDiscovery?: { candidateSources: CandidateSource[] } | null;
}) {
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
  const [reviewQueryPlan, setReviewQueryPlan] = useState<QueryPlanItem[] | null>(null);
  const [profile, setProfile] = useState<SearchProfileJson>(() =>
    buildInitialProfile(defaultJurisdiction)
  );

  useEffect(() => {
    setJurisdiction(defaultJurisdiction);
    setProfile(buildInitialProfile(defaultJurisdiction));
  }, [defaultJurisdiction]);

  useEffect(() => {
    setAiGeneratedTerms(buildAiSuggestedTerms(jurisdiction, businessScenario));
  }, [jurisdiction, businessScenario]);

  useEffect(() => {
    if (linkedQueryBuilder?.queryPlan) {
      setReviewQueryPlan(linkedQueryBuilder.queryPlan.map((query) => ({ ...query })));
      return;
    }

    setReviewQueryPlan(null);
  }, [linkedQueryBuilder]);

  function togglePreferredSource(source: PreferredSourceType) {
    setPreferredSources((current) =>
      current.includes(source)
        ? current.filter((item) => item !== source)
        : [...current, source]
    );
  }

  function generateProfile() {
    setProfile(
      buildSearchProfile({
        jurisdiction,
        businessScenario,
        plainLanguageQuery,
        aiGeneratedTerms,
        lawStudentTerms,
        exclusionTerms,
        preferredSources
      })
    );
  }

  function updateQueryStatus(queryId: string, nextStatus: SearchQueryReviewStatus) {
    if (reviewQueryPlan) {
      setReviewQueryPlan((current) =>
        current?.map((query) =>
          query.queryId === queryId ? { ...query, reviewerStatus: nextStatus } : query
        ) ?? null
      );
      return;
    }

    setProfile((current) => ({
      ...current,
      queryPlan: current.queryPlan.map((query) =>
        query.queryId === queryId ? { ...query, reviewerStatus: nextStatus } : query
      )
    }));
  }

  function updateQueryNote(queryId: string, nextNote: string) {
    if (reviewQueryPlan) {
      setReviewQueryPlan((current) =>
        current?.map((query) =>
          query.queryId === queryId ? { ...query, reviewerNote: nextNote } : query
        ) ?? null
      );
      return;
    }

    setProfile((current) => ({
      ...current,
      queryPlan: current.queryPlan.map((query) =>
        query.queryId === queryId ? { ...query, reviewerNote: nextNote } : query
      )
    }));
  }

  const effectiveQueryPlan = reviewQueryPlan ?? profile.queryPlan;

  const reviewCounts = effectiveQueryPlan.reduce(
    (summary, query) => {
      summary.total += 1;
      summary[query.reviewerStatus] += 1;
      return summary;
    },
    {
      total: 0,
      Suggested: 0,
      Approved: 0,
      "Needs Revision": 0,
      Rejected: 0
    } as Record<SearchQueryReviewStatus | "total", number>
  );

  const sourceDiscovery =
    linkedSourceDiscovery && reviewQueryPlan
      ? {
          candidateSources: linkedSourceDiscovery.candidateSources.filter((source) => {
            const query = effectiveQueryPlan.find((item) => item.queryId === source.queryId);
            return query?.reviewerStatus !== "Rejected";
          })
        }
      : linkedSourceDiscovery ?? buildSourceDiscoveryCandidates(profile);

  const sourceCounts = sourceDiscovery.candidateSources.reduce(
    (summary, source) => {
      summary.total += 1;
      summary[source.authorityLevel ?? "Primary"] += 1;
      if (source.retrievalStatus === "Ready for Reading") {
        summary.ready += 1;
      } else {
        summary.needsCheck += 1;
      }

      return summary;
    },
    {
      total: 0,
      Primary: 0,
      Supporting: 0,
      ready: 0,
      needsCheck: 0
    } as Record<"total" | "Primary" | "Supporting" | "ready" | "needsCheck", number>
  );

  const outputJson = JSON.stringify(
    linkedQueryBuilder
      ? {
          ...linkedQueryBuilder,
          queryPlan: effectiveQueryPlan
        }
      : profile,
    null,
    2
  );

  return (
    <section className="mt-8 grid gap-6 2xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
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

        {linkedQueryBuilder ? (
          <div className="mt-4 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Mainline Connected
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              The review board below is showing the latest mainline `Query Builder` and `Source
              Discovery` outputs from the streamed workflow, while this form remains available for
              manual hackathon tuning.
            </p>
          </div>
        ) : null}

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

      <div className="grid min-w-0 gap-6">
        <div className="glass-panel min-w-0 rounded-[2rem] border border-white/70 p-6">
          <p className="section-title text-xs font-semibold text-blue-700">Query Review Board</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-950">Structured Query Plan</h2>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {reviewCounts.total} query objects
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Each query is mapped to a specific Pillar 6 indicator and preferred source type before
            source discovery begins.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <StatusPill label="Suggested" value={reviewCounts.Suggested} tone="slate" />
            <StatusPill label="Approved" value={reviewCounts.Approved} tone="green" />
            <StatusPill
              label="Needs Revision"
              value={reviewCounts["Needs Revision"]}
              tone="amber"
            />
            <StatusPill label="Rejected" value={reviewCounts.Rejected} tone="rose" />
          </div>

          <div className="mt-5 space-y-4">
            {effectiveQueryPlan.map((query) => (
              <article
                key={query.queryId}
                className="rounded-[1.5rem] border border-blue-100 bg-white/90 p-4 shadow-sm shadow-slate-200/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {query.queryId}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-slate-950">
                      {query.indicatorCode} · {query.indicatorLabel}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <MetaBadge value={query.targetSourceType} tone="blue" />
                    <MetaBadge value={`${query.priority} priority`} tone="slate" />
                    <MetaBadge value={query.languageHint} tone="cyan" />
                  </div>
                </div>

                <div className="mt-4 rounded-[1.2rem] border border-slate-200 bg-slate-950 p-3 text-xs leading-6 text-cyan-100">
                  {query.queryText}
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">{query.whyThisQuery}</p>

                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <TermGroup title="Must terms" terms={query.mustTerms} />
                  <TermGroup title="Should terms" terms={query.shouldTerms} />
                  <TermGroup title="Exclude terms" terms={query.excludeTerms} emptyLabel="None" />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <ReviewActionButton
                    active={query.reviewerStatus === "Suggested"}
                    label="Suggest"
                    onClick={() => updateQueryStatus(query.queryId, "Suggested")}
                  />
                  <ReviewActionButton
                    active={query.reviewerStatus === "Approved"}
                    label="Approve"
                    onClick={() => updateQueryStatus(query.queryId, "Approved")}
                  />
                  <ReviewActionButton
                    active={query.reviewerStatus === "Needs Revision"}
                    label="Needs Revision"
                    onClick={() => updateQueryStatus(query.queryId, "Needs Revision")}
                  />
                  <ReviewActionButton
                    active={query.reviewerStatus === "Rejected"}
                    label="Reject"
                    onClick={() => updateQueryStatus(query.queryId, "Rejected")}
                  />
                </div>

                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-medium text-slate-600">
                    Reviewer note
                  </span>
                  <textarea
                    value={query.reviewerNote}
                    onChange={(event) => updateQueryNote(query.queryId, event.target.value)}
                    rows={3}
                    placeholder="Record why this query should stay, be revised, or be dropped."
                    className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-400"
                  />
                </label>
              </article>
            ))}
          </div>
        </div>

        <div className="glass-panel min-w-0 rounded-[2rem] border border-white/70 p-6">
          <p className="section-title text-xs font-semibold text-blue-700">
            Source Discovery Output
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-950">Candidate Source Review</h2>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {sourceCounts.total} candidate sources
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Source Discovery now consumes the structured query plan, filters for Pillar 6 scope,
            and returns authority-ranked sources that law students can spot-check before document
            reading starts.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <StatusPill label="Primary" value={sourceCounts.Primary} tone="blue" />
            <StatusPill label="Supporting" value={sourceCounts.Supporting} tone="cyan" />
            <StatusPill label="Ready to Read" value={sourceCounts.ready} tone="green" />
            <StatusPill label="Needs Check" value={sourceCounts.needsCheck} tone="amber" />
          </div>

          <div className="mt-5 space-y-4">
            {sourceDiscovery.candidateSources.map((source) => (
              <SourceCandidateCard key={source.sourceId} source={source} />
            ))}
          </div>
        </div>

        <div className="glass-panel min-w-0 rounded-[2rem] border border-white/70 p-6">
          <p className="section-title text-xs font-semibold text-blue-700">Generated Output</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {linkedQueryBuilder ? "Mainline Query Builder JSON" : "Search Profile JSON"}
          </h2>
          <pre className="mt-5 min-w-0 overflow-x-auto rounded-[1.5rem] border border-blue-100 bg-slate-950 p-4 text-xs leading-6 text-cyan-100">
            {outputJson}
          </pre>
        </div>
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

function StatusPill({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "slate" | "green" | "amber" | "rose" | "blue" | "cyan";
}) {
  const toneClasses = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700"
  };

  return (
    <div className={`rounded-[1.35rem] border px-4 py-3 ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function MetaBadge({ value, tone }: { value: string; tone: "blue" | "slate" | "cyan" }) {
  const toneClasses = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700"
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {value}
    </span>
  );
}

function TermGroup({
  title,
  terms,
  emptyLabel = "No terms"
}: {
  title: string;
  terms: string[];
  emptyLabel?: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        {terms.length > 0 ? terms.join(", ") : emptyLabel}
      </p>
    </div>
  );
}

function ReviewActionButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-slate-950 text-white"
          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

function SourceCandidateCard({ source }: { source: CandidateSource }) {
  return (
    <article className="rounded-[1.5rem] border border-blue-100 bg-white/90 p-4 shadow-sm shadow-slate-200/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {source.sourceId} · from {source.queryId ?? "query-plan"}
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">{source.title}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <MetaBadge value={String(source.sourceType)} tone="blue" />
          <MetaBadge value={source.authorityLevel ?? "Primary"} tone="slate" />
          <MetaBadge value={source.jurisdictionMatch ?? "Direct"} tone="cyan" />
        </div>
      </div>

      <a
        href={source.sourceUrl}
        className="mt-3 block text-sm font-medium text-blue-700 underline decoration-blue-200 underline-offset-4"
      >
        {source.sourceUrl}
      </a>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TermGroup
          title={`${source.indicatorId ?? "Pillar 6"} relevance`}
          terms={[source.relevanceNote]}
        />
        <TermGroup
          title={source.retrievalStatus ?? "Ready for Reading"}
          terms={[source.discoveryReason ?? source.relevanceNote]}
          emptyLabel="No discovery reason"
        />
      </div>

      <div className="mt-4 rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Matched terms
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(source.matchedTerms ?? []).map((term) => (
            <span
              key={`${source.sourceId}-${term}`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
            >
              {term}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
