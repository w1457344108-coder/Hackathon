import { EvidenceRecord } from "@/lib/pillar6-schema";
import { AuditCitationItem, AuditCitationOutput, RiskSummary } from "@/lib/types";

export function AuditView({
  record,
  linkedAuditItem,
  linkedCoverageSummary,
  linkedRiskSummary
}: {
  record: EvidenceRecord;
  linkedAuditItem?: AuditCitationItem | null;
  linkedCoverageSummary?: AuditCitationOutput["coverageSummary"] | null;
  linkedRiskSummary?: RiskSummary | null;
}) {
  return (
    <section className="glass-panel min-w-0 rounded-2xl p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
        <p className="section-title text-xs font-medium text-slate-400">Audit View</p>
        <h2 className="mt-2 text-xl font-medium text-slate-900">Legal Review</h2>
        </div>
        {linkedCoverageSummary ? (
          <div className="flex flex-wrap gap-2">
            <MiniPill label="Findings" value={String(linkedCoverageSummary.totalFindings)} />
            <MiniPill label="Linked" value={String(linkedCoverageSummary.linkedFindings)} />
            <MiniPill
              label="Needs Review"
              value={String(linkedCoverageSummary.needsReviewCount)}
            />
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="min-w-0 rounded-xl border border-slate-100 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-slate-400">Original Legal Text</p>
          <h3 className="mt-2 text-base font-medium text-slate-900">
            {record.lawTitle} · {record.citation}
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-600">{record.originalLegalText}</p>
          <a
            href={record.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Open source URL
          </a>
        </article>

        <article className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-400">AI Extraction Review</p>
          <div className="mt-4 space-y-3">
            <AuditBlock title="AI extraction" content={linkedAuditItem?.extractedClaim ?? record.aiExtraction} />
            <AuditBlock title="Pillar 6 mapping" content={record.pillar6Mapping} />
            <AuditBlock
              title="Citation"
              content={`${linkedAuditItem?.lawTitle ?? record.lawTitle}, ${linkedAuditItem?.citationRef ?? record.citation}`}
            />
            <AuditBlock
              title="Confidence"
              content={`${Math.round(record.confidence * 100)}% confidence in the current mock evidence pipeline.`}
            />
            <AuditBlock
              title="Traceability"
              content={linkedAuditItem?.traceabilityNote ?? "Awaiting supporting audit packaging."}
            />
            <AuditBlock
              title="Review status"
              content={linkedAuditItem?.reviewStatus ?? record.reviewStatus}
            />
            <AuditBlock title="Reviewer note" content={linkedAuditItem?.reviewerNote ?? record.reviewerNote} />
            {linkedRiskSummary ? (
              <AuditBlock
                title="Risk summary"
                content={`${linkedRiskSummary.riskLevel} risk with ${linkedRiskSummary.uncertaintyLevel.toLowerCase()} uncertainty. ${linkedRiskSummary.operationalImpact}`}
              />
            ) : null}
            <AuditBlock title="Verbatim snippet" content={record.verbatimSnippet} />
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

function MiniPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
      <span className="font-medium text-slate-700">{label}:</span> {value}
    </div>
  );
}
