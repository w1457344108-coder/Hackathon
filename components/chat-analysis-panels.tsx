"use client";

import { useEffect, useMemo, useState } from "react";
import { EvidenceRecord } from "@/lib/pillar6-schema";
import {
  buildEvidenceCitationCards,
  buildExportPackageCards,
  type EvidenceCitationCard,
  type ExportFormatCard,
  type PanelInfoItem
} from "@/lib/analysis-panel-cards";
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

function downloadTextFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
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

  useEffect(() => {
    setEvidenceRecords(result.evidenceRecords ?? []);
    setExportPackage(result.supportingAgentResults?.legalReviewExport?.data ?? null);
  }, [result]);

  const evidenceCards = useMemo(
    () => buildEvidenceCitationCards(evidenceRecords),
    [evidenceRecords]
  );
  const exportCards = useMemo(
    () =>
      buildExportPackageCards({
        exportPackage,
        analysisRunId: result.analysisRunId,
        fallbackJson: result
      }),
    [exportPackage, result]
  );

  return (
    <div className="mt-4 space-y-4 font-schibsted">
      <details open className="group rounded-lg border border-[#dbe3ec] bg-white px-5 py-5 shadow-[0_14px_42px_rgba(15,23,42,0.06)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-black [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#2f526d]">
              Evidence chain
            </span>
            <span className="mt-1 block font-fustat text-[26px] font-bold leading-tight tracking-normal text-[#284359]">
              Evidence records and citations
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-[#e8f0f8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#315b79] transition group-open:bg-[#dcebf6]">
            <span className="group-open:hidden">Expand ▼</span>
            <span className="hidden group-open:inline">Collapse ▲</span>
          </span>
        </summary>
        <p className="mt-3 max-w-[680px] text-[14px] leading-7 text-black/62">
          Each record is shown as a source identity, decisive legal text, and mapping rationale so the answer reads like a traceable legal evidence chain.
        </p>
        <div className="mt-5 space-y-4">
          {evidenceCards.length ? (
            evidenceCards.map((card, index) => (
              <EvidenceCitationPanelCard key={card.id} card={card} index={index} />
            ))
          ) : (
            <p className="text-sm leading-6 text-black/55">No evidence records were returned.</p>
          )}
        </div>

      </details>

      <details open className="group rounded-lg border border-[#dbe3ec] bg-white px-5 py-5 shadow-[0_14px_42px_rgba(15,23,42,0.06)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-black [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#2f526d]">
              Export package
            </span>
            <span className="mt-1 block font-fustat text-[26px] font-bold leading-tight tracking-normal text-[#284359]">
              JSON / CSV / Markdown export
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-[#e8f0f8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#315b79] transition group-open:bg-[#dcebf6]">
            <span className="group-open:hidden">Expand ▼</span>
            <span className="hidden group-open:inline">Collapse ▲</span>
          </span>
        </summary>
        <div className="mt-5">
          <ExportReadinessPanel
            status={exportCards.readiness.status}
            summary={exportCards.readiness.summary}
            metrics={exportCards.readiness.metrics}
          />
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {exportCards.formats.map((format) => (
              <ExportFormatPanelCard key={format.name} format={format} />
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}

function EvidenceCitationPanelCard({
  card,
  index
}: {
  card: EvidenceCitationCard;
  index: number;
}) {
  return (
    <article className="rounded-lg border border-black/10 bg-white px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span className="inline-flex rounded-full bg-[#e8f0f8] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#315b79]">
            Evidence {index + 1}
          </span>
          <h3 className="mt-3 text-[18px] font-bold leading-7 tracking-normal text-black">
            {card.title}
          </h3>
          <p className="mt-1 text-[14px] font-semibold leading-6 text-black/64">
            {card.citation}
          </p>
        </div>
        <LargeSourceLink url={card.sourceUrl} />
      </div>

      <InfoGrid items={card.identityItems} />

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border-l-4 border-[#5aa0d4] bg-[#f7fbff] px-4 py-4">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#315b79]">
            Decisive basis
          </p>
          <p className="mt-2 whitespace-pre-line text-[14px] leading-7 text-black/72">
            {card.decisiveBasis}
          </p>
        </div>
        <div className="rounded-lg border border-black/10 bg-[#fbfcfe] px-4 py-4">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-black/42">
            Mapping rationale
          </p>
          <p className="mt-2 text-[14px] leading-7 text-black/72">{card.mappingRationale}</p>
        </div>
      </div>

    </article>
  );
}

function InfoGrid({ items }: { items: PanelInfoItem[] }) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-black/10 bg-white px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/42">
            {item.label}
          </p>
          <p className="mt-1.5 text-[13px] font-semibold leading-5 text-black">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function LargeSourceLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#2f85bd] px-5 py-3 text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(47,133,189,0.24)] transition hover:bg-[#246b9a]"
    >
      Open official source
    </a>
  );
}

function ExportReadinessPanel({
  status,
  summary,
  metrics
}: {
  status: string;
  summary: string;
  metrics: PanelInfoItem[];
}) {
  return (
    <section className="rounded-lg border border-black/10 bg-[#fbfcfe] px-4 py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-black/42">
            Export readiness
          </p>
          <h3 className="mt-2 text-[20px] font-bold leading-7 tracking-normal text-black">
            {status}
          </h3>
          <p className="mt-2 max-w-[620px] text-[14px] leading-7 text-black/68">{summary}</p>
        </div>
        <div className="grid min-w-[260px] grid-cols-2 gap-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-black/10 bg-white px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/42">
                {metric.label}
              </p>
              <p className="mt-1 text-[18px] font-bold text-black">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExportFormatPanelCard({ format }: { format: ExportFormatCard }) {
  return (
    <article className="rounded-lg border border-black/10 bg-white px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#315b79]">
        {format.name}
      </p>
      <h3 className="mt-2 text-[17px] font-bold leading-6 text-black">{format.purpose}</h3>
      <p className="mt-2 text-[13px] leading-6 text-black/62">{format.bestFor}</p>
      <button
        type="button"
        disabled={!format.isAvailable}
        onClick={() => downloadTextFile(format.fileName, format.payload, format.mimeType)}
        className="mt-4 w-full rounded-lg bg-black px-4 py-3 text-[13px] font-bold text-white transition hover:bg-black/82 disabled:cursor-not-allowed disabled:bg-black/20"
      >
        Download {format.name}
      </button>
    </article>
  );
}
