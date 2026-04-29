import { EvidenceRecord } from "@/lib/pillar6-schema";

export function AuditView({ record }: { record: EvidenceRecord }) {
  return (
    <section className="glass-panel min-w-0 rounded-2xl p-6">
      <div className="mb-5">
        <p className="section-title text-xs font-medium text-slate-400">Audit View</p>
        <h2 className="mt-2 text-xl font-medium text-slate-900">Legal Review</h2>
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
            <AuditBlock title="AI extraction" content={record.aiExtraction} />
            <AuditBlock title="Pillar 6 mapping" content={record.pillar6Mapping} />
            <AuditBlock title="Citation" content={`${record.lawTitle}, ${record.citation}`} />
            <AuditBlock
              title="Confidence"
              content={`${Math.round(record.confidence * 100)}% confidence in the current mock evidence pipeline.`}
            />
            <AuditBlock title="Review status" content={record.reviewStatus} />
            <AuditBlock title="Reviewer note" content={record.reviewerNote} />
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
