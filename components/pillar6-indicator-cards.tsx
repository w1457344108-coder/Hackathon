import { buildPillar6IndicatorCards } from "@/lib/mock-evidence";
import { CountryPolicyProfile } from "@/lib/types";

export function Pillar6IndicatorCards({ profile }: { profile: CountryPolicyProfile }) {
  const cards = buildPillar6IndicatorCards(profile);

  return (
    <section className="glass-panel mt-8 rounded-[2rem] border border-white/70 p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-title text-xs font-semibold text-blue-700">Pillar 6 Indicators</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            ESCAP-Aligned Indicator View for {profile.country}
          </h2>
        </div>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          RDTII-style evidence framing
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article
            key={card.id}
            className="rounded-[1.5rem] border border-blue-100 bg-white/85 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {card.shortLabel}
                </p>
                <h3 className="mt-2 text-lg font-semibold leading-6 text-slate-950">
                  {card.title}
                </h3>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  card.severity === "Restrictive"
                    ? "bg-red-50 text-red-700"
                    : card.severity === "Managed"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {card.severity}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                <span>Indicator Score</span>
                <span>{card.score}/1</span>
              </div>
              <div className="h-2 rounded-full bg-blue-100">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  style={{ width: `${card.score * 100}%` }}
                />
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">{card.analystNote}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
