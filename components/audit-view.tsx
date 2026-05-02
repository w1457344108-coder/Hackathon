"use client";

import { useEffect, useState } from "react";
import {
  EvidenceRecord,
  EvidenceReviewStatus,
  Pillar6IndicatorCode
} from "@/lib/pillar6-schema";
import {
  AuditCitationItem,
  AuditCitationOutput,
  LegalReviewExportOutput,
  RiskSummary
} from "@/lib/types";

const indicatorBadgeClass: Record<Pillar6IndicatorCode, string> = {
  P6_1_BAN_LOCAL_PROCESSING: "bg-rose-100 text-rose-700 border-rose-200",
  P6_2_LOCAL_STORAGE: "bg-amber-100 text-amber-700 border-amber-200",
  P6_3_INFRASTRUCTURE: "bg-violet-100 text-violet-700 border-violet-200",
  P6_4_CONDITIONAL_FLOW: "bg-blue-100 text-blue-700 border-blue-200",
  P6_5_BINDING_COMMITMENT: "bg-emerald-100 text-emerald-700 border-emerald-200"
};

const reviewActionConfig: Array<{
  label: string;
  nextStatus: EvidenceReviewStatus;
}> = [
  { label: "Approve", nextStatus: "Approved" },
  { label: "Revise", nextStatus: "Needs Revision" },
  { label: "Reject", nextStatus: "Rejected" }
];

