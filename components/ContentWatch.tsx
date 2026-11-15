"use client";

import { useMemo, useState } from "react";
import { AuditEntry } from "@/lib/audit";
import { FACTS } from "@/data/brand";
import { Fact } from "@/lib/types";
import { runChecks, shelfLife } from "@/lib/engine";
import CalendarMascot, { Mood } from "./CalendarMascot";
import Reveal from "./Reveal";

const DAY = 86400000;

const EXAMPLES = [
  { id: "ex1", label: "Example · Instagram caption", text: "Meet PayNest: simple payments for everyday life. Get up to ₹100 cashback on your first UPI payment." },
  { id: "ex2", label: "Example · Savings post", text: "Earn 6.5% p.a. interest* on your Nest Save. *Rate as of Nov 2026. Terms apply." },
];

function fmt(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function Ring({ pct, state, label }: { pct: number; state: "ok" | "soon" | "stale"; label: string }) {
  const r = 22, c = 2 * Math.PI * r;
  const color = state === "stale" ? "#f87171" : state === "soon" ? "#fbbf24" : "#5eead4";
  return (
    <svg viewBox="0 0 56 56" className="h-14 w-14 shrink-0" aria-label={label}>
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(243,239,228,.12)" strokeWidth="6" />
      <circle
        cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 28 28)"
        style={{ transition: "stroke-dashoffset .5s ease, stroke .3s" }}
      />
      <text x="28" y="33" textAnchor="middle" fontSize={label.length > 2 ? 13 : 16} fontWeight="700" fill={color}>{label}</text>
    </svg>
  );
}

