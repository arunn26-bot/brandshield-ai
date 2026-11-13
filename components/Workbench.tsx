"use client";

import { useEffect, useMemo, useState } from "react";
import { applyFixes, brandScore, runChecks } from "@/lib/engine";
import { BRAND } from "@/data/brand";
import ApprovalPanel from "./ApprovalPanel";
import Annotated from "./Annotated";

const SAMPLES: { label: string; text: string }[] = [
  {
    label: "Hype launch",
    text: "OMG!! Paynest is the best payments app in India. Get guaranteed returns of 9% on your savings account. Get ₹500 cashback now, plus Diwali double cashback.",
  },
  {
    label: "Hinglish offer",
    text: "सबसे बेहतर ऐप! PayNest pe sabse best offers, 100% safe returns aur दिवाली कैशबैक. Abhi download karo.",
  },
  {
    label: "Clean caption",
    text: "Meet PayNest: simple payments for everyday life. Get up to ₹100 cashback on your first UPI payment.",
  },
];

const FORMATS = ["Instagram caption", "Email", "Ad copy"] as const;

const DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-teal-600",
};

export default function Workbench() {
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("Instagram caption");
  const [text, setText] = useState(SAMPLES[0].text);
  const [open, setOpen] = useState<string | null>(null);

  // Fixed demo date first so server and browser match, then the real date.
  const [today, setToday] = useState(() => new Date("2026-11-13T12:00:00"));
  useEffect(() => setToday(new Date()), []);

  const findings = useMemo(() => runChecks(text, today), [text, today]);
  const score = brandScore(findings);
  const high = findings.filter((f) => f.severity === "high").length;

  function pick(t: string) {
    setText(t);
    setOpen(null);
  }

  return (
    <section id="try" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-5xl md:text-6xl">Try it on a draft</h2>
          <p className="mt-3 max-w-xl text-muted">
            Checked live against {BRAND.name}&apos;s rulebook {BRAND.rulebookVersion} and Claim Ledger.
            Everything runs in your browser.
          </p>
        </div>
        <div className="flex gap-2">
          {FORMATS.map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                format === f ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_1fr]">
        {/* Left: editor, stays in view while you scroll the findings */}
        <div className="rounded-3xl border border-line bg-white p-5 lg:sticky lg:top-6">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Sample:</span>
            {SAMPLES.map((s) => (
              <button key={s.label} onClick={() => pick(s.text)} className="rounded-full bg-paper px-3 py-1 hover:bg-line">
                {s.label}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setOpen(null); }}
            rows={4}
            className="w-full resize-none rounded-2xl border border-line bg-paper p-4 text-base leading-7 outline-none focus:border-brand"
            placeholder={`Paste your ${format.toLowerCase()} here`}
          />
          <div className="mt-4 rounded-2xl bg-paper p-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Annotated draft · click a highlight
            </div>
            <Annotated text={text} findings={findings} activeId={open} onSelect={(id) => setOpen(id)} />
          </div>
        </div>

        {/* Right: compact findings */}
        <div className="rounded-3xl border border-line bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-line p-5">
            <div>
              <div className="text-lg font-semibold">
                {findings.length === 0 ? "No issues found" : `${findings.length} findings`}
              </div>
              <div className="text-sm text-muted">
                {high} high severity · {format}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-display text-4xl leading-none">{score}</div>
                <div className="text-xs text-muted">Brand score</div>
              </div>
              {findings.length > 0 && (
                <button
                  onClick={() => { setText(applyFixes(text, findings)); setOpen(null); }}
                  className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-ink"
                >
                  Fix all
                </button>
              )}
            </div>
          </div>

          <ul className="divide-y divide-line lg:max-h-[560px] lg:overflow-y-auto">
            {findings.length === 0 && (
              <li className="p-6 text-sm text-muted">This draft follows the rulebook. Send it for review below.</li>
            )}
            {findings.map((f) => {
              const isOpen = open === f.id;
              return (
                <li key={f.id} className={isOpen ? "bg-paper/60" : ""}>
                  <div className="flex items-center gap-3 px-5 py-3">
                    <button
                      onClick={() => setOpen(isOpen ? null : f.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white">
                        {f.id}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[f.severity]}`} title={f.severity} />
                          <span className="truncate text-sm font-medium">{f.title}</span>
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {f.end > f.start ? `“${f.quote}”` : "End of draft"} →{" "}
                          {f.fix ?? (f.end > f.start ? "remove" : "add disclaimer")}
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={() => { setText(applyFixes(text, [f])); setOpen(null); }}
                      className="shrink-0 rounded-full border border-ink px-3 py-1 text-xs font-medium hover:bg-ink hover:text-white"
                    >
                      Apply
                    </button>
                  </div>
                  {isOpen && (
                    <div className="space-y-2 px-5 pb-4 pl-[3.25rem] text-sm">
                      <p className="text-muted">{f.why}</p>
                      <p className="text-xs text-muted">
                        {f.category} · {f.ruleId} · {f.source}
                      </p>
                      {f.disclaimerToAdd && (
                        <p className="text-xs">Adds: <span className="text-muted">{f.disclaimerToAdd}</span></p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <ApprovalPanel text={text} findings={findings} format={format} />
    </section>
  );
}
