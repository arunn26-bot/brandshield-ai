"use client";

import { useMemo } from "react";
import { AuditEntry } from "@/lib/audit";
import { buildDashboard } from "@/lib/dashboard";
import type { Fact } from "@/lib/types";
import Icon from "@/components/Icon";

const DAY = 86400000;

function fmt(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function Expiry({
  trail, facts, today, onSeedDemo, seeding,
}: {
  trail: AuditEntry[];
  facts: Fact[];
  today: Date;
  onSeedDemo: () => void;
  seeding: boolean;
}) {
  const rows = useMemo(
    () =>
      facts
        .map((f) => ({ fact: f, days: Math.ceil((new Date(f.validTo + "T23:59:59").getTime() - today.getTime()) / DAY) }))
        .sort((a, b) => a.days - b.days),
    [facts, today]
  );
  const stale = useMemo(() => buildDashboard(trail, facts, today, 30).stale, [trail, facts, today]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-night-2 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-xl">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-mint/10 text-mint">
              <Icon name="hourglass" className="h-4 w-4" />
            </span>
            Expiry inbox · approved facts with a clock on them
          </h2>
          <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-cream/60">
            {rows.filter((r) => r.days <= 60).length} need attention in 60 days
          </span>
        </div>
        <ul className="mt-4 space-y-2.5">
          {rows.map(({ fact, days }) => (
            <li key={fact.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-night p-4">
              <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${days < 0 ? "bg-red-400/10 text-red-300" : days <= 30 ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}>
                {days < 0 ? "expired" : days === 0 ? "ends today" : `${days} days`}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-cream">{fact.id} · {fact.topic}</div>
                <div className="text-xs text-cream/55">
                  “{fact.approved}” · owner {fact.owner} · valid to {fmt(fact.validTo)}
                </div>
              </div>
              {days < 0 && <span className="text-[11px] text-red-300">New drafts using this are flagged CLAIM-05.</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-white/10 bg-night-2 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-xl">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-mint/10 text-mint">
              <Icon name="doc" className="h-4 w-4" />
            </span>
            Approved content that went stale
          </h2>
          <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-cream/60">{stale.length} stale</span>
        </div>

        {trail.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-sm text-cream/55">Nothing approved yet. Approve something in the queue, or load the demo history.</p>
            <button
              onClick={onSeedDemo}
              disabled={seeding}
              className="mt-4 rounded-full bg-mint px-4 py-2 text-xs font-medium text-night transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-40"
            >
              {seeding ? "Building…" : "Load demo history"}
            </button>
          </div>
        ) : stale.length === 0 ? (
          <p className="mt-4 text-sm text-cream/55">Every approved draft still passes against today&apos;s ledger. Nothing to pull.</p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {stale.map((s) => (
              <li key={s.n} className="rounded-2xl bg-night p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-cream/50">entry #{s.n} · approved by {s.reviewer}</span>
                  {s.until && <span className="text-[11px] text-amber-300">shelf life ended {fmt(s.until)}</span>}
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-cream/80">{s.preview}</p>
                <ul className="mt-2 space-y-0.5 text-[11.5px] text-red-300">
                  {s.issues.map((i) => <li key={i}>• {i}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-[11px] leading-4 text-cream/40">
          Approval seals the draft and the rulebook version, not the future. When a fact expires, the trail shows which
          approved content relied on it — that is the pull-list.
        </p>
      </section>
    </div>
  );
}