export default function ContentWatch({
  trail, facts, setFacts, today,
}: { trail: AuditEntry[]; facts: Fact[]; setFacts: (f: Fact[]) => void; today: Date }) {
  const [offset, setOffset] = useState(0);
  const preview = new Date(today.getTime() + offset * DAY);

  const approved = trail.filter((e) => e.decision === "approved" || e.decision === "approved_override");
  const real = approved.length > 0;
  const items = real
    ? approved.map((e) => ({ id: `e${e.n}`, label: `Approved · entry #${e.n} · ${e.reviewer}`, text: e.content }))
    : EXAMPLES;

  const rows = useMemo(
    () =>
      items.map((it) => {
        const issues = runChecks(it.text, preview, facts).filter((f) => f.factId);
        const life = shelfLife(it.text, facts);
        const daysLeft = life.until
          ? Math.ceil((new Date(life.until + "T23:59:59").getTime() - preview.getTime()) / DAY)
          : null;
        return { ...it, issues, life, daysLeft };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.map((i) => i.text).join("|"), offset, facts, today]
  );

  const staleCount = rows.filter((r) => r.issues.length > 0).length;
  const anySoon = rows.some((r) => r.issues.length === 0 && r.daysLeft !== null && r.daysLeft <= 30);
  const mood: Mood = staleCount > 0 ? "expired" : anySoon ? "alert" : "happy";

  const pinMap = new Map<number, string[]>();
  facts.forEach((f) => {
    const d = Math.floor((new Date(f.validTo + "T23:59:59").getTime() - today.getTime()) / DAY) + 1;
    if (d > 0 && d <= 120) pinMap.set(d, [...(pinMap.get(d) ?? []), f.id]);
  });
  const pins = Array.from(pinMap.entries());

  function jumpToNextExpiry() {
    const next = facts
      .map((f) => Math.floor((new Date(f.validTo + "T23:59:59").getTime() - today.getTime()) / DAY) + 1)
      .filter((n) => n > offset && n <= 180)
      .sort((a, b) => a - b)[0];
    if (next !== undefined) setOffset(next);
  }

  function edit(id: string, patch: Partial<Fact>) {
    setFacts(
      facts.map((f) => {
        if (f.id !== id) return f;
        const next = { ...f, ...patch };
        if (patch.value !== undefined && f.value !== null) {
          next.approved = f.approved.replace(String(f.value), String(patch.value));
        }
        return next;
      })
    );
  }

  return (
    <section id="watch" className="relative scroll-mt-20 overflow-hidden bg-night text-cream">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 animate-floaty rounded-full bg-mint/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 animate-floaty rounded-full bg-[#e6c364]/10 blur-3xl" style={{ animationDuration: "7s" }} />

      <div className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-end gap-3">
              <h2 className="font-display text-5xl md:text-6xl">Content Watch</h2>
              <span className="mb-1 flex items-center gap-1.5">
                <svg viewBox="0 0 20 20" className="h-3 w-3 animate-twinkle" aria-hidden><path d="M10 0l2.400 7.600L20 10l-7.600 2.400L10 20l-2.400-7.600L0 10l7.600-2.400z" fill="#e6c364" /></svg>
                <span className="bg-gradient-to-r from-[#fbe9a6] via-[#e6c364] to-[#b8862b] bg-clip-text px-1 pb-1 font-signature text-lg leading-[1.7] text-transparent md:text-xl">
                  Signature feature
                </span>
              </span>
            </div>
            <ul className="mt-6 max-w-2xl space-y-2 text-cream/80">
              <li>• Approval is not forever: offers expire and facts change after content goes out.</li>
              <li>• Every approved draft gets a <b>shelf life</b>, set by the facts it relies on.</li>
              <li>• Drag the date forward, or edit the Claim Ledger, and watch the calendar react.</li>
            </ul>
          </div>
          <div className="animate-floaty justify-self-center md:justify-self-end">
            <CalendarMascot mood={mood} day={preview.getDate()} month={preview.toLocaleDateString("en-IN", { month: "short" })} />
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Timeline + approved items */}
          <Reveal className="rounded-3xl bg-night-2 p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-sm text-cream/60">Preview date</div>
                <div className="font-display text-3xl">
                  {fmt(preview)}
                  {offset === 0 && <span className="ml-2 text-base text-cream/60">today</span>}
                </div>
              </div>
              <button onClick={jumpToNextExpiry} className="rounded-full bg-mint px-4 py-2 text-sm font-medium text-night transition hover:scale-105 hover:bg-white">
                Jump to next expiry
              </button>
            </div>

            <input
              type="range" min={0} max={120} value={offset}
              onChange={(e) => setOffset(Number(e.target.value))}
              aria-label="Preview date"
              className="mt-5 w-full accent-[#5eead4]"
            />
            <div className="relative mt-1 h-10">
              {pins.map(([d, ids]) => (
                <div key={d} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${(d / 120) * 100}%` }}>
                  <div className={`mx-auto h-3 w-px ${offset >= d ? "bg-red-400" : "bg-cream/40"}`} />
                  <div className={`whitespace-nowrap text-[11px] transition-colors ${offset >= d ? "text-red-300" : "text-cream/60"}`}>
                    {ids.join(", ")} ends
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-cream/50"><span>Today</span><span>+120 days</span></div>

            {!real && (
              <p className="mt-5 rounded-xl bg-night p-3 text-sm text-cream/70">
                Showing examples. Approve a draft above and it appears here with its own shelf life.
              </p>
            )}

            <ul className="mt-5 space-y-3">
              {rows.map((r) => {
                const stale = r.issues.length > 0;
                const soon = !stale && r.daysLeft !== null && r.daysLeft <= 30;
                const state = stale ? "stale" : soon ? "soon" : "ok";
                const pct = stale ? 1 : r.daysLeft === null ? 1 : Math.max(0.06, Math.min(1, r.daysLeft / 60));
                const label = stale ? "!" : r.daysLeft === null ? "∞" : String(r.daysLeft);
                return (
                  <li key={`${r.id}-${state}`} className={`flex gap-4 rounded-2xl bg-night p-4 ${stale ? "animate-shake" : ""}`}>
                    <Ring pct={pct} state={state} label={label} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-cream/60">{r.label}</span>
                        <span className={`animate-pop rounded-full px-3 py-1 text-xs font-medium ${stale ? "bg-red-500/20 text-red-300" : soon ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                          {stale ? "Now outdated" : soon ? `Expires in ${r.daysLeft} days` : "Still compliant"}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm">{r.text}</p>
                      <div className="mt-2 text-xs text-cream/60">
                        {r.life.until
                          ? `Shelf life: until ${fmt(new Date(r.life.until + "T12:00:00"))} (${r.life.ids.join(", ")})`
                          : "Shelf life: no time-limited facts used"}
                      </div>
                      {stale && (
                        <ul className="mt-2 space-y-1 text-xs text-red-300">
                          {r.issues.map((f) => (
                            <li key={f.id}>• {f.title}: {f.why}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          {/* Editable ledger */}
          <Reveal delay={150} className="rounded-3xl bg-night-2 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium">Claim Ledger</h3>
              <button onClick={() => setFacts(FACTS)} className="rounded-full border border-cream/20 px-3 py-1 text-xs hover:bg-white/10">
                Reset
              </button>
            </div>
            <p className="mt-2 text-sm text-cream/60">
              Change a value or date. The checker above and every approved item re-check instantly.
            </p>
            <ul className="mt-4 space-y-3">
              {facts.map((f) => (
                <li key={f.id} className="rounded-2xl bg-night p-4 text-sm">
                  <div className="font-medium">{f.id} · {f.topic}</div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {f.value !== null && (
                      <label className="text-xs text-cream/60">
                        Value
                        <input
                          type="number" step="any" value={f.value}
                          onChange={(e) => e.target.value !== "" && edit(f.id, { value: Number(e.target.value) })}
                          className="mt-1 block w-24 rounded-lg border border-cream/20 bg-night-2 px-2 py-1 text-sm text-cream"
                        />
                      </label>
                    )}
                    <label className="text-xs text-cream/60">
                      Valid to
                      <input
                        type="date" value={f.validTo}
                        onChange={(e) => e.target.value && edit(f.id, { validTo: e.target.value })}
                        className="mt-1 block rounded-lg border border-cream/20 bg-night-2 px-2 py-1 text-sm text-cream [color-scheme:dark]"
                      />
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
