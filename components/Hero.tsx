"use client";

import { useMemo, useState } from "react";
import { applyFixes, brandScore, runChecks } from "@/lib/engine";
import Annotated from "./Annotated";
import Pic from "./Pic";

function PostArt() {
  return (
    <svg viewBox="0 0 360 190" className="h-48 w-full" role="img" aria-label="PayNest promo">
      <defs><linearGradient id="pa" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0f766e" /><stop offset="1" stopColor="#134e4a" /></linearGradient></defs>
      <rect width="360" height="190" fill="url(#pa)" />
      <circle cx="300" cy="30" r="60" fill="#5eead4" opacity="0.15" />
      <circle cx="40" cy="170" r="70" fill="#5eead4" opacity="0.12" />
      <rect x="118" y="46" width="124" height="98" rx="18" fill="#f3efe4" />
      <rect x="118" y="46" width="124" height="30" rx="18" fill="#5eead4" />
      <circle cx="214" cy="112" r="12" fill="#0f766e" />
      <text x="214" y="117" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">₹</text>
      <rect x="134" y="96" width="46" height="7" rx="3.500" fill="#c9c6b8" />
      <rect x="134" y="112" width="34" height="7" rx="3.500" fill="#c9c6b8" />
      <circle cx="82" cy="70" r="14" fill="#fcd34d" /><text x="82" y="75" textAnchor="middle" fontSize="13" fontWeight="700" fill="#92400e">₹</text>
      <circle cx="288" cy="140" r="11" fill="#fcd34d" /><text x="288" y="144" textAnchor="middle" fontSize="11" fontWeight="700" fill="#92400e">₹</text>
    </svg>
  );
}

const DEMO_DAY = new Date("2026-11-13T12:00:00");
const DRAFT =
  "OMG!! Paynest is the best payments app in India. Get guaranteed returns of 9% on your savings account. Get ₹500 cashback now, plus Diwali double cashback.";
const FIXED = applyFixes(DRAFT, runChecks(DRAFT, DEMO_DAY));

export default function Hero() {
  const [fixed, setFixed] = useState(false);
  const text = fixed ? FIXED : DRAFT;
  const findings = useMemo(() => runChecks(text, DEMO_DAY), [text]);
  const score = brandScore(findings);
  const high = findings.filter((f) => f.severity === "high").length;

  return (
    <section className="relative overflow-hidden bg-night text-cream">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-mint/10 blur-3xl" />
      <div id="top" className="relative mx-auto max-w-6xl px-6 pb-24 pt-32 md:pt-40">
        <h1 className="font-display text-[44px] leading-[1.02] md:text-[96px]">
          Brand content,
          <br />
          <span className="text-mint">checked</span> before it ships.
        </h1>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <ul className="space-y-3 text-lg text-cream/80">
              {[
                "Checks captions, emails and ads against approved rules and facts",
                "Every finding quotes the draft and names the rule it breaks",
                "Fixes keep your message and use approved wording",
                "Re-checks approved content when facts change or offers expire",
                "A person makes the final call",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint text-night">
                    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m4 10 4 4 8-8" /></svg>
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#try" className="rounded-full bg-mint px-7 py-4 text-base font-medium text-night hover:bg-white">
                Start the demo, no sign-up
              </a>
              <a href="#how" className="px-2 py-4 text-base text-cream/80 hover:text-white">
                See how it works
              </a>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-3">
              <div className="rounded-3xl bg-night-2 p-5">
                <div className="text-xs text-cream/60">Open findings</div>
                <div className="mt-2 font-display text-5xl">{findings.length}</div>
                <div className="mt-2 text-xs text-cream/60">{high} high severity</div>
              </div>
              <div className="rounded-3xl bg-night-2 p-5">
                <div className="text-xs text-cream/60">Brand score</div>
                <div className="mt-2 font-display text-5xl">{score}</div>
                <div className="mt-2 text-xs text-cream/60">out of 100</div>
              </div>
              <div className="rounded-3xl bg-night-2 p-5">
                <div className="text-xs text-cream/60">Apply the fixes</div>
                <button
                  onClick={() => setFixed(!fixed)}
                  aria-pressed={fixed}
                  aria-label="Toggle suggested fixes"
                  className={`mt-3 flex h-8 w-14 items-center rounded-full p-1 transition ${fixed ? "bg-mint" : "bg-cream/20"}`}
                >
                  <span className={`h-6 w-6 rounded-full bg-night transition ${fixed ? "translate-x-6" : ""}`} />
                </button>
                <div className="mt-3 text-xs text-cream/60">{fixed ? "Corrected draft" : "Original draft"}</div>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[380px]">
            <div className="rounded-[44px] border border-cream/15 bg-night-2 p-3 shadow-2xl">
              <div className="overflow-hidden rounded-[34px] bg-cream text-ink">
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-semibold text-white">P</span>
                  <div>
                    <div className="text-sm font-semibold">paynest</div>
                    <div className="text-xs text-muted">Sponsored</div>
                  </div>
                </div>
                <Pic src="/images/post.png" alt="PayNest promotional post" className="h-48 w-full object-cover" fallback={<PostArt />} />
                <div className="px-4 py-4">
                  <Annotated text={text} findings={findings} size="sm" />
                  <div className="mt-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${findings.length ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {findings.length ? `${findings.length} ${findings.length === 1 ? "finding" : "findings"}` : "Ready for review"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -left-6 top-28 hidden rounded-2xl bg-white px-4 py-2 text-xs text-ink shadow-xl md:block">
              {fixed ? "All claims match the ledger" : "₹500 ≠ ₹100 · F-101"}
            </div>
            <div className="absolute -right-4 bottom-24 hidden rounded-2xl bg-white px-4 py-2 text-xs text-ink shadow-xl md:block">
              {fixed ? "Disclaimer added" : "Offer expired · F-104"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
