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

const indicatorTone: Record<Pillar6IndicatorCode, string> = {
  P6_1_BAN_LOCAL_PROCESSING: "border-rose-200 bg-rose-50 text-rose-700",
  P6_2_LOCAL_STORAGE: "border-amber-200 bg-amber-50 text-amber-700",
  P6_3_INFRASTRUCTURE: "border-violet-200 bg-violet-50 text-violet-700",
  P6_4_CONDITIONAL_FLOW: "border-blue-200 bg-blue-50 text-blue-700",
  P6_5_BINDING_COMMITMENT: "border-emerald-200 bg-emerald-50 text-emerald-700"
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
      <section className="glass-panel min-w-0 rounded-2xl p-6">
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-400">
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
    <section className="glass-panel min-w-0 rounded-2xl p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-title text-xs font-medium text-slate-400">Audit View</p>
          <h2 className="mt-2 text-xl font-medium text-slate-900">Legal Review</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
            {activeRecord.evidenceId}
          </span>
          <span
            className={`rounded-md border px-3 py-1.5 text-xs font-medium ${indicatorTone[activeRecord.indicatorCode]}`}
          >
            {activeRecord.indicatorCode}
          </span>
        </div>
      </div>

      {linkedCoverageSummary ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <SummaryPill label="Findings" value={String(linkedCoverageSummary.totalFindings)} />
          <SummaryPill label="Linked" value={String(linkedCoverageSummary.linkedFindings)} />
          <SummaryPill label="Needs Review" value={String(linkedCoverageSummary.needsReviewCount)} />
        </div>
      ) : null}

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="min-w-0 rounded-xl border border-slate-100 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-slate-400">Original Legal Text</p>
          <h3 className="mt-2 text-base font-medium text-slate-900">
            {activeRecord.lawTitle} · {activeRecord.citation}
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetaBlock label="Jurisdiction" value={activeRecord.country} />
            <MetaBlock label="Source Type" value={activeRecord.sourceType} />
            <MetaBlock label="Indicator" value={activeRecord.indicator} />
            <MetaBlock label="Confidence" value={`${Math.round(activeRecord.confidence * 100)}%`} />
          </div>

          <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Source URL</p>
            <a
              href={activeRecord.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex break-all text-sm font-medium text-slate-700 transition hover:text-slate-900"
            >
              {activeRecord.sourceUrl}
            </a>
          </div>

          <AuditBlock title="Verbatim snippet" content={activeRecord.verbatimSnippet} />
          <AuditBlock title="Original legal text" content={activeRecord.originalLegalText} />
        </article>

        <article className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-400">AI Extraction Review</p>
          <div className="mt-4 space-y-3">
            <AuditBlock
              title="AI extraction"
              content={linkedAuditItem?.extractedClaim ?? activeRecord.aiExtraction}
            />
            <AuditBlock title="Pillar 6 mapping" content={activeRecord.pillar6Mapping} />
            <AuditBlock title="Citation" content={`${activeRecord.lawTitle}, ${activeRecord.citation}`} />
            <AuditBlock title="Review status" content={reviewStatus} />
            <AuditBlock title="Reviewer note" content={reviewerNote || "No reviewer note yet."} />

            {linkedAuditItem ? (
              <AuditBlock
                title="Traceability note"
                content={`${linkedAuditItem.traceabilityNote} ${linkedAuditItem.relevanceReason}`}
              />
            ) : null}

            {linkedRiskSummary ? (
              <AuditBlock
                title="Risk summary"
                content={`Risk ${linkedRiskSummary.riskLevel}. Uncertainty ${linkedRiskSummary.uncertaintyLevel}. ${linkedRiskSummary.operationalImpact}`}
              />
            ) : null}

            <div className="rounded-lg border border-slate-100 bg-white p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Reviewer controls</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {reviewActionConfig.map((action) => {
                  const selected = reviewStatus === action.nextStatus;

                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => setReviewStatus(action.nextStatus)}
                      className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                        selected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {action.label}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={reviewerNote}
                onChange={(event) => setReviewerNote(event.target.value)}
                rows={5}
                className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-slate-400"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs leading-5 text-slate-500">
                  Review decisions are persisted in the backend run store.
                </p>
                <button
                  type="button"
                  onClick={persistReview}
                  disabled={isSaving}
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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

function AuditBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-100 bg-white p-3.5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
      <p className="mt-1.5 text-sm leading-6 text-slate-600">{content}</p>
    </div>
  );
}

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1.5 text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1.5 text-base font-medium text-slate-900">{value}</p>
    </div>
  );
}
