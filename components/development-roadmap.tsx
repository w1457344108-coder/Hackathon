const roadmapPhases = [
  {
    id: "phase-1",
    title: "Phase 1: Interface Contract",
    status: "Current",
    goals: [
      "Establish /types/agent-schema.ts",
      "Define 10 Agent parameter contracts",
      "Lock Pillar 6 indicator enum",
      "Preserve stable frontend rendering contract"
    ]
  },
  {
    id: "phase-2",
    title: "Phase 2: Mainline Agent Integration",
    status: "Current",
    goals: [
      "Connect provider adapter",
      "Connect curated official-source pipeline",
      "Connect structured legal reasoning",
      "Keep mock fallback for uncovered jurisdictions",
      "Stream real workflow output through /api/analyze"
    ]
  },
  {
    id: "phase-3",
    title: "Phase 3: Review Persistence",
    status: "Current",
    goals: [
      "Persist analysis runs",
      "Persist reviewer status and notes",
      "Recompute export state after review save",
      "Expose run and review APIs",
      "Keep audit UI contract stable"
    ]
  },
  {
    id: "phase-4",
    title: "Phase 4: Submission Package",
    status: "Later",
    goals: [
      "Export JSON / CSV / Markdown",
      "Expand curated source coverage",
      "Swap filesystem persistence for hosted storage",
      "Add richer end-to-end tests",
      "Tighten judge-facing documentation",
      "Prepare submission walkthrough"
    ]
  }
] as const;

function getStatusClasses(status: (typeof roadmapPhases)[number]["status"]) {
  if (status === "Current") {
    return {
      badge: "border-blue-200 bg-blue-100 text-blue-700",
      card: "border-blue-200 bg-blue-50/65 shadow-[0_12px_32px_rgba(37,99,235,0.08)]",
      line: "bg-blue-500"
    };
  }

  return {
    badge: "border-slate-200 bg-slate-100 text-slate-700",
    card: "border-slate-200 bg-white/92 shadow-[0_10px_26px_rgba(15,23,42,0.05)]",
    line: "bg-slate-300"
  };
}

export function DevelopmentRoadmap() {
  return (
    <section className="glass-panel mt-8 overflow-hidden rounded-[2rem] border border-white/70 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="section-title text-xs font-semibold text-blue-700">Development Roadmap</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Pillar 6 Delivery Path from Mock Demo to Real Agent System
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            This roadmap tracks the staged build-out of the Pillar 6 system from stable interface
            contract to real provider integration, curated evidence retrieval, review persistence,
            and final submission hardening.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white/85 px-4 py-3 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Scope</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            UN ESCAP RDTII Pillar 6 Only
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        {roadmapPhases.map((phase, index) => {
          const classes = getStatusClasses(phase.status);

          return (
            <article
              key={phase.id}
              className={`relative overflow-hidden rounded-[1.6rem] border p-5 ${classes.card}`}
            >
              <div className={`absolute left-0 top-0 h-full w-1.5 ${classes.line}`} />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Phase {index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold leading-7 text-slate-950">
                    {phase.title}
                  </h3>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${classes.badge}`}
                >
                  {phase.status}
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-white/80 bg-white/88 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Goals
                </p>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                  {phase.goals.map((goal) => (
                    <li key={goal} className="rounded-2xl bg-slate-50 px-4 py-3">
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
