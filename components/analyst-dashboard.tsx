"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { supportedCountries } from "@/lib/mock-data";
import {
  AgentStatus,
  ComparisonAgentResult,
  PolicyAnalysisResult,
  ReportAgentResult,
  ResearchAgentResult,
  StreamEventName,
  SupportedCountry,
  WorkflowResult
} from "@/lib/types";

type AgentKey = "research" | "policy" | "comparison" | "report";

interface AgentCardState<T> {
  status: AgentStatus;
  title: string;
  subtitle: string;
  data: T | null;
}

interface DashboardState {
  research: AgentCardState<ResearchAgentResult>;
  policy: AgentCardState<PolicyAnalysisResult[]>;
  comparison: AgentCardState<ComparisonAgentResult>;
  report: AgentCardState<ReportAgentResult>;
}

const initialState: DashboardState = {
  research: {
    status: "idle",
    title: "Research Agent",
    subtitle: "Collects country policy evidence mapped to ESCAP Pillar 6.",
    data: null
  },
  policy: {
    status: "idle",
    title: "Policy Analysis Agent",
    subtitle: "Evaluates restrictiveness, openness, and compliance burden.",
    data: null
  },
  comparison: {
    status: "idle",
    title: "Comparison Agent",
    subtitle: "Highlights gap analysis across two jurisdictions.",
    data: null
  },
  report: {
    status: "idle",
    title: "Report Agent",
    subtitle: "Synthesizes the full multi-agent outcome into a final brief.",
    data: null
  }
};

const stepOrder: AgentKey[] = ["research", "policy", "comparison", "report"];

function statusClasses(status: AgentStatus) {
  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50/70";
  }

  if (status === "running") {
    return "border-blue-300 bg-blue-50/80";
  }

  if (status === "error") {
    return "border-red-200 bg-red-50/80";
  }

  return "border-white/70 bg-white/60";
}

function dotClasses(status: AgentStatus) {
  if (status === "completed") {
    return "bg-emerald-500";
  }

  if (status === "running") {
    return "bg-blue-500 glow-dot";
  }

  if (status === "error") {
    return "bg-red-500";
  }

  return "bg-slate-300";
}

function cloneInitialState(): DashboardState {
  return {
    research: { ...initialState.research },
    policy: { ...initialState.policy },
    comparison: { ...initialState.comparison },
    report: { ...initialState.report }
  };
}

function markCompletedIfRunning<T>(card: AgentCardState<T>): AgentCardState<T> {
  if (card.status !== "running") {
    return card;
  }

  return {
    ...card,
    status: "completed"
  };
}

