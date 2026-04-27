import { EvidenceRecord } from "@/lib/pillar6-schema";

export function AuditView({ record }: { record: EvidenceRecord }) {
  return (
    <section className="glass-panel rounded-[2rem] border border-white/70 p-6">
      <div className="mb-5">
        <p className="section-title text-xs font-semibold text-blue-700">Audit View</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Left-Right Legal Review</h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[1.5rem] border border-blue-100 bg-white/85 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Original Legal Text</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">
            {record.lawTitle} · {record.citation}
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-700">{record.originalLegalText}</p>
          <a
            href={record.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition hover:border-blue-300"
          >
            Open source URL
          </a>
        </article>

        <article className="rounded-[1.5rem] border border-blue-100 bg-blue-50/60 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">AI Extraction Review</p>
          <div className="mt-4 space-y-4">
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
    <div className="rounded-2xl border border-white/70 bg-white/90 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{content}</p>
    </div>
  );
}
