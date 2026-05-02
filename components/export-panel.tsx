"use client";

import { EvidenceRecord } from "@/lib/pillar6-schema";
import { LegalReviewExportOutput } from "@/lib/types";

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string | number) {
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

function toCsv(records: EvidenceRecord[]) {
  const headers = [
    "evidenceId",
    "country",
    "pillar",
    "indicator",
    "lawTitle",
    "citation",
    "verbatimSnippet",
    "sourceUrl",
    "sourceType",
    "discoveryTags",
    "confidence",
    "reviewStatus",
    "reviewerNote"
  ];

  const rows = records.map((record) =>
    [
      record.evidenceId,
      record.country,
      record.pillar,
      record.indicator,
      record.lawTitle,
      record.citation,
      record.verbatimSnippet,
      record.sourceUrl,
      record.sourceType,
      record.discoveryTags.join(" | "),
      record.confidence,
      record.reviewStatus,
      record.reviewerNote
    ]
      .map(escapeCsv)
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

function toMarkdown(records: EvidenceRecord[]) {
  const intro = [
    "# Pillar 6 Evidence Report",
    "",
    "Evidence export for Cross-Border Data Policy Multi-Agent Analyst.",
    ""
  ];

  const sections = records.map((record) =>
    [
      `## ${record.country} · ${record.indicator}`,
      `- Evidence ID: ${record.evidenceId}`,
      `- Law title: ${record.lawTitle}`,
      `- Citation: ${record.citation}`,
      `- Source type: ${record.sourceType}`,
      `- Confidence: ${Math.round(record.confidence * 100)}%`,
      `- Review status: ${record.reviewStatus}`,
      `- Source URL: ${record.sourceUrl}`,
      `- Discovery tags: ${record.discoveryTags.join(", ")}`,
      "",
      "### Verbatim snippet",
      record.verbatimSnippet,
      "",
      "### AI extraction",
      record.aiExtraction,
      "",
      "### Pillar 6 mapping",
      record.pillar6Mapping,
      "",
      "### Reviewer note",
      record.reviewerNote,
      ""
    ].join("\n")
  );

  return [...intro, ...sections].join("\n");
}

function toExportCsv(rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const body = rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(","));

  return [headers.join(","), ...body].join("\n");
}

export function ExportPanel({
  records,
  exportPackage
}: {
  records: EvidenceRecord[];
  exportPackage?: LegalReviewExportOutput | null;
}) {
  const jsonPayload = exportPackage?.exportJson ?? records;
  const csvPayload =
    exportPackage && exportPackage.exportCsvRows.length > 0
      ? toExportCsv(exportPackage.exportCsvRows)
      : toCsv(records);
  const markdownPayload = exportPackage?.exportMarkdown ?? toMarkdown(records);

  return (
    <section className="glass-panel mt-8 rounded-[2rem] border border-white/70 p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-title text-xs font-semibold text-blue-700">Export Panel</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Download Evidence Packages</h2>
        </div>
        <span className="rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm text-slate-600">
          {exportPackage ? "Review-linked export package ready" : "Fallback export from current evidence set"}
        </span>
      </div>

      {exportPackage ? (
        <div className="mb-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.5rem] border border-blue-100 bg-white/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Judge-Facing Summary
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">{exportPackage.judgeSummary}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{exportPackage.finalReport}</p>
          </div>

          <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Export Readiness
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-950">
              {exportPackage.exportReadiness}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SummaryMetric label="Approved" value={exportPackage.reviewSummary.approvedCount} />
              <SummaryMetric
                label="Needs Revision"
                value={exportPackage.reviewSummary.needsRevisionCount}
              />
              <SummaryMetric label="Rejected" value={exportPackage.reviewSummary.rejectedCount} />
              <SummaryMetric
                label="Human Review"
                value={exportPackage.reviewSummary.humanReviewCount}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() =>
            downloadFile(
              "pillar6-evidence.json",
              JSON.stringify(jsonPayload, null, 2),
              "application/json"
            )
          }
          className="rounded-[1.5rem] border border-blue-100 bg-white/85 p-5 text-left transition hover:border-blue-300"
        >
          <p className="text-lg font-semibold text-slate-950">Export JSON</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Structured evidence payload for future agent orchestration or evaluator pipelines.
          </p>
        </button>

        <button
          type="button"
          onClick={() => downloadFile("pillar6-evidence.csv", csvPayload, "text/csv")}
          className="rounded-[1.5rem] border border-blue-100 bg-white/85 p-5 text-left transition hover:border-blue-300"
        >
          <p className="text-lg font-semibold text-slate-950">Export CSV</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Reviewer-friendly flat table for spreadsheet validation and manual scoring workflows.
          </p>
        </button>

        <button
          type="button"
          onClick={() => downloadFile("pillar6-report.md", markdownPayload, "text/markdown")}
          className="rounded-[1.5rem] border border-blue-100 bg-white/85 p-5 text-left transition hover:border-blue-300"
        >
          <p className="text-lg font-semibold text-slate-950">Export Markdown Report</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Lightweight narrative report with citations, snippets, and review notes for submission sharing.
          </p>
        </button>
      </div>
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
