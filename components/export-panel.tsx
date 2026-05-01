"use client";

import { EvidenceRecord } from "@/lib/pillar6-schema";

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

export function ExportPanel({ records }: { records: EvidenceRecord[] }) {
  return (
    <section className="glass-panel mt-8 rounded-2xl p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-title text-xs font-medium text-slate-400">Export</p>
          <h2 className="mt-2 text-xl font-medium text-slate-900">Download Evidence Packages</h2>
        </div>
        <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
          Mock export only, API-ready later
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() =>
            downloadFile(
              "pillar6-evidence.json",
              JSON.stringify(records, null, 2),
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
          onClick={() => downloadFile("pillar6-evidence.csv", toCsv(records), "text/csv")}
          className="rounded-xl border border-slate-100 bg-white p-5 text-left transition hover:border-slate-200"
        >
          <p className="text-base font-medium text-slate-900">Export CSV</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Reviewer-friendly flat table for spreadsheet validation and manual scoring workflows.
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            downloadFile("pillar6-report.md", toMarkdown(records), "text/markdown")
          }
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
