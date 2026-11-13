"use client";

import { useEffect, useMemo, useState } from "react";
import { applyFixes, brandScore, runChecks } from "@/lib/engine";
import { Finding } from "@/lib/types";
import { BRAND } from "@/data/brand";
import ApprovalPanel from "./ApprovalPanel";

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

const SEV_STYLE: Record<string, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-teal-50 text-teal-800 border-teal-200",
};

function Annotated({ text, findings }: { text: string; findings: Finding[] }) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  findings
    .filter((f) => f.end > f.start)
    .forEach((f) => {
      if (f.start > cursor) parts.push(text.slice(cursor, f.start));
      parts.push(
        <span key={f.id} className={`mark-${f.severity} rounded-sm px-0.5`}>
          {text.slice(f.start, f.end)}
          <sup className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-white">
            {f.id}
          </sup>
        </span>
      );
      cursor = f.end;
    });
  parts.push(text.slice(cursor));
  return <p className="whitespace-pre-wrap text-[17px] leading-8">{parts}</p>;
}

export default function Workbench() {
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("Instagram caption");
  const [text, setText] = useState(SAMPLES[0].text);

  // Start from a fixed demo date so server and browser render the same HTML,
  // then switch to the real date once the page has loaded.
  const [today, setToday] = useState(() => new Date("2026-11-13T12:00:00"));
  useEffect(() => setToday(new Date()), []);

  const findings = useMemo(() => runChecks(text, today), [text, today]);
  const score = brandScore(findings);
  const high = findings.filter((f) => f.severity === "high").length;

  return (
    <section id="try" className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl">Check a draft</h2>
          <p className="mt-2 max-w-xl text-muted">
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: input */}
        <div className="rounded-3xl border border-line bg-card p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Try a sample:</span>
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                onClick={() => setText(s.text)}
                className="rounded-full bg-paper px-3 py-1 hover:bg-line"
              >
                {s.label}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            className="w-full resize-none rounded-2xl border border-line bg-paper p-4 text-[17px] leading-8 outline-none focus:border-brand"
            placeholder={`Paste your ${format.toLowerCase()} here`}
          />
          <div className="mt-4 rounded-2xl bg-paper p-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Annotated draft
            </div>
            <Annotated text={text} findings={findings} />
          </div>
        </div>

        {/* Right: findings */}
        <div className="rounded-3xl border border-line bg-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted">
                {BRAND.name} rulebook {BRAND.rulebookVersion} · {format}
              </div>
              <div className="mt-1 text-lg font-semibold">
                {findings.length === 0
                  ? "No issues found"
                  : `${findings.length} findings, ${high} high severity`}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-4xl leading-none">{score}</div>
              <div className="text-xs text-muted">Brand score</div>
            </div>
          </div>

          {findings.length > 0 && (
            <button
              onClick={() => setText(applyFixes(text, findings))}
              className="mb-4 w-full rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-ink"
            >
              Apply all suggested fixes
            </button>
          )}

          <ol className="space-y-3">
            {findings.map((f) => (
              <li key={f.id} className="rounded-2xl border border-line p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white">
                    {f.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{f.title}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${SEV_STYLE[f.severity]}`}>
                        {f.severity}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-muted">{f.why}</div>
                    <div className="mt-2 text-xs text-muted">
                      {f.category} · {f.ruleId} · {f.source}
                    </div>
                    {f.end > f.start && (
                      <div className="mt-2 rounded-lg bg-paper px-3 py-2 text-sm">
                        <span className="text-muted">Found: </span>
                        &ldquo;{f.quote}&rdquo;
                      </div>
                    )}
                    {(f.fix || f.disclaimerToAdd || f.end > f.start) && (
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="text-sm">
                          <span className="text-muted">Fix: </span>
                          {f.fix ? <>&ldquo;{f.fix}&rdquo;</> : f.end > f.start ? "remove" : "add disclaimer"}
                          {f.disclaimerToAdd && <span className="text-muted"> + {f.disclaimerToAdd}</span>}
                        </div>
                        <button
                          onClick={() => setText(applyFixes(text, [f]))}
                          className="shrink-0 rounded-full border border-ink px-3 py-1 text-xs font-medium hover:bg-ink hover:text-white"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <ApprovalPanel text={text} findings={findings} format={format} />
    </section>
  );
}
