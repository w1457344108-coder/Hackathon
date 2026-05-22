import type { EvidenceRecord } from "@/lib/pillar6-schema";
import { formatEvidenceSnippetForDisplay } from "@/lib/evidence-display";
import type { LegalReviewExportOutput } from "@/lib/types";

export interface PanelInfoItem {
  label: string;
  value: string | number;
}

export interface EvidenceCitationCard {
  id: string;
  title: string;
  citation: string;
  sourceUrl: string;
  decisiveBasis: string;
  mappingRationale: string;
  reviewerNote: string;
  identityItems: PanelInfoItem[];
}

export interface ExportReadinessCard {
  status: string;
  summary: string;
  metrics: PanelInfoItem[];
}

export interface ExportFormatCard {
  name: "JSON" | "CSV" | "Markdown";
  purpose: string;
  bestFor: string;
  fileName: string;
  payload: string;
  mimeType: string;
  isAvailable: boolean;
  preview: string;
}

export interface ExportPackageCards {
  readiness: ExportReadinessCard;
  formats: ExportFormatCard[];
}

export function getSourceStrengthLabel(record: EvidenceRecord) {
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

export function buildEvidenceCitationCards(records: EvidenceRecord[]): EvidenceCitationCard[] {
  return records.map((record) => ({
    id: record.evidenceId,
    title: record.lawTitle,
    citation: record.citation,
    sourceUrl: record.sourceUrl,
    decisiveBasis: formatEvidenceSnippetForDisplay(record),
    mappingRationale: record.mappingRationale || record.pillar6Mapping,
    reviewerNote: record.reviewerNote,
    identityItems: [
      { label: "Jurisdiction", value: record.country },
      { label: "Indicator", value: record.indicatorCode },
      { label: "Source type", value: getSourceStrengthLabel(record) },
      { label: "Review status", value: record.reviewStatus },
      { label: "Confidence", value: `${Math.round(record.confidence * 100)}%` },
      ...(record.sourceLocator ? [{ label: "Locator", value: record.sourceLocator }] : [])
    ]
  }));
}

export function buildExportPackageCards({
  exportPackage,
  fallbackJson,
  fallbackMarkdown = "",
  fallbackCsv = ""
}: {
  exportPackage?: LegalReviewExportOutput | null;
  analysisRunId?: string | null;
  fallbackJson: unknown;
  fallbackMarkdown?: string;
  fallbackCsv?: string;
}): ExportPackageCards {
  const jsonPayload = exportPackage?.exportJson ?? fallbackJson;
  const jsonText = JSON.stringify(jsonPayload, null, 2);
  const csvText = exportPackage?.exportCsvRows?.length
    ? exportRowsToCsv(exportPackage.exportCsvRows)
    : fallbackCsv;
  const markdownText = exportPackage?.exportMarkdown ?? fallbackMarkdown;
  const reviewSummary = exportPackage?.reviewSummary;

  return {
    readiness: {
      status: exportPackage?.exportReadiness ?? "No export package returned",
      summary:
        exportPackage?.judgeSummary ??
        "The current result can still be exported from the evidence returned in this run.",
      metrics: [
        { label: "Approved", value: reviewSummary?.approvedCount ?? 0 },
        { label: "Needs Revision", value: reviewSummary?.needsRevisionCount ?? 0 },
        { label: "Rejected", value: reviewSummary?.rejectedCount ?? 0 },
        { label: "Human Review", value: reviewSummary?.humanReviewCount ?? 0 }
      ]
    },
    formats: [
      {
        name: "JSON",
        purpose: "Structured machine-readable output.",
        bestFor: "Downstream workflows, audit storage, and API integration.",
        fileName: "analysis.json",
        payload: jsonText,
        mimeType: "application/json",
        isAvailable: Boolean(jsonText),
        preview: truncatePreview(jsonText)
      },
      {
        name: "CSV",
        purpose: "Spreadsheet-friendly evidence review table.",
        bestFor: "Manual checking, scoring, and submission preparation.",
        fileName: "analysis.csv",
        payload: csvText,
        mimeType: "text/csv",
        isAvailable: Boolean(csvText),
        preview: truncatePreview(csvText)
      },
      {
        name: "Markdown",
        purpose: "Human-readable legal report.",
        bestFor: "Judge review, documentation, and presentation appendix.",
        fileName: "analysis.md",
        payload: markdownText,
        mimeType: "text/markdown",
        isAvailable: Boolean(markdownText),
        preview: markdownText
      }
    ]
  };
}

function exportRowsToCsv(rows: Array<Record<string, string | number>>) {
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

function truncatePreview(value: string) {
  if (value.length <= 720) {
    return value;
  }

  return `${value.slice(0, 720).trimEnd()}\n...`;
}
