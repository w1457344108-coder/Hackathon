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
    "Mock evidence export for Cross-Border Data Policy Multi-Agent Analyst.",
    ""
  ];

  const sections = records.map((record) =>
    [
      `## ${record.country} · ${record.indicator}`,
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
    <section className="glass-panel mt-8 rounded-2xl p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-title text-xs font-medium text-slate-400">Export</p>
          <h2 className="mt-2 text-xl font-medium text-slate-900">Download Evidence Packages</h2>
        </div>
        <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
          {exportPackage ? exportPackage.exportReadiness : "Mock export only, API-ready later"}
        </span>
      </div>

      {exportPackage ? (
        <div className="mb-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Judge Summary
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{exportPackage.judgeSummary}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Review Summary
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
          className="rounded-xl border border-slate-100 bg-white p-5 text-left transition hover:border-slate-200"
        >
          <p className="text-base font-medium text-slate-900">Export JSON</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Structured evidence payload for future agent orchestration or evaluator pipelines.
          </p>
        </button>

        <button
          type="button"
          onClick={() => downloadFile("pillar6-evidence.csv", csvPayload, "text/csv")}
          className="rounded-xl border border-slate-100 bg-white p-5 text-left transition hover:border-slate-200"
        >
          <p className="text-base font-medium text-slate-900">Export CSV</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Reviewer-friendly flat table for spreadsheet validation and manual scoring workflows.
          </p>
        </button>

        <button
          type="button"
          onClick={() => downloadFile("pillar6-report.md", markdownPayload, "text/markdown")}
          className="rounded-xl border border-slate-100 bg-white p-5 text-left transition hover:border-slate-200"
        >
          <p className="text-base font-medium text-slate-900">Export Markdown Report</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Lightweight narrative report with citations, snippets, and review notes for demo sharing.
          </p>
        </button>
      </div>
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
