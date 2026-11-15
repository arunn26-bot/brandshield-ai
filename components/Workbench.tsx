"use client";

import { useEffect, useMemo, useState } from "react";
import { applyFixes, brandScore, runChecks } from "@/lib/engine";
import { formatChecks } from "@/lib/formats";
import { BRAND, FACTS, LIMITS } from "@/data/brand";
import { AuditEntry, TRAIL_KEY } from "@/lib/audit";
import { Fact, Finding } from "@/lib/types";
import ApprovalPanel from "./ApprovalPanel";
import Annotated from "./Annotated";
import ContentWatch from "./ContentWatch";
import VisualCheck from "./VisualCheck";

const CAPTIONS = [
  { label: "Hype launch", text: "OMG!! Paynest is the best payments app in India. Get guaranteed returns of 9% on your savings account. Get ₹500 cashback now, plus Diwali double cashback." },
  { label: "Hinglish offer", text: "सबसे बेहतर ऐप! PayNest pe sabse best offers, 100% safe returns aur दिवाली कैशबैक. Abhi download karo." },
  { label: "Clean caption", text: "Meet PayNest: simple payments for everyday life. Get up to ₹100 cashback on your first UPI payment." },
];

const EMAILS = [
  {
    label: "Hype email",
    a: "OMG!! Your PayNest cashback is waiting, claim the best offer in India before it ends today",
    b: "Paynest is the best payments app in India. Get ₹500 cashback on your first UPI payment!\n\nTeam PayNest",
  },
  {
    label: "Clean email",
    a: "Your first UPI payment, made simple",
    b: "Hi there,\n\nGet up to ₹100 cashback on your first UPI payment.\n\nTo stop receiving these emails, unsubscribe at any time.\n\nTeam PayNest",
  },
];

const ADS = [
  {
    label: "Risky ad",
    a: "Get the best payments app in India today and win big!!",
    b: "Guaranteed returns on your savings account. Paynest is risk-free.",
  },
  {
    label: "Clean ad",
    a: "PayNest: simple UPI payments",
    b: "Get up to ₹100 cashback on your first UPI payment. Download PayNest today.",
  },
];

const FORMATS = ["Instagram caption", "Email", "Ad copy", "Image creative"] as const;

const DOT: Record<string, string> = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-teal-600" };

function Counter({ n, max }: { n: number; max: number }) {
  return <span className={n > max ? "font-medium text-red-600" : "text-muted"}>{n}/{max}</span>;
}

const inputCls =
  "w-full rounded-2xl border border-line bg-paper p-4 text-base leading-7 outline-none focus:border-brand";

