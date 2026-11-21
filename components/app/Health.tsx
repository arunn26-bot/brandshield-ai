"use client";

import { useMemo } from "react";
import { AuditEntry } from "@/lib/audit";
import { buildDashboard } from "@/lib/dashboard";
import { RULE_META } from "@/data/brand";
import type { Fact } from "@/lib/types";
import Icon from "@/components/Icon";

export default function Health({
  trail, facts, today, onSeedDemo, seeding,
}: {
  trail: AuditEntry[];
  facts: Fact[];
  today: Date;
  onSeedDemo: () => void;
  seeding: boolean;
}) {
  const dash = useMemo(() => buildDashboard(trail, facts, today, 30), [trail, facts, today]);

  const pushback = useMemo(() => {
    const map = new Map<string, { count: number; comments: string[] }>();
    for (const e of trail) {
      if (e.decision !== "approved_override" && e.decision !== "changes_requested" && e.decision !== "rejected") continue;
      for (const id of new Set(e.openFindings)) {
        const row = map.get(id) ?? { count: 0, comments: [] };
        row.count += 1;
        if (row.comments.length < 2 && e.comment) row.comments.push(`“${e.comment}” — ${e.reviewer}`);
        map.set(id, row);
      }
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
  }, [trail]);

  const max = Math.max(1, ...pushback.map(([, r]) => r.count));
  const pct = (n: number) => Math.round(n * 100);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [String(dash.total), "decisions recorded"],
          [`${pct(dash.approvalRate)}%`, "approval rate"],
          [String(dash.overridden), "written overrides"],
          [dash.avgOpenAtApproval.toFixed(1), "avg open findings at approval"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-3xl border border-white/10 bg-night-2 p-4">
            <div className="font-display text-3xl text-mint">{v}</div>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-cream/45">{l}</div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-night-2 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-xl">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-mint/10 text-mint">
              <Icon name="pulse" className="h-4 w-4" />
            </span>
            Where drafts get pushed back
          </h2>
          <span className="text-[11px] text-cream/45">
            changes requested + overrides + rejections, grouped by rule
          </span>
        </div>

        {trail.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-sm text-cream/55">No decisions yet, so there is no pushback to read.</p>
            <button
              onClick={onSeedDemo}
              disabled={seeding}
              className="mt-4 rounded-full bg-mint px-4 py-2 text-xs font-medium text-night transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-40"
            >
              {seeding ? "Building…" : "Load demo history"}
            </button>
            <p className="mt-2 text-[11px] text-cream/40">A month of the PayNest team&apos;s decisions, labelled demo.</p>
          </div>
        ) : (
          <ul className="mt-5 space-y-4">
            {pushback.map(([id, row]) => (
              <li key={id} className="rounded-2xl bg-night p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-mint">{id}</span>
                    <span className="text-sm text-cream">{RULE_META[id]?.title ?? "Rule no longer in the book"}</span>
                  </div>
                  <span className="text-xs text-cream/50">{row.count}×</span>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-mint to-gold" style={{ width: `${(row.count / max) * 100}%` }} />
                </div>
                {row.comments.length > 0 && (
                  <ul className="mt-2.5 space-y-1 text-[11.5px] leading-4 text-cream/50">
                    {row.comments.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                )}
              </li>
            ))}
            {pushback.length === 0 && (
              <li className="text-sm text-cream/55">Every decision so far was a clean approval. Nothing to fix.</li>
            )}
          </ul>
        )}
      </section>

      <p className="text-[11px] leading-4 text-cream/40">
        A rule with heavy pushback is either catching real mistakes — or it is wrong and needs rewording. Both are
        worth a meeting. The AI reviewer never adds rules here; only confirmed guidelines do.
      </p>
    </div>
  );
}
