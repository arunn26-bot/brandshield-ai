"use client";

import { useEffect, useState } from "react";
import { brandScore, runChecks } from "@/lib/engine";
import { BRAND } from "@/data/brand";
import Annotated from "./Annotated";
import ScoreRing from "./ScoreRing";

function PostArt() {
  return (
    <svg viewBox="0 0 360 190" preserveAspectRatio="xMidYMid slice" className="h-full w-full" role="img" aria-label="PayNest promo creative">
      <defs><linearGradient id="pa" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0a7a5c" /><stop offset="1" stopColor="#0b3b31" /></linearGradient></defs>
      <rect width="360" height="190" fill="url(#pa)" />
      <circle cx="300" cy="30" r="60" fill="#6ff5c9" opacity="0.15" />
      <circle cx="40" cy="170" r="70" fill="#6ff5c9" opacity="0.12" />
      <rect x="118" y="46" width="124" height="98" rx="18" fill="#f4efe2" />
      <rect x="118" y="46" width="124" height="30" rx="18" fill="#6ff5c9" />
      <circle cx="214" cy="112" r="12" fill="#0a7a5c" />
      <text x="214" y="117" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">â‚¹</text>
      <rect x="134" y="96" width="46" height="7" rx="3.5" fill="#c9c6b8" />
      <rect x="134" y="112" width="34" height="7" rx="3.5" fill="#c9c6b8" />
      <circle cx="82" cy="70" r="14" fill="#e8c56a" /><text x="82" y="75" textAnchor="middle" fontSize="13" fontWeight="700" fill="#6b4c10">â‚¹</text>
      <circle cx="288" cy="140" r="11" fill="#e8c56a" /><text x="288" y="144" textAnchor="middle" fontSize="11" fontWeight="700" fill="#6b4c10">â‚¹</text>
    </svg>
  );
}

const DEMO_DAY = new Date("2026-11-13T12:00:00");
const DRAFT =
  "OMG!! Paynest is the best payments app in India. Get guaranteed returns of 9% on your savings account. Get â‚¹500 cashback now, plus Diwali double cashback.";
const CLEAN =
  "PayNest: simple payments for everyday life. Get up to â‚¹100 cashback on your first UPI payment.";
const DRAFT_FINDINGS = runChecks(DRAFT, DEMO_DAY);
const CLEAN_FINDINGS = runChecks(CLEAN, DEMO_DAY);
const DRAFT_SCORE = brandScore(DRAFT_FINDINGS);
const CLEAN_SCORE = brandScore(CLEAN_FINDINGS);
const WORDS = DRAFT.trim().split(/\s+/).length;
const CLAIMS = DRAFT_FINDINGS.filter((f) => f.ruleId.startsWith("CLAIM")).length;
const STAGE_MS = 3600;

const STAGES = ["Scan", "Explain", "Fix"] as const;

const STATS: [string, string][] = [
  ["94", "labelled drafts"],
  ["43", "trap drafts"],
  ["0", "false alarms"],
  ["100%", "recall"],
];

const TICKER = [
  "CLAIM-01 claim vs ledger",
  "HOMO-01 look-alike brand",
  "HOMO-02 invisible characters",
  "PII-05 card number",
  "DISC-01 missing disclaimer",
  "CLAIM-05 expired offer",
  "EMAIL-02 unsubscribe",
  "TERM-01 product name",
  "VOICE-01 hype",
  "VIS-02 contrast",
  "AD-03 call to action",
  "MSG-01 reviewer note",
];

const DOT: Record<string, string> = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-emerald-500" };

const RESOLVED: [string, string][] = [
  ["TERM-01", "Paynest â†’ PayNest"],
  ["CLAIM-01", "â‚¹500 â†’ up to â‚¹100 Â· F-101"],
  ["CLAIM-02", "9% promise removed"],
  ["CLAIM-05", "Diwali offer removed"],
  ["VOICE-01", "â€œOMG!!â€ removed"],
];

function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m4 10 4 4 8-8" />
    </svg>
  );
}

