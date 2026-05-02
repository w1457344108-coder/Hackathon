import { EvidenceRecord } from "@/lib/pillar6-schema";

export function EvidenceTable({
  records,
  selectedCitation,
  onSelect
}: {
  records: EvidenceRecord[];
  selectedCitation: string;
  onSelect: (citation: string) => void;
}) {
  return (
    <section className="glass-panel rounded-[2rem] border border-white/70 p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="section-title text-xs font-semibold text-blue-700">Evidence Table</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Evidence Review Queue</h2>
        </div>
        <span className="rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm text-slate-600">
          {records.length} records
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
              <th className="px-4">Country</th>
              <th className="px-4">Indicator</th>
              <th className="px-4">Law Title</th>
              <th className="px-4">Citation</th>
              <th className="px-4">Source</th>
              <th className="px-4">Tags</th>
              <th className="px-4">Confidence</th>
              <th className="px-4">Review</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const selected = record.citation === selectedCitation;

              return (
                <tr
                  key={`${record.country}-${record.citation}`}
                  className="cursor-pointer align-top"
                  onClick={() => onSelect(record.citation)}
                >
                  <td
                    className={`rounded-l-3xl border px-4 py-4 text-sm font-semibold ${
                      selected
                        ? "border-blue-300 bg-blue-50 text-blue-900"
                        : "border-blue-100 bg-white text-slate-900"
                    }`}
                  >
                    {record.country}
                  </td>
                  <td
                    className={`border-y px-4 py-4 text-sm leading-6 ${
                      selected
                        ? "border-blue-300 bg-blue-50 text-slate-800"
                        : "border-blue-100 bg-white text-slate-600"
                    }`}
                  >
                    {record.indicator}
                  </td>
                  <td
                    className={`border-y px-4 py-4 text-sm leading-6 ${
                      selected
                        ? "border-blue-300 bg-blue-50 text-slate-800"
                        : "border-blue-100 bg-white text-slate-600"
                    }`}
                  >
                    {record.lawTitle}
                  </td>
                  <td
                    className={`border-y px-4 py-4 text-sm leading-6 ${
                      selected
                        ? "border-blue-300 bg-blue-50 text-slate-800"
                        : "border-blue-100 bg-white text-slate-600"
                    }`}
                  >
                    {record.citation}
                  </td>
                  <td
                    className={`border-y px-4 py-4 text-sm leading-6 ${
                      selected
                        ? "border-blue-300 bg-blue-50 text-slate-800"
                        : "border-blue-100 bg-white text-slate-600"
                    }`}
                  >
                    {record.sourceType}
                  </td>
                  <td
                    className={`border-y px-4 py-4 text-sm leading-6 ${
                      selected
                        ? "border-blue-300 bg-blue-50 text-slate-800"
                        : "border-blue-100 bg-white text-slate-600"
                    }`}
                  >
                    <div className="flex flex-wrap gap-2">
                      {record.discoveryTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td
                    className={`border-y px-4 py-4 text-sm leading-6 ${
                      selected
                        ? "border-blue-300 bg-blue-50 text-slate-800"
                        : "border-blue-100 bg-white text-slate-600"
                    }`}
                  >
                    {Math.round(record.confidence * 100)}%
                  </td>
                  <td
                    className={`rounded-r-3xl border px-4 py-4 text-sm leading-6 ${
                      selected
                        ? "border-blue-300 bg-blue-50 text-slate-800"
                        : "border-blue-100 bg-white text-slate-600"
                    }`}
                  >
                    {record.reviewStatus}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