export default function Workbench() {
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("Instagram caption");
  const [text, setText] = useState(CAPTIONS[0].text);
  const [subject, setSubject] = useState(EMAILS[0].a);
  const [body, setBody] = useState(EMAILS[0].b);
  const [headline, setHeadline] = useState(ADS[0].a);
  const [desc, setDesc] = useState(ADS[0].b);
  const [open, setOpen] = useState<string | null>(null);

  // Fixed demo date first so server and browser match, then the real date.
  const [today, setToday] = useState(() => new Date("2026-11-13T12:00:00"));
  useEffect(() => setToday(new Date()), []);

  const [facts, setFacts] = useState<Fact[]>(FACTS);
  const [trail, setTrail] = useState<AuditEntry[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRAIL_KEY);
      if (raw) setTrail(JSON.parse(raw));
    } catch {}
  }, []);

  const kind = format === "Email" ? "email" : format === "Ad copy" ? "ad" : format === "Image creative" ? "image" : "single";
  const isImage = kind === "image";
  const first = kind === "email" ? subject : headline;
  const rest = kind === "email" ? body : desc;
  const draft = kind === "email" ? `${subject}\n${body}` : kind === "ad" ? `${headline}\n${desc}` : text;

  const textFindings = useMemo(
    () => runChecks(draft, today, facts, kind === "email" || kind === "ad" ? formatChecks(kind, first, rest) : []),
    [draft, today, facts, kind, first, rest]
  );
  const [visual, setVisual] = useState<{ label: string; findings: Finding[] } | null>(null);
  const findings = isImage ? (visual?.findings ?? []) : textFindings;
  const activeText = isImage ? (visual?.label ?? "") : draft;
  const score = brandScore(findings);
  const high = findings.filter((f) => f.severity === "high").length;

  /** Put a corrected draft back into whichever boxes this format uses. */
  function writeBack(next: string) {
    setOpen(null);
    if (kind === "single") return setText(next);
    const i = next.indexOf("\n");
    const a = i < 0 ? next : next.slice(0, i);
    const b = i < 0 ? "" : next.slice(i + 1);
    if (kind === "email") { setSubject(a); setBody(b); } else { setHeadline(a); setDesc(b); }
  }

  const samples =
    kind === "email" ? EMAILS.map((s) => ({ label: s.label, run: () => { setSubject(s.a); setBody(s.b); setOpen(null); } }))
    : kind === "ad" ? ADS.map((s) => ({ label: s.label, run: () => { setHeadline(s.a); setDesc(s.b); setOpen(null); } }))
    : CAPTIONS.map((s) => ({ label: s.label, run: () => { setText(s.text); setOpen(null); } }));

  return (
    <>
      <section id="try" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-5xl md:text-6xl">Try it on a draft</h2>
            <p className="mt-3 max-w-xl text-muted">
              Checked live against {BRAND.name}&apos;s rulebook {BRAND.rulebookVersion} and Claim Ledger.
              Everything runs in your browser.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => { setFormat(f); setOpen(null); }}
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
            {isImage ? (
              <VisualCheck onResult={setVisual} />
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted">Sample:</span>
                  {samples.map((s) => (
                    <button key={s.label} onClick={s.run} className="rounded-full bg-paper px-3 py-1 hover:bg-line">
                      {s.label}
                    </button>
                  ))}
                </div>

                {kind === "single" && (
                  <textarea
                    value={text}
                    onChange={(e) => { setText(e.target.value); setOpen(null); }}
                    rows={4}
                    className={`${inputCls} resize-none`}
                    placeholder="Paste your Instagram caption here"
                  />
                )}

                {(kind === "email" || kind === "ad") && (
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-medium uppercase tracking-wide text-muted">{kind === "email" ? "Subject" : "Headline"}</span>
                        <Counter n={first.length} max={kind === "email" ? LIMITS.emailSubject : LIMITS.adHeadline} />
                      </div>
                      <input
                        value={first}
                        onChange={(e) => { const v = e.target.value.replace(/\n/g, " "); kind === "email" ? setSubject(v) : setHeadline(v); setOpen(null); }}
                        className={inputCls}
                        placeholder={kind === "email" ? "Email subject" : "Ad headline"}
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-medium uppercase tracking-wide text-muted">{kind === "email" ? "Body" : "Description"}</span>
                        {kind === "ad" && <Counter n={desc.length} max={LIMITS.adDescription} />}
                      </div>
                      <textarea
                        value={rest}
                        onChange={(e) => { kind === "email" ? setBody(e.target.value) : setDesc(e.target.value); setOpen(null); }}
                        rows={kind === "email" ? 6 : 3}
                        className={`${inputCls} resize-none`}
                        placeholder={kind === "email" ? "Email body" : "Ad description"}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-2xl bg-paper p-4">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                    Annotated draft{kind !== "single" ? ` · first line is the ${kind === "email" ? "subject" : "headline"}` : ""} · click a highlight
                  </div>
                  <Annotated text={draft} findings={findings} activeId={open} onSelect={(id) => setOpen(id)} />
                </div>
              </>
            )}
          </div>

          {/* Right: compact findings */}
          <div className="rounded-3xl border border-line bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-line p-5">
              <div>
                <div className="text-lg font-semibold">
                  {findings.length === 0 ? "No issues found" : `${findings.length} ${findings.length === 1 ? "finding" : "findings"}`}
                </div>
                <div className="text-sm text-muted">{high} high severity · {format}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-display text-4xl leading-none">{score}</div>
                  <div className="text-xs text-muted">Brand score</div>
                </div>
                {!isImage && findings.some((f) => !f.manual) && (
                  <button
                    onClick={() => writeBack(applyFixes(draft, findings))}
                    className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-ink"
                  >
                    Fix all
                  </button>
                )}
              </div>
            </div>

            <ul className="divide-y divide-line lg:max-h-[560px] lg:overflow-y-auto">
              {findings.length === 0 && (
                <li className="p-6 text-sm text-muted">
                  {isImage && !visual
                    ? "Upload a creative or load a sample to check it against the brand palette."
                    : isImage
                      ? "This creative follows the brand palette and contrast rules. Send it for review below."
                      : "This draft follows the rulebook. Send it for review below."}
                </li>
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
                            {f.manual ? f.quote : f.end > f.start ? `“${f.quote}”` : "End of draft"} →{" "}
                            {f.fix ?? (f.end > f.start ? "remove" : "add line")}
                          </span>
                        </span>
                      </button>
                      {!f.manual && (
                        <button
                          onClick={() => writeBack(applyFixes(draft, [f]))}
                          className="shrink-0 rounded-full border border-ink px-3 py-1 text-xs font-medium hover:bg-ink hover:text-white"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                    {isOpen && (
                      <div className="space-y-2 px-5 pb-4 pl-[3.25rem] text-sm">
                        <p className="text-muted">{f.why}</p>
                        <p className="text-xs text-muted">{f.category} · {f.ruleId} · {f.source}</p>
                        {f.manual && <p className="text-xs">You make this change yourself.</p>}
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

        <ApprovalPanel text={activeText} findings={findings} format={format} trail={trail} setTrail={setTrail} />
      </section>
      <ContentWatch trail={trail} facts={facts} setFacts={setFacts} today={today} />
    </>
  );
}
