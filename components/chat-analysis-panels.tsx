"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EvidenceRecord,
  EvidenceReviewStatus
} from "@/lib/pillar6-schema";
import { formatEvidenceSnippetForDisplay } from "@/lib/evidence-display";
import {
  AuditCitationItem,
  AuditCitationOutput,
  LegalReviewExportOutput,
  RiskSummary
} from "@/lib/types";

export interface ChatAnalysisResult {
  analysisRunId?: string | null;
  providerId?: string;
  providerModel?: string | null;
  evidenceSourceMode?: "real" | "mock" | "hybrid";
  input?: {
    countryA?: string;
    countryB?: string | null;
    uploadedDocuments?: Array<{
      fileName: string;
      sizeBytes: number;
      characterCount: number;
    }>;
  };
  evidenceRecords?: EvidenceRecord[];
  research?: {
    sourceBasis?: string[];
  };
  supportingAgentResults?: {
    auditCitation?: {
      data?: AuditCitationOutput | null;
    };
    riskCostQuantifier?: {
      data?: {
        riskSummary?: RiskSummary | null;
      } | null;
    };
    legalReviewExport?: {
      data?: LegalReviewExportOutput | null;
    };
  };
}

const reviewActionConfig: Array<{
  label: string;
  nextStatus: EvidenceReviewStatus;
}> = [
  { label: "Approve", nextStatus: "Approved" },
  { label: "Revise", nextStatus: "Needs Revision" },
  { label: "Reject", nextStatus: "Rejected" }
];

function isLikelyMockSource(sourceUrl: string) {
  return sourceUrl.includes("example.");
}

function getEvidenceModeLabel(mode: ChatAnalysisResult["evidenceSourceMode"]) {
  switch (mode) {
    case "real":
      return "Evidence real sources";
    case "hybrid":
      return "Evidence mixed sources";
    case "mock":
      return "Evidence fallback only";
    default:
      return null;
  }
}

function getSourceStrengthLabel(record: EvidenceRecord) {
  if (record.sourceType === "Statute") {
    return "Statute text";
  }

  if (record.sourceType === "Regulator Guidance") {
    return "Regulator guidance";
  }

  if (record.sourceType === "Policy Notice") {
    return "Official policy notice";
  }

  return "Official source";
}

function toCoverageSummary(result: ChatAnalysisResult, evidenceRecords: EvidenceRecord[]) {
  const requestedCountries = [result.input?.countryA, result.input?.countryB].filter(Boolean) as string[];
  const realCountries = new Set(
    evidenceRecords
      .filter((record) => !isLikelyMockSource(record.sourceUrl))
      .map((record) => record.country)
  );
  const fallbackCountries = requestedCountries.filter((country) => !realCountries.has(country));

  if (!requestedCountries.length) {
    return null;
  }

  if (!fallbackCountries.length) {
    return `Real source coverage is available for all requested jurisdictions in this run: ${requestedCountries.join(", ")}.`;
  }

  return `Real source coverage is available for ${requestedCountries
    .filter((country) => realCountries.has(country))
    .join(", ") || "none"}; fallback evidence still remains for ${fallbackCountries.join(", ")}.`;
}

function toSourceStrengthSummary(result: ChatAnalysisResult, evidenceRecords: EvidenceRecord[]) {
  const requestedCountries = [result.input?.countryA, result.input?.countryB].filter(Boolean) as string[];

  if (!requestedCountries.length || !evidenceRecords.length) {
    return null;
  }

  const countryStrength = requestedCountries.map((country) => {
    const records = evidenceRecords.filter(
      (record) => record.country === country && !isLikelyMockSource(record.sourceUrl)
    );

    if (records.some((record) => getSourceStrengthLabel(record) === "Statute text")) {
      return `${country}: statute-level evidence`;
    }

    if (records.some((record) => getSourceStrengthLabel(record) === "Regulator guidance")) {
      return `${country}: regulator-guidance coverage`;
    }

    if (records.some((record) => getSourceStrengthLabel(record) === "Official policy notice")) {
      return `${country}: official-policy coverage`;
    }

    if (records.length) {
      return `${country}: official-source coverage`;
    }

    return `${country}: fallback only`;
  });

  return `Source strength in this run: ${countryStrength.join(" | ")}.`;
}

function downloadTextFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportCsv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escapedRows = rows.map((row) =>
    headers
      .map((header) => {
        const value = String(row[header] ?? "");
        return `"${value.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  return [headers.join(","), ...escapedRows].join("\n");
}

export function ChatAnalysisPanels({
  result,
  modeLabel
}: {
  result: ChatAnalysisResult;
  modeLabel?: string | null;
}) {
  const [evidenceRecords, setEvidenceRecords] = useState<EvidenceRecord[]>(result.evidenceRecords ?? []);
  const [auditItems, setAuditItems] = useState<AuditCitationItem[]>(
    result.supportingAgentResults?.auditCitation?.data?.auditItems ?? []
  );
  const [exportPackage, setExportPackage] = useState<LegalReviewExportOutput | null>(
    result.supportingAgentResults?.legalReviewExport?.data ?? null
  );
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    result.evidenceRecords?.[0]?.evidenceId ?? null
  );
  const [reviewStatus, setReviewStatus] = useState<EvidenceReviewStatus>(
    result.evidenceRecords?.[0]?.reviewStatus ?? "Pending Review"
  );
  const [reviewerNote, setReviewerNote] = useState(result.evidenceRecords?.[0]?.reviewerNote ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setEvidenceRecords(result.evidenceRecords ?? []);
    setAuditItems(result.supportingAgentResults?.auditCitation?.data?.auditItems ?? []);
    setExportPackage(result.supportingAgentResults?.legalReviewExport?.data ?? null);
    setSelectedEvidenceId(result.evidenceRecords?.[0]?.evidenceId ?? null);
  }, [result]);

  const selectedRecord = useMemo(
    () => evidenceRecords.find((record) => record.evidenceId === selectedEvidenceId) ?? evidenceRecords[0] ?? null,
    [evidenceRecords, selectedEvidenceId]
  );
  const selectedAuditItem = useMemo(
    () => auditItems.find((item) => item.evidenceId === selectedRecord?.evidenceId) ?? null,
    [auditItems, selectedRecord]
  );
  const coverageSummary = result.supportingAgentResults?.auditCitation?.data?.coverageSummary ?? null;
  const riskSummary = result.supportingAgentResults?.riskCostQuantifier?.data?.riskSummary ?? null;
  const sourceBasis = result.research?.sourceBasis ?? [];
  const coverageNote = toCoverageSummary(result, evidenceRecords);
  const sourceStrengthNote = toSourceStrengthSummary(result, evidenceRecords);
  const evidenceModeLabel = getEvidenceModeLabel(result.evidenceSourceMode);

  useEffect(() => {
    if (!selectedRecord) {
      setReviewStatus("Pending Review");
      setReviewerNote("");
      setSaveMessage(null);
      return;
    }

    setReviewStatus(selectedRecord.reviewStatus);
    setReviewerNote(selectedRecord.reviewerNote ?? "");
    setSaveMessage(null);
  }, [selectedRecord]);

  async function persistReview() {
    if (!result.analysisRunId || !selectedRecord) {
      setSaveMessage("Run the analysis first so a reviewable analysis run is available.");
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
          runId: result.analysisRunId,
          evidenceId: selectedRecord.evidenceId,
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
        throw new Error(payload.message ?? "Unable to save review state.");
      }

      setEvidenceRecords((current) =>
        current.map((record) =>
          record.evidenceId === payload.evidenceRecord?.evidenceId ? payload.evidenceRecord : record
        )
      );
      setAuditItems((current) => {
        if (!payload.auditItem) {
          return current;
        }

        const existing = current.find((item) => item.evidenceId === payload.auditItem?.evidenceId);
        if (!existing) {
          return [...current, payload.auditItem];
        }

        return current.map((item) =>
          item.evidenceId === payload.auditItem?.evidenceId ? payload.auditItem : item
        );
      });
      setExportPackage(payload.exportPackage ?? exportPackage);
      setSaveMessage("Review saved.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Unable to save review state.");
    } finally {
      setIsSaving(false);
    }
  }

  const exportJson = exportPackage?.exportJson
    ? JSON.stringify(exportPackage.exportJson, null, 2)
    : JSON.stringify(result, null, 2);
  const exportCsvText = exportPackage?.exportCsvRows ? exportCsv(exportPackage.exportCsvRows) : "";
  const exportMarkdown = exportPackage?.exportMarkdown ?? "";

  return (
    <div className="mt-4 space-y-4 font-schibsted">
      <div className="rounded-[18px] border border-black/10 bg-[#fbfbfb] px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center gap-2">
          {modeLabel ? <Badge>{modeLabel}</Badge> : null}
          {result.providerId ? (
            <Badge>{`Provider ${result.providerId}${result.providerModel ? ` · ${result.providerModel}` : ""}`}</Badge>
          ) : null}
          {evidenceModeLabel ? <Badge>{evidenceModeLabel}</Badge> : null}
          {exportPackage?.exportReadiness ? <Badge>{exportPackage.exportReadiness}</Badge> : null}
          {result.analysisRunId ? <Badge>{`Run ${result.analysisRunId}`}</Badge> : null}
        </div>

        {coverageNote ? (
          <p className="mt-3 text-sm leading-6 text-black/72">{coverageNote}</p>
        ) : null}

        {sourceStrengthNote ? (
          <p className="mt-2 text-sm leading-6 text-black/60">{sourceStrengthNote}</p>
        ) : null}

        {riskSummary ? (
          <p className="mt-2 text-sm leading-6 text-black/72">
            {`Risk ${riskSummary.riskLevel}. Uncertainty ${riskSummary.uncertaintyLevel}. ${riskSummary.operationalImpact}`}
          </p>
        ) : null}

        {result.input?.uploadedDocuments?.length ? (
          <p className="mt-2 text-sm leading-6 text-black/60">
            {`Uploaded documents used: ${result.input.uploadedDocuments
              .map((file) => `${file.fileName} (${file.characterCount.toLocaleString()} chars)`)
              .join(" | ")}`}
          </p>
        ) : null}
      </div>

      <details open className="rounded-[18px] border border-black/10 bg-white px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.04)]">
        <summary className="cursor-pointer list-none text-[15px] font-semibold text-black">
          Evidence records and citations
        </summary>
        <div className="mt-4 space-y-3">
          {evidenceRecords.length ? (
            evidenceRecords.map((record) => (
              <button
                key={record.evidenceId}
                type="button"
                onClick={() => setSelectedEvidenceId(record.evidenceId)}
                className={`block w-full rounded-[16px] border px-4 py-4 text-left transition ${
                  selectedRecord?.evidenceId === record.evidenceId
                    ? "border-black bg-black/[0.03]"
                    : "border-black/10 bg-[#fcfcfc] hover:border-black/25"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-black/50">
                  <span>{record.country}</span>
                  <span>{record.indicatorCode}</span>
                  <span>{getSourceStrengthLabel(record)}</span>
                  <span>{record.reviewStatus}</span>
                  <span>{`${Math.round(record.confidence * 100)}% confidence`}</span>
                </div>
                <h3 className="mt-2 text-[15px] font-semibold leading-6 text-black">{record.lawTitle}</h3>
                <p className="mt-1 text-sm leading-6 text-black/72">{record.citation}</p>
                {record.sourceLocator ? (
                  <p className="mt-1 text-xs leading-5 text-black/55">{`Locator: ${record.sourceLocator}`}</p>
                ) : null}
                <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-black/45">
                  Decisive basis
                </p>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-black/72">
                  {formatEvidenceSnippetForDisplay(record)}
                </p>
                <a
                  href={record.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="mt-3 inline-flex break-all text-xs font-medium text-black/55 underline-offset-2 hover:text-black hover:underline"
                >
                  {record.sourceUrl}
                </a>
              </button>
            ))
          ) : (
            <p className="text-sm leading-6 text-black/55">No evidence records were returned.</p>
          )}
        </div>

        {sourceBasis.length ? (
          <div className="mt-4 rounded-[16px] border border-black/10 bg-[#fcfcfc] px-4 py-4">
            <p className="text-[13px] font-semibold text-black">Source URLs used</p>
            <ul className="mt-2 space-y-1 text-sm leading-6 text-black/68">
              {sourceBasis.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </details>

      <details open className="rounded-[18px] border border-black/10 bg-white px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.04)]">
        <summary className="cursor-pointer list-none text-[15px] font-semibold text-black">
          Audit review
        </summary>
        {selectedRecord ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="rounded-[16px] border border-black/10 bg-[#fcfcfc] px-4 py-4">
              <p className="text-[13px] font-semibold text-black">Selected evidence</p>
              <p className="mt-2 text-sm font-medium leading-6 text-black">{selectedRecord.lawTitle}</p>
              {selectedRecord.sourceLocator ? (
                <p className="mt-1 text-xs leading-5 text-black/55">{`Locator: ${selectedRecord.sourceLocator}`}</p>
              ) : null}
              <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-black/45">
                Decisive basis
              </p>
              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-black/72">
                {formatEvidenceSnippetForDisplay(selectedRecord)}
              </p>
              <p className="mt-3 text-sm leading-6 text-black/72">{selectedRecord.aiExtraction}</p>
              <p className="mt-3 text-sm leading-6 text-black/72">{selectedRecord.pillar6Mapping}</p>
              {selectedAuditItem ? (
                <div className="mt-4 rounded-[14px] border border-black/10 bg-white px-3 py-3 text-sm leading-6 text-black/72">
                  <p className="font-medium text-black">Traceability</p>
                  <p className="mt-2">{selectedAuditItem.traceabilityNote}</p>
                  <p className="mt-2">{selectedAuditItem.relevanceReason}</p>
                </div>
              ) : null}
              {coverageSummary ? (
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-black/55">
                  <span>{`Findings ${coverageSummary.totalFindings}`}</span>
                  <span>{`Linked ${coverageSummary.linkedFindings}`}</span>
                  <span>{`Needs review ${coverageSummary.needsReviewCount}`}</span>
                </div>
              ) : null}
            </div>

            <div className="rounded-[16px] border border-black/10 bg-white px-4 py-4">
              <p className="text-[13px] font-semibold text-black">Reviewer controls</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {reviewActionConfig.map((action) => {
                  const selected = reviewStatus === action.nextStatus;

                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => setReviewStatus(action.nextStatus)}
                      className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                        selected
                          ? "bg-black text-white"
                          : "bg-[#f5f5f5] text-black hover:bg-black hover:text-white"
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
                rows={7}
                className="mt-3 w-full rounded-[14px] border border-black/10 bg-[#fcfcfc] px-3 py-3 text-sm leading-6 text-black outline-none transition focus:border-black/30"
                placeholder="Add reviewer note for this evidence item..."
              />

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs leading-5 text-black/50">
                  Save review status and note into the analysis run.
                </p>
                <button
                  type="button"
                  onClick={persistReview}
                  disabled={isSaving}
                  className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-black/25"
                >
                  {isSaving ? "Saving..." : "Save review"}
                </button>
              </div>

              {saveMessage ? <p className="mt-3 text-xs leading-5 text-black/55">{saveMessage}</p> : null}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-black/55">No audit-ready evidence was returned.</p>
        )}
      </details>

      <details open className="rounded-[18px] border border-black/10 bg-white px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.04)]">
        <summary className="cursor-pointer list-none text-[15px] font-semibold text-black">
          JSON / CSV / Markdown export
        </summary>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                `analysis-${result.analysisRunId ?? "run"}.json`,
                exportJson,
                "application/json"
              )
            }
            className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Download JSON
          </button>
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                `analysis-${result.analysisRunId ?? "run"}.csv`,
                exportCsvText,
                "text/csv"
              )
            }
            disabled={!exportCsvText}
            className="rounded-full bg-[#f3f3f3] px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:text-black/25"
          >
            Download CSV
          </button>
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                `analysis-${result.analysisRunId ?? "run"}.md`,
                exportMarkdown,
                "text/markdown"
              )
            }
            disabled={!exportMarkdown}
            className="rounded-full bg-[#f3f3f3] px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:text-black/25"
          >
            Download Markdown
          </button>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="rounded-[16px] border border-black/10 bg-[#fcfcfc] px-4 py-4">
            <p className="text-[13px] font-semibold text-black">Export readiness</p>
            <p className="mt-2 text-sm leading-6 text-black/72">
              {exportPackage?.exportReadiness ?? "No export package returned."}
            </p>
            {exportPackage?.judgeSummary ? (
              <p className="mt-3 text-sm leading-6 text-black/72">{exportPackage.judgeSummary}</p>
            ) : null}
          </div>
          <div className="rounded-[16px] border border-black/10 bg-[#fcfcfc] px-4 py-4">
            <p className="text-[13px] font-semibold text-black">Markdown preview</p>
            <pre className="mt-2 max-h-[240px] overflow-y-auto whitespace-pre-wrap text-xs leading-6 text-black/72">
              {exportMarkdown || "No Markdown export returned."}
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-black/[0.06] px-3 py-1 text-[12px] font-medium text-black/72">
      {children}
    </span>
  );
}