export function AnalystDashboard() {
  const [countryA, setCountryA] = useState<SupportedCountry>("China");
  const [countryB, setCountryB] = useState<SupportedCountry | "">("Singapore");
  const [dashboard, setDashboard] = useState<DashboardState>(cloneInitialState);
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const deferredReport = useDeferredValue(dashboard.report.data);

  function resetAgents() {
    const base = cloneInitialState();
    base.research.status = "running";
    setDashboard(base);
    setWorkflowResult(null);
    setErrorMessage(null);
  }

  function setRunningStep(step: AgentKey) {
    startTransition(() => {
      setDashboard((current) => {
        const next: DashboardState = {
          research: markCompletedIfRunning(current.research),
          policy: markCompletedIfRunning(current.policy),
          comparison: markCompletedIfRunning(current.comparison),
          report: markCompletedIfRunning(current.report)
        };

        switch (step) {
          case "research":
            next.research = {
              ...next.research,
              status: "running"
            };
            break;
          case "policy":
            next.policy = {
              ...next.policy,
              status: "running"
            };
            break;
          case "comparison":
            next.comparison = {
              ...next.comparison,
              status: "running"
            };
            break;
          case "report":
            next.report = {
              ...next.report,
              status: "running"
            };
            break;
        }

        return next;
      });
    });
  }

  function setResearchCompleted(data: ResearchAgentResult) {
    startTransition(() => {
      setDashboard((current) => ({
        ...current,
        research: {
          ...current.research,
          status: "completed",
          data
        }
      }));
    });
  }

  function setPolicyCompleted(data: PolicyAnalysisResult[]) {
    startTransition(() => {
      setDashboard((current) => ({
        ...current,
        policy: {
          ...current.policy,
          status: "completed",
          data
        }
      }));
    });
  }

  function setComparisonCompleted(data: ComparisonAgentResult) {
    startTransition(() => {
      setDashboard((current) => ({
        ...current,
        comparison: {
          ...current.comparison,
          status: "completed",
          data
        }
      }));
    });
  }

  function setReportCompleted(data: ReportAgentResult) {
    startTransition(() => {
      setDashboard((current) => ({
        ...current,
        report: {
          ...current.report,
          status: "completed",
          data
        }
      }));
    });
  }

  async function runAnalysis() {
    setIsRunning(true);
    resetAgents();

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          countryA,
          countryB: countryB || null
        })
      });

      if (!response.ok || !response.body) {
        throw new Error("Unable to start the analysis stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const lines = chunk.split("\n");
          const eventLine = lines.find((line) => line.startsWith("event: "));
          const dataLine = lines.find((line) => line.startsWith("data: "));

          if (!eventLine || !dataLine) {
            continue;
          }

          const eventName = eventLine.replace("event: ", "") as StreamEventName;
          const payload = JSON.parse(dataLine.replace("data: ", ""));

          if (eventName === "research") {
            setResearchCompleted(payload as ResearchAgentResult);
            setRunningStep("policy");
          }

          if (eventName === "policy") {
            setPolicyCompleted(payload as PolicyAnalysisResult[]);
            if (countryB) {
              setRunningStep("comparison");
            } else {
              setRunningStep("report");
            }
          }

          if (eventName === "comparison") {
            setComparisonCompleted(payload as ComparisonAgentResult);
            setRunningStep("report");
          }

          if (eventName === "report") {
            setReportCompleted(payload as ReportAgentResult);
          }

          if (eventName === "done") {
            setWorkflowResult(payload as WorkflowResult);
          }

          if (eventName === "error") {
            throw new Error(payload.message as string);
          }
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unexpected error while running the workflow."
      );

      setDashboard((current) => ({
        research: {
          ...current.research,
          status: current.research.data ? "completed" : "error"
        },
        policy: {
          ...current.policy,
          status: current.policy.data ? "completed" : "error"
        },
        comparison: {
          ...current.comparison,
          status: current.comparison.data ? "completed" : "error"
        },
        report: {
          ...current.report,
          status: current.report.data ? "completed" : "error"
        }
      }));
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="glass-panel stagger-in overflow-hidden rounded-[2rem] border border-white/70 px-6 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <span className="section-title inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
              United Nations AI Hackathon Demo
            </span>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Cross-Border Data Policy Multi-Agent Analyst
              </h1>
              <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                A hackathon-ready dashboard for cross-border data policy analysis based on UN ESCAP
                RDTII Pillar 6 logic. This phase uses structured mock data, but the agent workflow
                and API surface are already prepared for future OpenAI integration.
              </p>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
            <label className="rounded-3xl border border-white/80 bg-white/80 p-4 shadow-sm">
              <span className="mb-2 block text-sm font-medium text-slate-600">Country A</span>
              <select
                value={countryA}
                onChange={(event) => setCountryA(event.target.value as SupportedCountry)}
                className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400"
              >
                {supportedCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-3xl border border-white/80 bg-white/80 p-4 shadow-sm">
              <span className="mb-2 block text-sm font-medium text-slate-600">Country B</span>
              <select
                value={countryB}
                onChange={(event) => setCountryB(event.target.value as SupportedCountry | "")}
                className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400"
              >
                <option value="">None</option>
                {supportedCountries.map((country) => (
                  <option key={country} value={country} disabled={country === countryA}>
                    {country}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-blue-100 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatChip label="Mode" value="Mock + Streaming Agents" />
            <StatChip label="Framework" value="Next.js App Router" />
            <StatChip label="Ready For" value="Vercel Deployment" />
          </div>

          <button
            type="button"
            onClick={runAnalysis}
            disabled={isRunning}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isRunning ? "Multi-Agent Analysis Running..." : "Run Multi-Agent Analysis"}
          </button>
        </div>

        <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-slate-600">
          Built on official source structure from UN ESCAP RDTII. The demo models Pillar 6 policy
          dimensions such as local processing, local storage, infrastructure requirements,
          conditional transfer regimes, and binding data transfer commitments.
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <AgentCard state={dashboard.research}>
          {dashboard.research.data ? <ResearchContent data={dashboard.research.data} /> : null}
        </AgentCard>
        <AgentCard state={dashboard.policy}>
          {dashboard.policy.data ? <PolicyContent data={dashboard.policy.data} /> : null}
        </AgentCard>
        <AgentCard state={dashboard.comparison}>
          {dashboard.comparison.data ? <ComparisonContent data={dashboard.comparison.data} /> : null}
        </AgentCard>
        <AgentCard state={dashboard.report}>
          {dashboard.report.data ? <ReportPreview data={dashboard.report.data} /> : null}
        </AgentCard>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel stagger-in rounded-[2rem] border border-white/70 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="section-title text-xs font-semibold text-blue-700">Final Report</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Executive Brief</h2>
            </div>
            <RiskPill risk={deferredReport?.overallRisk ?? workflowResult?.report.overallRisk ?? "Low"} />
          </div>

          <p className="text-base leading-8 text-slate-700">
            {deferredReport?.finalNarrative ??
              "Run the workflow to generate a synthesized cross-border policy report, risk score, and action-oriented recommendations."}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <PanelBox title="Policy Recommendations">
              <ul className="space-y-3 text-sm leading-6 text-slate-700">
                {(deferredReport?.policyRecommendations ?? defaultRecommendations).map((item) => (
                  <li key={item} className="rounded-2xl bg-slate-50 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </PanelBox>

            <PanelBox title="Source Basis">
              <div className="space-y-3 text-sm leading-6 text-slate-700">
                <SourceLink
                  href="https://www.unescap.org/projects/rcdtra"
                  label="UN ESCAP RDTII initiative"
                />
                <SourceLink
                  href="https://dtri.uneca.org/assets/data/publications/ESCAP-2025-MN-RDTII-2.1-guide-en.pdf"
                  label="RDTII 2.1 Guide PDF"
                />
                <SourceLink
                  href="https://www.unescap.org/kp/2025/regional-digital-trade-integration-index-rdtii-21-guide"
                  label="RDTII 2.1 knowledge page"
                />
              </div>
            </PanelBox>
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] border border-white/70 p-6">
          <p className="section-title text-xs font-semibold text-blue-700">Risk Snapshot</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Country Policy Signals</h2>

          <div className="mt-5 space-y-4">
            {(dashboard.policy.data ?? []).length > 0 ? (
              dashboard.policy.data?.map((item) => (
                <div key={item.country} className="rounded-3xl border border-blue-100 bg-white/80 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">{item.country}</h3>
                    <RiskPill risk={item.riskLevel} />
                  </div>
                  <div className="mt-4 space-y-3">
                    <MetricBar label="Restriction Score" value={item.restrictionScore} />
                    <MetricBar label="Openness Score" value={item.opennessScore} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.executiveSummary}</p>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-blue-100 bg-white/70 p-6 text-sm leading-6 text-slate-500">
                Policy scores will appear here after the workflow completes the analysis step.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="glass-panel mt-8 rounded-[2rem] border border-white/70 p-6">
        <div className="mb-5">
          <p className="section-title text-xs font-semibold text-blue-700">Comparison Table</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Cross-Jurisdiction View</h2>
        </div>

        {workflowResult?.report.comparisonTable.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4">Metric</th>
                  <th className="px-4">{workflowResult.input.countryA}</th>
                  <th className="px-4">{workflowResult.input.countryB}</th>
                  <th className="px-4">Insight</th>
                </tr>
              </thead>
              <tbody>
                {workflowResult.report.comparisonTable.map((row) => (
                  <tr key={row.metric} className="align-top">
                    <td className="rounded-l-3xl border border-blue-100 bg-white px-4 py-4 text-sm font-semibold text-slate-900">
                      {row.metric}
                    </td>
                    <td className="border-y border-blue-100 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
                      {row.countryA}
                    </td>
                    <td className="border-y border-blue-100 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
                      {row.countryB}
                    </td>
                    <td className="rounded-r-3xl border border-blue-100 bg-blue-50/70 px-4 py-4 text-sm leading-6 text-slate-700">
                      {row.insight}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-blue-100 bg-white/70 p-6 text-sm leading-6 text-slate-500">
            Add a second country to activate the Comparison Agent and populate the policy gap table.
          </div>
        )}
      </section>
    </main>
  );
}

function AgentCard<T>({
  state,
  children
}: {
  state: AgentCardState<T>;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`glass-panel rounded-[1.75rem] border p-5 transition ${statusClasses(state.status)} ${
        state.status === "running" ? "agent-running" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{state.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{state.subtitle}</p>
        </div>
        <div className={`h-3 w-3 rounded-full ${dotClasses(state.status)}`} />
      </div>

      <div className="mt-5">
        {state.status === "idle" ? (
          <p className="text-sm text-slate-500">Waiting to run.</p>
        ) : null}
        {state.status === "running" ? (
          <p className="text-sm font-medium text-blue-700">Working on this step now...</p>
        ) : null}
        {state.status === "error" ? (
          <p className="text-sm font-medium text-red-700">This step was interrupted by an error.</p>
        ) : null}
        {state.status === "completed" ? <div className="stagger-in">{children}</div> : null}
      </div>
    </article>
  );
}

function ResearchContent({ data }: { data: ResearchAgentResult }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-slate-700">{data.summary}</p>
      <div className="space-y-3">
        {data.profiles.map((profile) => (
          <div key={profile.country} className="rounded-2xl bg-white/90 p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold text-slate-900">{profile.country}</h4>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                Openness {profile.opennessScore}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{profile.dataTransferPolicy}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PolicyContent({ data }: { data: PolicyAnalysisResult[] }) {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.country} className="rounded-2xl bg-white/90 p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-semibold text-slate-900">{item.country}</h4>
            <RiskPill risk={item.riskLevel} />
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.executiveSummary}</p>
        </div>
      ))}
    </div>
  );
}

function ComparisonContent({ data }: { data: ComparisonAgentResult }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-slate-700">{data.headline}</p>
      <div className="grid gap-3">
        <MiniBadge label="More Open" value={data.winnerOnOpenness} />
        <MiniBadge label="Higher Risk" value={data.higherRiskCountry} />
      </div>
    </div>
  );
}

function ReportPreview({ data }: { data: ReportAgentResult }) {
  return (
    <div className="space-y-4">
      <RiskPill risk={data.overallRisk} />
      <p className="text-sm leading-6 text-slate-700">{data.finalNarrative}</p>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div className="h-2 rounded-full bg-blue-100">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function RiskPill({ risk }: { risk: "Low" | "Moderate" | "High" }) {
  const map = {
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Moderate: "bg-amber-50 text-amber-700 border-amber-200",
    High: "bg-red-50 text-red-700 border-red-200"
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${map[risk]}`}>{risk} Risk</span>
  );
}

function PanelBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-blue-100 bg-white/80 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
    >
      {label}
    </a>
  );
}

function MiniBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/90 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 shadow-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

const defaultRecommendations = [
  "Choose one country or two countries and launch the analysis workflow.",
  "Use the comparison view to explain regulatory openness and business friction to judges.",
  "Upgrade the API route later with real LLM-backed agents without changing the UI contract."
];
