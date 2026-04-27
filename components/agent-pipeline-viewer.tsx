import { pipelineStages } from "@/lib/mock-evidence";

export function AgentPipelineViewer({
  isRunning,
  hasResult
}: {
  isRunning: boolean;
  hasResult: boolean;
}) {
  return (
    <section className="glass-panel mt-8 rounded-[2rem] border border-white/70 p-6">
      <div className="mb-5">
        <p className="section-title text-xs font-semibold text-blue-700">Evidence Pipeline</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Eight-Agent Legal Analysis Flow</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pipelineStages.map((stage, index) => {
          const state = hasResult ? "Completed" : isRunning && index === 0 ? "Active" : "Ready";

          return (
            <article
              key={stage.id}
              className={`rounded-[1.5rem] border p-4 ${
                state === "Completed"
                  ? "border-emerald-200 bg-emerald-50/70"
                  : state === "Active"
                    ? "border-blue-200 bg-blue-50/80"
                    : "border-blue-100 bg-white/85"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Agent {index + 1}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    state === "Completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : state === "Active"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {state}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-950">{stage.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{stage.purpose}</p>
              <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-700">
                <span className="font-semibold text-slate-900">Output:</span> {stage.output}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
