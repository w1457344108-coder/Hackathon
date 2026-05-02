"use client";

import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { supportedCountries } from "@/lib/mock-data";
import { EvidenceTable } from "@/components/evidence-table";
import { AuditView } from "@/components/audit-view";
import { ExportPanel } from "@/components/export-panel";
import { filterEvidenceByCountries, mockEvidenceRecords } from "@/lib/mock-evidence";
import { StreamEventName, SupportedCountry, WorkflowResult } from "@/lib/types";

export function AnalystDashboard() {
  const [countryA, setCountryA] = useState<SupportedCountry>("China");
  const [countryB, setCountryB] = useState<SupportedCountry | "">("Singapore");
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<string>("Art. 12");

  const deferredWorkflowResult = useDeferredValue(workflowResult);
  const deferredReport = deferredWorkflowResult?.report ?? null;
  const evidenceRecords =
    workflowResult?.evidenceRecords ??
    filterEvidenceByCountries(mockEvidenceRecords, countryA, countryB);
  const selectedEvidenceRecord =
    evidenceRecords.find((record) => record.citation === selectedCitation) ?? evidenceRecords[0];
  const auditItems = workflowResult?.supportingAgentResults.auditCitation.data?.auditItems ?? [];
  const auditCoverageSummary =
    workflowResult?.supportingAgentResults.auditCitation.data?.coverageSummary ?? null;
  const linkedRiskSummary =
    workflowResult?.supportingAgentResults.riskCostQuantifier.data?.riskSummary ?? null;
  const exportPackage = workflowResult?.supportingAgentResults.legalReviewExport.data ?? null;
  const selectedAuditItem =
    auditItems.find(
      (item) =>
        item.citationRef === selectedCitation || item.evidenceId === selectedEvidenceRecord?.evidenceId
    ) ?? null;

  useEffect(() => {
    if (evidenceRecords.length > 0) {
      setSelectedCitation(evidenceRecords[0].citation);
    }
  }, [countryA, countryB, evidenceRecords]);

  async function runAnalysis() {
    setIsRunning(true);
    setWorkflowResult(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          countryA,
          countryB: countryB || null,
          businessScenario: "cross-border digital service operations",
          userQuery:
            "Find legal evidence describing how cross-border data transfers are permitted, conditioned, or restricted."
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

          if (eventName === "done") {
            startTransition(() => {
              setWorkflowResult(payload as WorkflowResult);
            });
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
    } finally {
      setIsRunning(false);
    }
  }

  function handleReviewSaved(payload: {
    evidenceRecord: (typeof evidenceRecords)[number];
    auditItem: (typeof auditItems)[number] | null;
    exportPackage: typeof exportPackage;
  }) {
    setWorkflowResult((current) => {
      if (!current) {
        return current;
      }

      const updatedAuditItems =
        current.supportingAgentResults.auditCitation.data?.auditItems.map((item) =>
          payload.auditItem && item.evidenceId === payload.auditItem.evidenceId ? payload.auditItem : item
        ) ?? [];

      return {
        ...current,
        evidenceRecords: current.evidenceRecords.map((record) =>
          record.evidenceId === payload.evidenceRecord.evidenceId ? payload.evidenceRecord : record
        ),
        supportingAgentResults: {
          ...current.supportingAgentResults,
          auditCitation: {
            ...current.supportingAgentResults.auditCitation,
            data: current.supportingAgentResults.auditCitation.data
              ? {
                  ...current.supportingAgentResults.auditCitation.data,
                  auditItems: updatedAuditItems
                }
              : current.supportingAgentResults.auditCitation.data
          },
          legalReviewExport: {
            ...current.supportingAgentResults.legalReviewExport,
            data: payload.exportPackage ?? current.supportingAgentResults.legalReviewExport.data
          }
        }
      };
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
      <section className="glass-panel stagger-in rounded-2xl px-8 py-10 sm:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <span className="section-title inline-flex rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500">
              United Nations AI Hackathon Prototype
            </span>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">
                Cross-Border Data Policy
                <br />
                Multi-Agent Analyst
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
                Analyze cross-border data policy scenarios using UN ESCAP RDTII Pillar 6 logic.
                This streamlined interface keeps the judge-facing flow focused on report, evidence,
                audit, and export while still running the real backend workflow underneath.
              </p>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
            <label className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="mb-1.5 block text-xs font-medium text-slate-500">Country A</span>
              <select
                value={countryA}
                onChange={(event) => setCountryA(event.target.value as SupportedCountry)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400"
              >
                {supportedCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="mb-1.5 block text-xs font-medium text-slate-500">Country B</span>
              <select
                value={countryB}
                onChange={(event) => setCountryB(event.target.value as SupportedCountry | "")}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400"
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

        <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            <StatChip
              label="Mode"
              value={
                workflowResult
                  ? `${workflowResult.evidenceSourceMode} + ${workflowResult.providerId}`
                  : "RDTII sources + fallback"
              }
            />
            <StatChip label="Framework" value="Next.js App Router" />
            <StatChip
              label="Review"
              value={workflowResult?.analysisRunId ? "Persistent" : "Ready to save"}
            />
          </div>

          <button
            type="button"
            onClick={runAnalysis}
            disabled={isRunning}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isRunning ? "Running..." : "Run Analysis"}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
          Built on UN ESCAP RDTII structure and competition-designated source adapters. When a
          jurisdiction is not yet covered by the live source registry, the workflow falls back to
          the existing mock evidence set instead of failing silently.
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        ) : null}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel rounded-2xl p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="section-title text-xs font-medium text-slate-400">Final Report</p>
              <h2 className="mt-2 text-xl font-medium text-slate-900">Executive Brief</h2>
            </div>
            <RiskPill risk={deferredReport?.overallRisk ?? workflowResult?.report.overallRisk ?? "Low"} />
          </div>

          <p className="text-sm leading-7 text-slate-600">
            {deferredReport?.finalNarrative ??
              "Run the workflow to generate a synthesized cross-border policy report, risk score, and action-oriented recommendations."}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <PanelBox title="Policy Recommendations">
              <ul className="space-y-2 text-sm leading-6 text-slate-600">
                {(deferredReport?.policyRecommendations ?? defaultRecommendations).map((item) => (
                  <li key={item} className="rounded-lg bg-slate-50 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </PanelBox>

            <PanelBox title="Source Basis">
              <div className="space-y-2 text-sm leading-6 text-slate-600">
                {workflowResult?.research.sourceBasis?.length ? (
                  workflowResult.research.sourceBasis.map((item: string) => (
                    <div key={item} className="rounded-lg bg-slate-50 px-4 py-3">
                      {item}
                    </div>
                  ))
                ) : (
                  <>
                    <SourceLink
                      href="https://www.unescap.org/projects/rcdtra"
                      label="UN ESCAP RDTII initiative"
                    />
                    <SourceLink
                      href="https://dtri.uneca.org/assets/data/publications/ESCAP-2025-MN-RDTII-2.1-guide-en.pdf"
                      label="RDTII 2.1 Guide PDF"
                    />
                  </>
                )}
              </div>
            </PanelBox>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <p className="section-title text-xs font-medium text-slate-400">Risk Snapshot</p>
          <h2 className="mt-2 text-xl font-medium text-slate-900">Country Policy Signals</h2>

          <div className="mt-5 space-y-4">
            {(workflowResult?.policyAnalysis ?? []).length > 0 ? (
              workflowResult?.policyAnalysis.map((item) => (
                <div key={item.country} className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium text-slate-900">{item.country}</h3>
                    <RiskPill risk={item.riskLevel} />
                  </div>
                  <div className="mt-4 space-y-3">
                    <MetricBar label="Restriction Score" value={item.restrictionScore} />
                    <MetricBar label="Openness Score" value={item.opennessScore} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{item.executiveSummary}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-400">
                Policy scores will appear here after the workflow completes the analysis step.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <EvidenceTable
          records={evidenceRecords}
          selectedCitation={selectedEvidenceRecord?.citation ?? ""}
          onSelect={setSelectedCitation}
        />
        <AuditView
          record={selectedEvidenceRecord}
          analysisRunId={workflowResult?.analysisRunId ?? null}
          linkedAuditItem={selectedAuditItem}
          linkedCoverageSummary={auditCoverageSummary}
          linkedRiskSummary={linkedRiskSummary}
          onReviewSaved={handleReviewSaved}
        />
      </section>

      <ExportPanel records={evidenceRecords} exportPackage={exportPackage} />
    </main>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-slate-900" style={{ width: `${value}%` }} />
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
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${map[risk]}`}>{risk} Risk</span>
  );
}

function PanelBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">{title}</h3>
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
      className="block rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-slate-600 transition hover:border-slate-200 hover:text-slate-900"
    >
      {label}
    </a>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

const defaultRecommendations = [
  "Choose one or two jurisdictions and launch the analysis workflow.",
  "Use the executive brief and risk snapshot as the main judge-facing summary.",
  "Review evidence items in the audit panel before exporting the package."
];