export default function Hero() {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [nonce, setNonce] = useState(0);
  const running = playing;
  const fixed = stage === 2;
  const score = fixed ? CLEAN_SCORE : DRAFT_SCORE;
  const text = fixed ? CLEAN : DRAFT;
  const shown = fixed ? CLEAN_FINDINGS : DRAFT_FINDINGS;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setStage((s) => (s + 1) % STAGES.length), STAGE_MS);
    return () => clearInterval(id);
  }, [running, nonce]);

  function jump(next: number) {
    setStage(next);
    setNonce((n) => n + 1);
  }

  return (
    <section className="relative overflow-hidden bg-night text-cream">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-mint/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-gold/[0.07] blur-3xl" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(244,239,226,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(244,239,226,0.045) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at 60% 0%, black, transparent 72%)",
        }}
      />
      <div id="top" className="relative mx-auto max-w-6xl px-6 pb-16 pt-28 md:pt-36">
        <div className="grid items-start gap-10 lg:grid-cols-[0.95fr_1.15fr] lg:gap-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-cream/65 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
              </span>
              Live demo Â· runs in your browser
            </div>

            <h1 className="mt-6 font-display text-[46px] leading-[1.02] tracking-tight sm:text-[56px] xl:text-[64px]">
              Every word,
              <br />
              <span className="bg-gradient-to-r from-mint via-mint to-gold bg-clip-text text-transparent">checked</span>{" "}
              before
              <br />
              it ships.
            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-cream/70">
              BrandShield reads a draft like a reviewer: it quotes the claim, names the rule, offers the smallest fix,
              and records who approved it.
            </p>

            <ul className="mt-7 space-y-2.5 text-sm text-cream/75">
              {[
                "Rules, approved facts and expiry checked in code",
                "Every finding cites the exact words and the source",
                "A person decides; the decision is hash-chained",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint text-night">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="/app" className="rounded-full bg-mint px-6 py-3.5 text-sm font-medium text-night shadow-[0_20px_60px_-20px_rgba(111,245,201,0.65)] transition hover:-translate-y-0.5 hover:bg-white">Open the workspace, no sign-up</a>
              <a href="#how" className="px-1 py-3 text-sm text-cream/70 underline decoration-cream/25 underline-offset-4 hover:text-white">See how it works</a>
            </div>
          </div>

          <div className="w-full">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.05] p-2 shadow-[0_50px_120px_-50px_rgba(0,0,0,0.9)] backdrop-blur">
              <div className="overflow-hidden rounded-[24px] bg-night-2 ring-1 ring-white/5">
                <div className="flex items-center gap-2 px-3 py-2 text-cream/55">
                  <span className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-400/70" />
                    <span className="h-2 w-2 rounded-full bg-amber-300/70" />
                    <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
                  </span>
                  <span className="ml-2 font-mono text-[10px] tracking-wide">brandshield / review</span>
                  <span className="hidden items-center gap-1 rounded-full bg-mint/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-mint ring-1 ring-mint/20 sm:inline-flex">
                    <span className={`h-1 w-1 rounded-full bg-mint ${running ? "animate-ping" : ""}`} />
                    {playing ? "auto" : "paused"}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    {STAGES.map((s, i) => (
                      <button
                        key={s}
                        onClick={() => jump(i)}
                        aria-current={stage === i ? "step" : undefined}
                        className={`rounded-full px-2 py-0.5 text-[10px] transition ${
                          stage === i ? "bg-mint/15 text-mint ring-1 ring-mint/30" : "text-cream/45 hover:text-cream"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setPlaying((p) => !p);
                        setNonce((n) => n + 1);
                      }}
                      aria-label={playing ? "Pause the auto-demo" : "Play the auto-demo"}
                      aria-pressed={!playing}
                      className="ml-1 rounded-full p-1 text-cream/50 hover:bg-white/10 hover:text-cream"
                    >
                      {playing ? (
                        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden><rect x="3" y="2" width="3" height="12" rx="1" /><rect x="10" y="2" width="3" height="12" rx="1" /></svg>
                      ) : (
                        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden><path d="M4 2.5v11a1 1 0 0 0 1.5.87l9-5.5a1 1 0 0 0 0-1.74l-9-5.5A1 1 0 0 0 4 2.5Z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="h-0.5 bg-white/5">
                  <div key={`${stage}-${nonce}`} className={`demo-progress h-full bg-mint/80 ${running ? "" : "paused"}`} />
                </div>

                <div className="bg-card text-ink">
                  <div className="flex items-center gap-3 px-4 pt-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-semibold text-white">P</span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">paynest</div>
                      <div className="text-[11px] text-muted">Sponsored Â· 17 Nov</div>
                    </div>
                    <span
                      className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                        fixed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {fixed ? "Compliance cleared" : "In review"}
                    </span>
                  </div>

                  <div className="grid gap-0 sm:grid-cols-[1.15fr_0.85fr]">
                    <div className="px-4 pb-3 pt-3">
                      <div className="flex gap-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-line">
                          <PostArt />
                        </div>
                        <div className="relative min-w-0 flex-1">
                          <Annotated text={text} findings={shown.slice(0, 4)} size="sm" />
                          {fixed && CLEAN_FINDINGS.length === 0 && (
                            <div className="animate-stamp pointer-events-none absolute -right-1 top-8 rounded-lg border-2 border-emerald-700/60 bg-card/40 px-2 py-1 text-center backdrop-blur-[1px]">
                              <div className="font-mono text-[7px] uppercase tracking-[0.18em] text-emerald-800">Reviewed</div>
                              <div className="font-display text-base leading-tight text-emerald-800">Approved</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line/70 pt-2 text-[10px] text-muted">
                        <span className="font-mono">{WORDS} words</span>
                        <span className="font-mono">{CLAIMS} claim checks</span>
                        <span className="font-mono">rulebook {BRAND.rulebookVersion}</span>
                      </div>
                    </div>

                    <div className="flex flex-col border-t border-line px-4 py-3 sm:border-l sm:border-t-0">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                          {fixed ? "Resolved" : "Findings"}
                        </span>
                        <span className="font-mono text-[10px] text-muted">
                          {stage === 0 ? "scanningâ€¦" : fixed ? `${DRAFT_FINDINGS.length} resolved` : `${shown.length} open`}
                        </span>
                      </div>

                      <div className="mt-2 min-h-[132px] space-y-1.5">
                        {stage === 0 &&
                          [0, 1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-2 py-1">
                              <span className="h-4 w-4 shrink-0 animate-pulse rounded-full bg-line" />
                              <div className="flex-1 space-y-1">
                                <div className="h-2 animate-pulse rounded bg-line" style={{ width: `${82 - i * 12}%` }} />
                                <div className="h-1.5 w-1/2 animate-pulse rounded bg-line/70" />
                              </div>
                            </div>
                          ))}

                        {stage > 0 &&
                          (fixed
                            ? RESOLVED.slice(0, 3).map(([rule, label]) => (
                                <div key={rule} className="flex items-start gap-2">
                                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                    <Check className="h-2 w-2" />
                                  </span>
                                  <div className="min-w-0">
                                    <div className="truncate text-[11.5px] font-medium">{label}</div>
                                    <div className="truncate font-mono text-[9px] text-muted">{rule}</div>
                                  </div>
                                </div>
                              ))
                            : shown.slice(0, 3).map((f) => (
                                <div key={f.id} className="flex items-start gap-2">
                                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-[9px] font-semibold text-white">
                                    {f.id}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="truncate text-[11.5px] font-medium">{f.title}</div>
                                    <div className="truncate font-mono text-[9px] text-muted">{f.ruleId} Â· {f.source}</div>
                                  </div>
                                  <span className={`ml-auto mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${DOT[f.severity]}`} />
                                </div>
                              )))}

                        {stage > 0 && (
                          <div className="font-mono text-[9px] text-muted">
                            {fixed
                              ? `+ ${DRAFT_FINDINGS.length - 3} more resolved`
                              : shown.length > 3
                                ? `+ ${shown.length - 3} more findings`
                                : ""}
                          </div>
                        )}
                      </div>

                      <div className="mt-auto flex items-center justify-between border-t border-line pt-2">
                        <ScoreRing score={score} size={48} label={false} />
                        <div className="text-right">
                          <div className="text-[9px] uppercase tracking-[0.14em] text-muted">{fixed ? "cleared" : "draft score"}</div>
                          <div className="text-[10.5px] font-medium">
                            {fixed ? (shown.length ? `${shown.length} for a person` : "0 findings") : `${DRAFT_FINDINGS.filter((f) => f.severity === "high").length} high severity`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line px-4 py-2 text-[10px] text-muted">
                    <span className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${fixed ? "bg-emerald-600" : "bg-amber-500"}`} />
                      {fixed ? "Approved Â· demo reviewer" : "Awaiting reviewer"}
                    </span>
                    <span className="font-mono">{fixed ? "Meera Â· 17 Nov" : "decision pending"}</span>
                    <span className="font-mono">{fixed ? "7c1e9aâ€¦ â† GENESIS" : "hash not sealed"}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-3 text-center text-[10px] text-cream/35">
              {stage === 0 && "Scanning the draft against rules, facts and expiryâ€¦"}
              {stage === 1 && `${DRAFT_FINDINGS.length} findings, each with the rule it breaks and a minimal fix.`}
              {stage === 2 && "Fixes applied, claims matched to the ledger, and a reviewer decision sealed into the trail."}
            </p>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-cream/10 bg-cream/10 sm:grid-cols-4">
          {STATS.map(([value, label]) => (
            <div key={label} className="bg-night/80 px-4 py-3.5">
              <div className="font-display text-3xl leading-none text-mint">{value}</div>
              <div className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-cream/45">{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-cream/40">
          <span>A fixed development set, not a held-out benchmark. The limits are listed in full under Trust.</span>
          <a href="#trust" className="underline decoration-cream/20 underline-offset-4 hover:text-cream/70">How we measure â†’</a>
        </div>

        <div className="relative mt-10 overflow-hidden border-y border-cream/10 py-2.5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="ticker flex w-max">
            {[0, 1].map((half) => (
              <div key={half} className="flex items-center" aria-hidden={half === 1}>
                {TICKER.map((t) => (
                  <span key={t} className="flex items-center gap-2 pr-8 font-mono text-[10px] uppercase tracking-[0.14em] text-cream/40">
                    <span className="h-1 w-1 rounded-full bg-mint/50" />
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
