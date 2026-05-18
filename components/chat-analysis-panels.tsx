"use client";

import { useEffect, useMemo, useState } from "react";
import { EvidenceRecord } from "@/lib/pillar6-schema";
import { formatEvidenceSnippetForDisplay } from "@/lib/evidence-display";
import {
  AuditCitationOutput,
  LegalReviewExportOutput,
  RebuttalAgentOutput,
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
    rebuttalAgent?: {
      data?: RebuttalAgentOutput | null;
    };
    legalReviewExport?: {
      data?: LegalReviewExportOutput | null;
    };
  };
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
  const [exportPackage, setExportPackage] = useState<LegalReviewExportOutput | null>(
    result.supportingAgentResults?.legalReviewExport?.data ?? null
  );
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    result.evidenceRecords?.[0]?.evidenceId ?? null
  );

  useEffect(() => {
    setEvidenceRecords(result.evidenceRecords ?? []);
    setExportPackage(result.supportingAgentResults?.legalReviewExport?.data ?? null);
    setSelectedEvidenceId(result.evidenceRecords?.[0]?.evidenceId ?? null);
  }, [result]);

  const selectedRecord = useMemo(
    () => evidenceRecords.find((record) => record.evidenceId === selectedEvidenceId) ?? evidenceRecords[0] ?? null,
    [evidenceRecords, selectedEvidenceId]
  );
  const sourceBasis = result.research?.sourceBasis ?? [];

  const exportJson = exportPackage?.exportJson
    ? JSON.stringify(exportPackage.exportJson, null, 2)
    : JSON.stringify(result, null, 2);
  const exportCsvText = exportPackage?.exportCsvRows ? exportCsv(exportPackage.exportCsvRows) : "";
  const exportMarkdown = exportPackage?.exportMarkdown ?? "";

  return (
    <div className="mt-4 space-y-4 font-schibsted">
      <details open className="group rounded-[18px] border border-black/10 bg-white px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.04)]">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-[15px] font-semibold text-black [&::-webkit-details-marker]:hidden">
          <span>Evidence records and citations</span>
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-black/55 transition group-open:bg-black/[0.08]">
            <span className="group-open:hidden">Expand ▼</span>
            <span className="hidden group-open:inline">Collapse ▲</span>
          </span>
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

      <details open className="group rounded-[18px] border border-black/10 bg-white px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.04)]">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-[15px] font-semibold text-black [&::-webkit-details-marker]:hidden">
          <span>JSON / CSV / Markdown export</span>
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-black/55 transition group-open:bg-black/[0.08]">
            <span className="group-open:hidden">Expand ▼</span>
            <span className="hidden group-open:inline">Collapse ▲</span>
          </span>
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
