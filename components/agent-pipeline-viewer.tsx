import { pipelineStages } from "@/lib/mock-evidence";

const pipelinePhases = [
  {
    label: "Discovery",
    range: "Agents 1-2",
    summary: "Builds search logic and finds authoritative legal sources.",
    accent: "from-sky-500/20 via-blue-500/10 to-transparent"
  },
  {
    label: "Evidence Intake",
    range: "Agents 3-4",
    summary: "Reads documents and keeps only Pillar 6-relevant passages.",
    accent: "from-cyan-500/20 via-blue-500/10 to-transparent"
  },
  {
    label: "Mapping & Review",
    range: "Agents 5-7",
    summary: "Maps indicators, checks citations, and prepares human review.",
    accent: "from-indigo-500/20 via-blue-500/10 to-transparent"
  },
  {
    label: "Reporting",
    range: "Agent 8",
    summary: "Packages outputs into deliverables for judges and reviewers.",
    accent: "from-emerald-500/20 via-teal-500/10 to-transparent"
  }
] as const;

function getCardState(index: number, isRunning: boolean, hasResult: boolean) {
  if (hasResult) {
    return "Completed";
  }

  if (isRunning && index === 0) {
    return "Active";
  }

  if (isRunning) {
    return "Queued";
  }

  return "Ready";
}

function getStateClasses(state: string) {
  if (state === "Completed") {
    return {
      card: "border-emerald-200 bg-emerald-50/75 shadow-[0_20px_50px_rgba(16,185,129,0.12)]",
      badge: "bg-emerald-100 text-emerald-700",
      stripe: "from-emerald-500 via-teal-400 to-cyan-300"
    };
  }

  if (state === "Active") {
    return {
      card: "border-blue-300 bg-blue-50/85 shadow-[0_24px_64px_rgba(37,99,235,0.16)] ring-1 ring-blue-200",
      badge: "bg-blue-100 text-blue-700",
      stripe: "from-blue-600 via-cyan-400 to-sky-300"
    };
  }

  if (state === "Queued") {
    return {
      card: "border-slate-200 bg-white/88 shadow-[0_18px_46px_rgba(15,23,42,0.06)]",
      badge: "bg-slate-100 text-slate-600",
      stripe: "from-slate-400 via-slate-300 to-slate-200"
    };
  }

  return {
    card: "border-blue-100 bg-white/88 shadow-[0_18px_46px_rgba(37,99,235,0.06)]",
    badge: "bg-slate-100 text-slate-600",
    stripe: "from-blue-200 via-cyan-100 to-white"
  };
}

function getPhaseLabel(index: number) {
  if (index <= 1) {
    return "Discovery";
  }

  if (index <= 3) {
    return "Evidence Intake";
  }

  if (index <= 6) {
    return "Mapping & Review";
  }

  return "Reporting";
}

export function AgentPipelineViewer({
  isRunning,
  hasResult
}: {
  isRunning: boolean;
  hasResult: boolean;
}) {
  return (
    <section className="glass-panel mt-8 overflow-hidden rounded-[2rem] border border-white/70 p-6">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-blue-100 bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(255,255,255,0.9)_40%,rgba(191,219,254,0.3))] p-6">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_70%)] lg:block" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-title text-xs font-semibold text-blue-700">Evidence Pipeline</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
              Eight-Agent Legal Analysis Flow
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              A staged legal evidence workflow designed for discovery, extraction, mapping,
              citation review, and export. The visual hierarchy mirrors how a law student or
              evaluator would inspect the evidence chain.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <LegendPill label="Topology" value="8 Specialized Agents" />
            <LegendPill
              label="Current State"
              value={hasResult ? "Completed" : isRunning ? "Pipeline Running" : "Ready"}
            />
            <LegendPill label="Focus" value="Pillar 6 Legal Evidence" />
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 lg:grid-cols-4">
          {pipelinePhases.map((phase) => (
            <div
              key={phase.label}
              className="relative overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/80 p-4 shadow-sm"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${phase.accent}`} />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {phase.range}
              </p>
              <h3 className="mt-2 text-base font-semibold text-slate-950">{phase.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{phase.summary}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pipelineStages.map((stage, index) => {
          const state = getCardState(index, isRunning, hasResult);
          const stateClasses = getStateClasses(state);

          return (
            <article
              key={stage.id}
              className={`group relative overflow-hidden rounded-[1.6rem] border p-5 transition duration-300 hover:-translate-y-1 ${stateClasses.card} ${
                state === "Active" ? "agent-running" : ""
              }`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${stateClasses.stripe}`}
              />
              <div className="absolute right-4 top-4 text-6xl font-semibold tracking-tight text-slate-200/70">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {getPhaseLabel(index)}
                    </p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Agent {index + 1}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${stateClasses.badge}`}
                  >
                    {state}
                  </span>
                </div>

                <h3 className="relative mt-5 max-w-[85%] text-lg font-semibold leading-7 text-slate-950">
                  {stage.name}
                </h3>
                <p className="mt-3 min-h-[96px] text-sm leading-6 text-slate-600">
                  {stage.purpose}
                </p>

                <div className="mt-5 rounded-[1.15rem] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Output Artifact
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-800">{stage.output}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function LegendPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
