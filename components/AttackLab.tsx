"use client";

import { useEffect, useMemo, useState } from "react";
import { ATTACKS, runAttacks, type AttackResult } from "@/lib/attacks";
import Icon from "./Icon";

/** Fixed so the suite's expected outcomes stay reproducible. */
const SUITE_DAY = new Date("2026-11-17T12:00:00");

export default function AttackLab() {
  const [results, setResults] = useState<AttackResult[] | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setResults(runAttacks(SUITE_DAY));
      setRunId((n) => n + 1);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  function rerun() {
    setResults(runAttacks(SUITE_DAY));
    setRunId((n) => n + 1);
  }

  const total = ATTACKS.length;
  const violations = ATTACKS.filter((a) => a.kind === "violation").length;
  const traps = total - violations;
  const caught = results?.filter((r) => r.attack.kind === "violation" && r.pass).length;
  const ignored = results?.filter((r) => r.attack.kind === "trap" && r.pass).length;
  const falseAlarms = results?.filter((r) => r.attack.kind === "trap" && !r.pass).length;
  const missed = results?.filter((r) => r.attack.kind === "violation" && !r.pass).length;
  const clean = results !== null && falseAlarms === 0 && missed === 0;

  const coverage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const attack of ATTACKS) for (const id of attack.expect) counts.set(id, (counts.get(id) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, []);

  const stats: [string, string][] = [
    [`${total}`, "encounters"],
    [caught === undefined ? "—" : `${caught}/${violations}`, "violations caught"],
    [ignored === undefined ? "—" : `${ignored}/${traps}`, "traps left quiet"],
    [falseAlarms === undefined ? "—" : String(falseAlarms), "false alarms"],
  ];

  return (
    <section id="lab" className="relative scroll-mt-20 overflow-hidden bg-night text-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(55% 55% at 16% 6%, rgba(111,245,201,0.12), transparent 62%), radial-gradient(45% 45% at 88% 10%, rgba(232,197,106,0.09), transparent 60%), radial-gradient(60% 60% at 50% 115%, rgba(10,122,92,0.30), transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-mint">Adversarial suite · runs live</div>
            <h2 className="mt-3 font-display text-5xl md:text-6xl">Try to break it</h2>
            <p className="mt-3 max-w-2xl text-cream/70">
              Fourteen drafts built to fool a keyword filter: negations, competitor quotes, idioms, homoglyphs,
              invisible characters, expired offers and PII. Every case has a fixed expected outcome, and the
              engine runs on this device.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] text-cream/55">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono">{total} checks</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono">{coverage.length} rules</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono">{traps} traps · {violations} attacks</span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-3 self-start lg:sticky lg:top-24">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-cream/45">Suite summary</span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-mint/85">
                  <span className={`h-1.5 w-1.5 rounded-full ${clean ? "bg-mint" : "bg-gold"}`} />
                  {results === null ? "running" : clean ? "exact" : "diverged"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {stats.map(([value, label]) => (
                  <div key={label} className="rounded-xl bg-night/60 p-2.5 ring-1 ring-white/5">
                    <div className="font-display text-2xl leading-none tabular-nums">{value}</div>
                    <div className="mt-1.5 text-[9px] font-medium uppercase tracking-wide text-cream/45">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white/10">
                <span className="bg-mint" style={{ width: `${ignored === undefined ? 0 : (ignored / traps) * 100}%` }} />
                <span className="bg-gold" style={{ width: `${caught === undefined ? 0 : (caught / violations) * 100}%` }} />
                <span className="bg-red-400" style={{ width: `${(falseAlarms ?? 0) + (missed ?? 0) > 0 ? 8 : 0}%` }} />
              </div>

              <p className="mt-3 text-[10.5px] leading-4 text-cream/50" aria-live="polite">
                {results === null
                  ? "Running all 14 cases on this device…"
                  : clean
                    ? "All cases behave as specified. A trap passes only at zero findings; an attack passes only when every named rule fires and every stated absence holds."
                    : "A case diverged from its expected outcome. The suite reports it instead of hiding it."}
              </p>

              <button
                onClick={rerun}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-mint px-4 py-2 text-xs font-medium text-night shadow-[0_14px_36px_-16px_rgba(111,245,201,0.7)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                <Icon name="scan" className="h-3.5 w-3.5" />
                Re-run the suite
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-cream/45">Rules exercised</span>
                <span className="font-mono text-[10px] text-cream/40">{coverage.length}</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {coverage.map(([id, n]) => (
                  <span
                    key={id}
                    className="rounded-full bg-night/60 px-2 py-0.5 font-mono text-[9.5px] text-cream/65 ring-1 ring-white/10"
                    title={`${n} case${n === 1 ? "" : "s"} expect ${id}`}
                  >
                    {id} ×{n}
                  </span>
                ))}
              </div>
              <div className="mt-3 space-y-1 border-t border-white/10 pt-2.5 text-[10px] leading-4 text-cream/45">
                <div><span className="text-mint">trap</span> · passes only at zero findings</div>
                <div><span className="text-gold">attack</span> · passes only when every named rule fires</div>
              </div>
            </div>

            <p className="px-1 text-[10px] leading-4 text-cream/35">
              Engine runs locally. No draft in this section leaves the browser.
            </p>
          </aside>

          <div className="grid gap-3 md:grid-cols-2">
            {ATTACKS.map((attack, i) => {
              const result = results?.[i];
              const pass = result?.pass;
              const rules = result ? [...new Set(result.found.map((f) => f.ruleId))] : [];
              return (
                <div
                  key={`${runId}-${attack.id}`}
                  className="lab-in rounded-2xl border border-white/10 bg-white/[0.055] p-3.5 backdrop-blur-sm"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide ${
                          attack.kind === "trap"
                            ? "bg-mint/10 text-mint/90 ring-1 ring-mint/20"
                            : "bg-gold/10 text-gold ring-1 ring-gold/25"
                        }`}
                      >
                        {attack.kind === "trap" ? "stay quiet" : "catch"}
                      </span>
                      <span className="text-[12.5px] font-medium">{attack.label}</span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        pass === undefined
                          ? "text-cream/35"
                          : pass
                            ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/25"
                            : "bg-red-400/10 text-red-300 ring-1 ring-red-400/25"
                      }`}
                    >
                      {pass === undefined ? "ready" : pass ? (attack.kind === "trap" ? "ignored" : "caught") : "missed"}
                    </span>
                  </div>

                  <p className="mt-2.5 break-words font-mono text-[12px] leading-5 text-cream/90">“{attack.text}”</p>
                  <p className="mt-1.5 text-[11px] leading-4 text-cream/55">{attack.note}</p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1">
                    {result ? (
                      rules.length === 0 ? (
                        <span className="font-mono text-[10px] text-mint/80">0 findings</span>
                      ) : (
                        rules.map((id) => (
                          <span
                            key={id}
                            title={result.found.find((f) => f.ruleId === id)?.quote}
                            className="rounded-full bg-night/80 px-2 py-0.5 font-mono text-[10px] text-cream/75 ring-1 ring-white/10"
                          >
                            {id}
                          </span>
                        ))
                      )
                    ) : (
                      <span className="h-1.5 w-24 animate-pulse rounded-full bg-white/10" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-6 text-[10px] text-cream/40">
          Suite date fixed at 17 Nov 2026 so the expected outcomes are reproducible. Trap failures count as false
          alarms; attack failures count as misses.
        </p>
      </div>
    </section>
  );
}
