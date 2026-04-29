import { architectureRows, pillar6Agents } from "@/data/agents";
import { AgentMeta } from "@/types/agent-schema";

function getAgentPresentation(agent: AgentMeta, isRunning: boolean, hasResult: boolean) {
  if (hasResult) {
    return {
      card: "border-emerald-200 bg-emerald-50/65 shadow-[0_14px_36px_rgba(16,185,129,0.08)]",
      badge: "bg-emerald-100 text-emerald-700",
      ribbon: "bg-emerald-600"
    };
  }

  if (isRunning && agent.agent_type === "mainline") {
    return {
      card: "border-blue-200 bg-blue-50/70 shadow-[0_16px_40px_rgba(37,99,235,0.08)]",
      badge: "bg-blue-100 text-blue-700",
      ribbon: "bg-blue-600"
    };
  }

  if (agent.status === "API-ready") {
    return {
      card: "border-slate-200 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.05)]",
      badge: "bg-slate-100 text-slate-700",
      ribbon: "bg-slate-800"
    };
  }

  if (agent.status === "Mock") {
    return {
      card: "border-amber-200 bg-amber-50/55 shadow-[0_10px_30px_rgba(180,83,9,0.05)]",
      badge: "bg-amber-100 text-amber-700",
      ribbon: "bg-amber-600"
    };
  }

  return {
    card: "border-blue-100 bg-white/92 shadow-[0_10px_30px_rgba(37,99,235,0.05)]",
    badge: "bg-blue-100 text-blue-700",
    ribbon: "bg-blue-500"
  };
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
      <div className="rounded-[1.75rem] border border-blue-100 bg-white/90 p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="section-title text-xs font-semibold text-blue-700">Evidence Pipeline</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
              Eleven-Agent Pillar 6 Architecture
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              This architecture is scoped only to UN ESCAP RDTII Pillar 6: Cross-Border Data
              Policies. It organizes legal intake, evidence extraction, indicator mapping,
              reasoning, quantification, citation review, and export into a policy-analysis-ready
              multi-agent system.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <LegendPill label="Topology" value="11 Specialized Agents" />
            <LegendPill
              label="Current State"
              value={hasResult ? "Completed" : isRunning ? "Mock Execution" : "Architecture Ready"}
            />
            <LegendPill label="Scope" value="Pillar 6 Only" />
          </div>
        </div>
      </div>

      <section className="mt-6 rounded-[1.75rem] border border-blue-100 bg-white/90 p-5">
        <div className="mb-4">
          <p className="section-title text-xs font-semibold text-blue-700">
            Team Responsibility Overview
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">
            Delivery Ownership by Agent Track
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Mainline implementation is assigned to Rakan, while supporting orchestration and
            frontend-facing delivery is assigned to Arnold.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ResponsibilityColumn
            title="Rakan: Mainline Agents"
            tone="blue"
            agents={pillar6Agents.filter((agent) => agent.owner_track === "teammate-mainline")}
          />
          <ResponsibilityColumn
            title="Arnold: Frontend + Supporting Agents"
            tone="slate"
            agents={pillar6Agents.filter((agent) => agent.owner_track === "my-supporting")}
          />
        </div>
      </section>

      <div className="mt-6 space-y-6">
        {architectureRows.map((row) => {
          const rowAgents = row.agentIds
            .map((agentId) => pillar6Agents.find((agent) => agent.id === agentId))
            .filter((agent): agent is AgentMeta => Boolean(agent));

          return (
            <section
              key={row.title}
              className="rounded-[1.75rem] border border-blue-100 bg-white/88 p-5"
            >
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                    {row.layer}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">{row.title}</h3>
                </div>
                <p className="max-w-3xl text-sm leading-6 text-slate-600">{row.summary}</p>
              </div>

              <div
                className={`grid gap-4 ${
                  rowAgents.length === 5
                    ? "xl:grid-cols-5 md:grid-cols-2"
                    : "xl:grid-cols-3 md:grid-cols-2"
                }`}
              >
                {rowAgents.map((agent, index) => {
                  const number = pillar6Agents.findIndex((item) => item.id === agent.id) + 1;
                  const presentation = getAgentPresentation(agent, isRunning, hasResult);

                  return (
                    <article
                      key={agent.id}
                      className={`relative overflow-hidden rounded-[1.5rem] border p-5 ${presentation.card} ${
                        isRunning && agent.agent_type === "mainline" ? "agent-running" : ""
                      }`}
                    >
                      <div className={`absolute left-0 top-0 h-full w-1.5 ${presentation.ribbon}`} />
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Agent {String(number).padStart(2, "0")}
                          </p>
                          <h4 className="mt-2 text-lg font-semibold leading-7 text-slate-950">
                            {agent.name}
                          </h4>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${presentation.badge}`}
                        >
                          {agent.status}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <MetaTag label={agent.layer} tone="neutral" />
                        <MetaTag
                          label={agent.agent_type === "mainline" ? "Mainline" : "Supporting"}
                          tone={agent.agent_type === "mainline" ? "blue" : "slate"}
                        />
                        <MetaTag
                          label={agent.owner_track === "teammate-mainline" ? "Rakan Track" : "Arnold Track"}
                          tone={agent.owner_track === "teammate-mainline" ? "blue" : "slate"}
                        />
                      </div>

                      <div className="mt-4 rounded-2xl border border-white/80 bg-white/88 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Main Function
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{agent.role}</p>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <InfoBlock title="Input" value={agent.input} />
                        <InfoBlock title="Output" value={agent.output} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function ResponsibilityColumn({
  title,
  agents,
  tone
}: {
  title: string;
  agents: AgentMeta[];
  tone: "blue" | "slate";
}) {
  const classes = {
    blue: "border-cyan-100 bg-cyan-50/50",
    slate: "border-slate-200 bg-slate-50/70"
  };

  return (
    <div className={`rounded-[1.5rem] border p-4 ${classes[tone]}`}>
      <h4 className="text-lg font-semibold text-slate-950">{title}</h4>
      <div className="mt-4 space-y-3">
        {agents.map((agent) => (
          <div key={agent.id} className="rounded-2xl border border-white/80 bg-white/90 p-4">
            <p className="text-sm font-semibold text-slate-950">{agent.name}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{agent.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function MetaTag({
  label,
  tone
}: {
  label: string;
  tone: "neutral" | "blue" | "slate";
}) {
  const classes = {
    neutral: "border-blue-100 bg-blue-50 text-blue-700",
    blue: "border-cyan-100 bg-cyan-50 text-cyan-700",
    slate: "border-slate-200 bg-slate-100 text-slate-700"
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${classes[tone]}`}>
      {label}
    </span>
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
