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
    <section className="glass-panel rounded-2xl p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="section-title text-xs font-medium text-slate-400">Evidence Table</p>
          <h2 className="mt-2 text-xl font-medium text-slate-900">Evidence Review Queue</h2>
        </div>
        <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
          {records.length} records
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="px-3 py-2 font-medium">Country</th>
              <th className="px-3 py-2 font-medium">Indicator</th>
              <th className="px-3 py-2 font-medium">Law Title</th>
              <th className="px-3 py-2 font-medium">Citation</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Tags</th>
              <th className="px-3 py-2 font-medium">Confidence</th>
              <th className="px-3 py-2 font-medium">Review</th>
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
                    className={`rounded-l-lg border px-3 py-3 text-sm font-medium ${
                      selected
                        ? "border-slate-300 bg-slate-50 text-slate-900"
                        : "border-slate-100 bg-white text-slate-900"
                    }`}
                  >
                    {record.country}
                  </td>
                  <td
                    className={`border-y px-3 py-3 text-sm leading-6 ${
                      selected
                        ? "border-slate-300 bg-slate-50 text-slate-700"
                        : "border-slate-100 bg-white text-slate-600"
                    }`}
                  >
                    {record.indicator}
                  </td>
                  <td
                    className={`border-y px-3 py-3 text-sm leading-6 ${
                      selected
                        ? "border-slate-300 bg-slate-50 text-slate-700"
                        : "border-slate-100 bg-white text-slate-600"
                    }`}
                  >
                    {record.lawTitle}
                  </td>
                  <td
                    className={`border-y px-3 py-3 text-sm leading-6 ${
                      selected
                        ? "border-slate-300 bg-slate-50 text-slate-700"
                        : "border-slate-100 bg-white text-slate-600"
                    }`}
                  >
                    {record.citation}
                  </td>
                  <td
                    className={`border-y px-3 py-3 text-sm leading-6 ${
                      selected
                        ? "border-slate-300 bg-slate-50 text-slate-700"
                        : "border-slate-100 bg-white text-slate-600"
                    }`}
                  >
                    {record.sourceType}
                  </td>
                  <td
                    className={`border-y px-3 py-3 text-sm leading-6 ${
                      selected
                        ? "border-slate-300 bg-slate-50 text-slate-700"
                        : "border-slate-100 bg-white text-slate-600"
                    }`}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {record.discoveryTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td
                    className={`border-y px-3 py-3 text-sm leading-6 ${
                      selected
                        ? "border-slate-300 bg-slate-50 text-slate-700"
                        : "border-slate-100 bg-white text-slate-600"
                    }`}
                  >
                    {Math.round(record.confidence * 100)}%
                  </td>
                  <td
                    className={`rounded-r-lg border px-3 py-3 text-sm leading-6 ${
                      selected
                        ? "border-slate-300 bg-slate-50 text-slate-700"
                        : "border-slate-100 bg-white text-slate-600"
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
