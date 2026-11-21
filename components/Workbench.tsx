"use client";

import { useEffect, useMemo, useState } from "react";
import { applyFixes, autoFix, brandScore, runChecks } from "@/lib/engine";
import { formatChecks } from "@/lib/formats";
import { BRAND, FACTS, LIMITS, PALETTE } from "@/data/brand";
import { AuditEntry } from "@/lib/audit";
import { Fact, Finding, Rule } from "@/lib/types";
import { PaletteColor } from "@/lib/visual";
import AiReview from "./AiReview";
import ApprovalPanel from "./ApprovalPanel";
import Annotated from "./Annotated";
import ChangeDiff from "./ChangeDiff";
import RulebookPanel from "./RulebookPanel";
import ScoreRing from "./ScoreRing";
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

const DOT: Record<string, string> = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-emerald-500" };
const RAIL: Record<string, string> = { high: "bg-red-400", medium: "bg-amber-400", low: "bg-emerald-500" };

function Counter({ n, max }: { n: number; max: number }) {
  return <span className={n > max ? "font-medium text-red-600" : "text-muted"}>{n}/{max}</span>;
}

const inputCls =
  "w-full rounded-2xl border border-line bg-paper p-4 text-base leading-7 outline-none focus:border-brand";

export default function Workbench({
  trail, setTrail, facts, today,
}: {
  trail: AuditEntry[];
  setTrail: (t: AuditEntry[]) => void;
  facts: Fact[];
  today: Date;
}) {
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("Instagram caption");
  const [text, setText] = useState(CAPTIONS[0].text);
  const [subject, setSubject] = useState(EMAILS[0].a);
  const [body, setBody] = useState(EMAILS[0].b);
  const [headline, setHeadline] = useState(ADS[0].a);
  const [desc, setDesc] = useState(ADS[0].b);
  const [open, setOpen] = useState<string | null>(null);

  const [customRules, setCustomRules] = useState<Rule[]>([]);
  const [palette, setPalette] = useState<PaletteColor[]>(PALETTE);
  const [ai, setAi] = useState<{ draft: string; findings: Finding[] }>({ draft: "", findings: [] });
  const [fixNote, setFixNote] = useState<{ text: string; at: string } | null>(null);
  const [change, setChange] = useState<{ before: string; after: string } | null>(null);

  const kind = format === "Email" ? "email" : format === "Ad copy" ? "ad" : format === "Image creative" ? "image" : "single";
  const isImage = kind === "image";
  const first = kind === "email" ? subject : headline;
  const rest = kind === "email" ? body : desc;
  const draft = kind === "email" ? `${subject}\n${body}` : kind === "ad" ? `${headline}\n${desc}` : text;

  // AI suggestions and fix summaries are only valid for the exact draft they were made on.
  const aiFindings = ai.draft === draft ? ai.findings : [];
  const note = fixNote && fixNote.at.trim() === draft.trim() ? fixNote.text : "";

  const textFindings = useMemo(
    () =>
      runChecks(
        draft,
        today,
        facts,
        kind === "email" || kind === "ad" ? formatChecks(kind, first, rest) : [],
        customRules
      ),
    [draft, today, facts, kind, first, rest, customRules]
  );
  const [visual, setVisual] = useState<{ label: string; findings: Finding[] } | null>(null);
  const findings = isImage ? (visual?.findings ?? []) : [...textFindings, ...aiFindings];
  const activeText = isImage ? (visual?.label ?? "") : draft;
  const score = brandScore(isImage ? findings : textFindings);
  const high = findings.filter((f) => f.severity === "high").length;
  const medium = findings.filter((f) => f.severity === "medium").length;
  const low = findings.filter((f) => f.severity === "low").length;
  const findingCount = findings.length;
  const changeView = change && change.after.trim() === draft.trim() ? change : null;

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("brandscore", { detail: { score, high, findings: findingCount, image: isImage } })
    );
  }, [score, high, findingCount, isImage]);

  /** Put a corrected draft back into whichever boxes this format uses. */
  function writeBack(next: string) {
    setOpen(null);
    if (next.trim() !== draft.trim()) setChange({ before: draft, after: next });
    if (kind === "single") return setText(next);
    const i = next.indexOf("\n");
    const a = i < 0 ? next : next.slice(0, i);
    const b = i < 0 ? "" : next.slice(i + 1);
    if (kind === "email") { setSubject(a); setBody(b); } else { setHeadline(a); setDesc(b); }
  }

  /** Re-check and fix until the deterministic engine is quiet, at most three passes. */
  function fixAll() {
    const { text: next, passes } = autoFix(draft, today, facts);
    writeBack(next);
    const left = runChecks(next, today, facts, [], customRules).length;
    setFixNote({
      at: next,
      text: `Applied ${passes} deterministic pass${passes === 1 ? "" : "es"}. ${
        left ? `${left} finding${left === 1 ? "" : "s"} still need a person.` : "No deterministic findings remain."
      }`,
    });
  }

  const samples =
    kind === "email" ? EMAILS.map((s) => ({ label: s.label, run: () => { setSubject(s.a); setBody(s.b); setOpen(null); setChange(null); } }))
    : kind === "ad" ? ADS.map((s) => ({ label: s.label, run: () => { setHeadline(s.a); setDesc(s.b); setOpen(null); setChange(null); } }))
    : CAPTIONS.map((s) => ({ label: s.label, run: () => { setText(s.text); setOpen(null); setChange(null); } }));

  return (
    <>
      <section id="try" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Workbench · live
            </div>
            <h2 className="mt-3 font-display text-5xl md:text-6xl">Try it on a draft</h2>
            <p className="mt-3 max-w-xl text-muted">
              Checked live against {BRAND.name}&apos;s rulebook {BRAND.rulebookVersion} and Claim Ledger.
              Everything runs in your browser.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] text-muted">
              {[`Rulebook ${BRAND.rulebookVersion}`, `${FACTS.length} ledger facts`, "In-browser checks", "AI optional"].map((t) => (
                <span key={t} className="rounded-full border border-line bg-white/70 px-2.5 py-1">{t}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => { setFormat(f); setOpen(null); setChange(null); }}
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
              <VisualCheck onResult={setVisual} palette={palette} />
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
                        onChange={(e) => {
                          const v = e.target.value.replace(/\n/g, " ");
                          if (kind === "email") setSubject(v);
                          else setHeadline(v);
                          setOpen(null);
                        }}
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
                        onChange={(e) => {
                          if (kind === "email") setBody(e.target.value);
                          else setDesc(e.target.value);
                          setOpen(null);
                        }}
                        rows={kind === "email" ? 6 : 3}
                        className={`${inputCls} resize-none`}
                        placeholder={kind === "email" ? "Email body" : "Ad description"}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-2xl bg-paper p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-muted">
                    <span>
                      Annotated draft{kind !== "single" ? ` · first line is the ${kind === "email" ? "subject" : "headline"}` : ""} · click a highlight
                    </span>
                    <span className="font-mono text-[10px] normal-case tracking-normal">
                      {draft.trim() ? draft.trim().split(/\s+/).length : 0} words
                    </span>
                  </div>
                  <Annotated text={draft} findings={findings} activeId={open} onSelect={(id) => setOpen(id)} />
                </div>
              </>
            )}
          </div>

          {/* Right: compact findings */}
          <div className="rounded-3xl border border-line bg-white">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-5">
              <div>
                <div className="text-lg font-semibold">
                  {findings.length === 0 ? "No issues found" : `${findings.length} ${findings.length === 1 ? "finding" : "findings"}`}
                </div>
                <div className="text-sm text-muted">{high} high severity · {format}</div>
              </div>
              <div className="flex items-center gap-3">
                <ScoreRing score={score} size={56} />
                {!isImage && findings.some((f) => !f.manual) && (
                  <button
                    onClick={fixAll}
                    className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white shadow-[0_12px_30px_-14px_rgba(10,122,92,0.8)] transition hover:-translate-y-0.5 hover:bg-brand-ink"
                  >
                    Fix all
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 border-b border-line bg-paper/40 px-5 py-2 text-[10.5px]">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />{high} high</span>
              <span className="flex items-center gap-1.5 text-muted"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{medium} medium</span>
              <span className="flex items-center gap-1.5 text-muted"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{low} low</span>
              <div className="ml-auto flex h-1 w-24 overflow-hidden rounded-full bg-line/70">
                <span className="bg-red-400" style={{ width: `${findingCount ? (high / findingCount) * 100 : 0}%` }} />
                <span className="bg-amber-400" style={{ width: `${findingCount ? (medium / findingCount) * 100 : 0}%` }} />
                <span className="bg-emerald-500" style={{ width: `${findingCount ? (low / findingCount) * 100 : 0}%` }} />
              </div>
            </div>

            {note && (
              <div className="border-b border-line bg-paper/70 px-5 py-2 text-xs text-muted">{note}</div>
            )}

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
                  <li key={f.id} className={`relative ${isOpen ? "bg-paper/60" : ""}`}>
                    <span
                      aria-hidden
                      className={`absolute inset-y-0 left-0 w-0.5 ${RAIL[f.severity]} ${isOpen ? "opacity-100" : "opacity-45"}`}
                    />
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
                            <span className="hidden shrink-0 rounded bg-paper px-1.5 py-0.5 font-mono text-[9.5px] text-muted ring-1 ring-line sm:inline">
                              {f.ruleId}
                            </span>
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

        {changeView && (
          <ChangeDiff
            before={changeView.before}
            after={changeView.after}
            note={note || undefined}
            onDismiss={() => setChange(null)}
          />
        )}

        <AiReview
          key={draft}
          draft={draft}
          findings={textFindings}
          onResult={(list) => setAi({ draft, findings: list })}
          disabled={isImage}
        />

        <RulebookPanel onRules={setCustomRules} onPalette={setPalette} />

        <ApprovalPanel text={activeText} findings={findings} format={format} trail={trail} setTrail={setTrail} />
      </section>
    </>
  );
}