export function AuditView({
  record,
  analysisRunId,
  linkedAuditItem,
  linkedCoverageSummary,
  linkedRiskSummary,
  onReviewSaved
}: {
  record?: EvidenceRecord | null;
  analysisRunId?: string | null;
  linkedAuditItem?: AuditCitationItem | null;
  linkedCoverageSummary?: AuditCitationOutput["coverageSummary"] | null;
  linkedRiskSummary?: RiskSummary | null;
  onReviewSaved?: (payload: {
    evidenceRecord: EvidenceRecord;
    auditItem: AuditCitationItem | null;
    exportPackage: LegalReviewExportOutput | null;
  }) => void;
}) {
  const [reviewStatus, setReviewStatus] = useState<EvidenceReviewStatus>(
    record?.reviewStatus ?? "Pending Review"
  );
  const [reviewerNote, setReviewerNote] = useState(record?.reviewerNote ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setReviewStatus(record?.reviewStatus ?? "Pending Review");
    setReviewerNote(record?.reviewerNote ?? "");
    setSaveMessage(null);
  }, [record]);

  if (!record) {
    return (
      <section className="glass-panel min-w-0 rounded-[2rem] border border-white/70 p-6">
        <div className="rounded-3xl border border-dashed border-blue-100 bg-white/80 p-6 text-sm leading-6 text-slate-500">
          Select an evidence record to inspect its audit chain.
        </div>
      </section>
    );
  }

  const activeRecord = record;

  async function persistReview() {
    if (!analysisRunId) {
      setSaveMessage("Run the analysis once before saving reviewer decisions.");
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          runId: analysisRunId,
          evidenceId: activeRecord.evidenceId,
          reviewStatus,
          reviewerNote
        })
      });
      const payload = (await response.json()) as {
        message?: string;
        evidenceRecord?: EvidenceRecord;
        auditItem?: AuditCitationItem | null;
        exportPackage?: LegalReviewExportOutput | null;
      };

      if (!response.ok || !payload.evidenceRecord) {
        throw new Error(payload.message ?? "Unable to save the reviewer decision.");
      }

      setSaveMessage("Review saved.");
      onReviewSaved?.({
        evidenceRecord: payload.evidenceRecord,
        auditItem: payload.auditItem ?? null,
        exportPackage: payload.exportPackage ?? null
      });
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Unable to save the reviewer decision.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="glass-panel min-w-0 rounded-[2rem] border border-white/70 p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-title text-xs font-semibold text-blue-700">Audit View</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Evidence Audit View</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Designed for left-right legal review. The left panel preserves the original legal
            source, and the right panel shows the AI claim, audit citation chain, and reviewer
            actions produced by the supporting agents.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Pill badgeLabel="Evidence ID" value={record.evidenceId} />
          <span
            className={`rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.14em] ${indicatorBadgeClass[record.indicatorCode]}`}
          >
            {record.indicatorCode}
          </span>
        </div>
      </div>

      {linkedCoverageSummary ? (
        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <SummaryPill label="Findings" value={linkedCoverageSummary.totalFindings} />
          <SummaryPill label="Linked" value={linkedCoverageSummary.linkedFindings} />
          <SummaryPill label="Needs Review" value={linkedCoverageSummary.needsReviewCount} />
        </div>
      ) : null}

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="min-w-0 rounded-[1.5rem] border border-blue-100 bg-white/85 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Original Legal Text</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">{record.lawTitle}</h3>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <AuditMeta label="Article / Section number" value={record.citation} />
            <AuditMeta label="Jurisdiction" value={record.country} />
            <AuditMeta label="Source type" value={record.sourceType} />
            <AuditMeta label="Indicator label" value={record.indicator} />
          </div>

          <div className="mt-4 rounded-[1.35rem] border border-blue-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Source URL
            </p>
            <a
              href={record.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex break-all text-sm font-medium text-blue-700 transition hover:text-blue-900"
            >
              {record.sourceUrl}
            </a>
          </div>

          <AuditPanelBlock title="Verbatim snippet" tone="neutral">
            {record.verbatimSnippet}
          </AuditPanelBlock>

          <AuditPanelBlock title="Original legal text" tone="neutral">
            {record.originalLegalText}
          </AuditPanelBlock>
        </article>

        <article className="min-w-0 rounded-[1.5rem] border border-blue-100 bg-blue-50/60 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Supporting Agent Review</p>

          <div className="mt-4 space-y-4">
            <AuditPanelBlock title="AI extracted claim">
              {linkedAuditItem?.extractedClaim ?? record.aiExtraction}
            </AuditPanelBlock>

            <AuditPanelBlock title="Pillar 6 indicator mapping">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.12em] ${indicatorBadgeClass[record.indicatorCode]}`}
                >
                  {linkedAuditItem?.indicatorId ?? record.indicatorCode}
                </span>
                <span className="text-sm font-medium text-slate-700">{record.indicator}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{record.pillar6Mapping}</p>
            </AuditPanelBlock>

            <AuditPanelBlock title="Citation chain">
              <div className="space-y-2 text-sm leading-6 text-slate-700">
                <p>Citation: {linkedAuditItem?.citationRef ?? record.citation}</p>
                <p>Conclusion ID: {linkedAuditItem?.conclusionId ?? "Linked by supporting audit agent"}</p>
                <p>Source URL: {linkedAuditItem?.sourceUrl ?? record.sourceUrl}</p>
                {linkedAuditItem ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <TraceabilityPill
                      label={linkedAuditItem.traceabilityStatus}
                      tone={
                        linkedAuditItem.traceabilityStatus === "Complete" ? "green" : "amber"
                      }
                    />
                    <TraceabilityPill
                      label={linkedAuditItem.humanReviewNeeded ? "Human Review Needed" : "Ready"}
                      tone={linkedAuditItem.humanReviewNeeded ? "amber" : "blue"}
                    />
                  </div>
                ) : null}
              </div>
            </AuditPanelBlock>

            <AuditPanelBlock title="Legal effect">
              {linkedAuditItem?.legalEffect ?? record.riskImplication}
            </AuditPanelBlock>

            {linkedAuditItem ? (
              <AuditPanelBlock title="Traceability note">
                <div className="space-y-2 text-sm leading-6 text-slate-700">
                  <p>{linkedAuditItem.traceabilityNote}</p>
                  <p>{linkedAuditItem.relevanceReason}</p>
                </div>
              </AuditPanelBlock>
            ) : null}

            {linkedRiskSummary ? (
              <AuditPanelBlock title="Risk & Cost Summary">
                <div className="space-y-2 text-sm leading-6 text-slate-700">
                  <p>Risk level: {linkedRiskSummary.riskLevel}</p>
                  <p>Uncertainty: {linkedRiskSummary.uncertaintyLevel}</p>
                  <p>{linkedRiskSummary.operationalImpact}</p>
                </div>
              </AuditPanelBlock>
            ) : null}

            <div className="rounded-2xl border border-white/70 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Reviewer status
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {reviewActionConfig.map((action) => {
                  const selected = reviewStatus === action.nextStatus;

                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => setReviewStatus(action.nextStatus)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        selected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-blue-100 bg-white text-slate-700 hover:border-blue-300"
                      }`}
                    >
                      {action.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-slate-600">Current status: {reviewStatus}</p>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Reviewer note
              </p>
              <textarea
                value={reviewerNote}
                onChange={(event) => setReviewerNote(event.target.value)}
                rows={5}
                className="mt-3 w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-400"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs leading-5 text-slate-500">
                  Review decisions are persisted through the backend run store for this prototype.
                </p>
                <button
                  type="button"
                  onClick={persistReview}
                  disabled={isSaving}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isSaving ? "Saving..." : "Save Review"}
                </button>
              </div>
              {saveMessage ? <p className="mt-3 text-xs leading-5 text-slate-500">{saveMessage}</p> : null}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function AuditMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-blue-100 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function AuditPanelBlock({
  title,
  children,
  tone = "soft"
}: {
  title: string;
  children: React.ReactNode;
  tone?: "soft" | "neutral";
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl border p-4 ${
        tone === "neutral"
          ? "border-blue-100 bg-slate-50"
          : "border-white/70 bg-white/90"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <div className="mt-2 text-sm leading-6 text-slate-700">{children}</div>
    </div>
  );
}

function Pill({ badgeLabel, value }: { badgeLabel: string; value: string }) {
  return (
    <div className="rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm text-slate-700">
      <span className="font-semibold text-slate-900">{badgeLabel}:</span> {value}
    </div>
  );
}

function TraceabilityPill({
  label,
  tone
}: {
  label: string;
  tone: "green" | "amber" | "blue";
}) {
  const toneClasses = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700"
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {label}
    </span>
  );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.2rem] border border-blue-100 bg-white/85 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
