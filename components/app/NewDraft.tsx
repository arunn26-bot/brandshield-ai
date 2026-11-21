"use client";

import { useMemo, useRef, useState } from "react";
import { applyFixes, autoFix, brandScore, runChecks, verdict } from "@/lib/engine";
import { formatChecks } from "@/lib/formats";
import { readGuideline } from "@/lib/documents";
import { BRAND, LIMITS } from "@/data/brand";
import type { Fact, Finding, Rule } from "@/lib/types";
import type { PaletteColor } from "@/lib/visual";
import type { QueueItem } from "@/lib/queue";
import type { Role } from "./AppShell";
import Icon from "@/components/Icon";
import ScoreRing from "@/components/ScoreRing";
import Annotated from "@/components/Annotated";
import AiReview from "@/components/AiReview";
import VisualCheck from "@/components/VisualCheck";

const FORMATS = ["Instagram caption", "Email", "Ad copy", "Image creative"] as const;
type Format = (typeof FORMATS)[number];

const GOALS = ["Awareness", "Consideration", "Conversion", "Retention", "Announcement"];
const CHANNELS = ["Instagram", "Email", "Search ads", "YouTube", "In-app", "Website", "X / Twitter"];

const SAMPLES: { id: string; label: string; format: Format; blurb: string; text: string }[] = [
  {
    id: "hype", label: "Hype launch", format: "Instagram caption",
    blurb: "Every trap at once: hype voice, superlative, guaranteed returns, wrong cashback number, expired Diwali offer.",
    text: "OMG!! Paynest is the best payments app in India. Get guaranteed returns of 9% on your savings account. Get ₹500 cashback now, plus Diwali double cashback.",
  },
  {
    id: "hinglish", label: "Hinglish offer", format: "Instagram caption",
    blurb: "Hinglish with Devanagari: superlative, 100% safe returns, and a script-mixed brand voice.",
    text: "सबसे बेहतर ऐप! PayNest pe sabse best offers, 100% safe returns aur दिवाली कैशबैक. Abhi download karo.",
  },
  {
    id: "clean", label: "Clean caption", format: "Instagram caption",
    blurb: "Approved wording only. Should pass with zero findings and a full score.",
    text: "Meet PayNest: simple payments for everyday life. Get up to ₹100 cashback on your first UPI payment.",
  },
  {
    id: "unverified", label: "Unverified claims", format: "Instagram caption",
    blurb: "Numbers with no approved fact behind them. Marked Unverifiable and sent to a human approver, never approved silently.",
    text: "Meet PayNest: simple payments for everyday life. Our app is 50% faster and used by 10,000 customers.",
  },
  {
    id: "hype-mail", label: "Hype email", format: "Email",
    blurb: "Shouting subject, missing unsubscribe line, wrong product name. First line is the subject.",
    text: "OMG!! Your PayNest cashback is waiting, claim the best offer in India before it ends today\nPaynest is the best payments app in India. Get ₹500 cashback on your first UPI payment!\n\nTeam PayNest",
  },
  {
    id: "clean-mail", label: "Clean email", format: "Email",
    blurb: "Subject under 60, greeting present, unsubscribe line included.",
    text: "Your first UPI payment, made simple\nHi there,\n\nGet up to ₹100 cashback on your first UPI payment.\n\nTo stop receiving these emails, unsubscribe at any time.\n\nTeam PayNest",
  },
  {
    id: "risky-ad", label: "Risky ad", format: "Ad copy",
    blurb: "Superlative headline plus a risk-free promise in the description. First line is the headline.",
    text: "Get the best payments app in India today and win big!!\nGuaranteed returns on your savings account. Paynest is risk-free.",
  },
];

/** Each sample ships with its intent card filled in, so a judge can submit it straight away. */
const SAMPLE_INTENT: Record<string, { goal: string; key: string; cta: string }> = {
  hype: { goal: "Conversion", key: "cashback up to \u20b9100", cta: "Get cashback now" },
  hinglish: { goal: "Awareness", key: "PayNest offers", cta: "Abhi download karo" },
  clean: { goal: "Conversion", key: "first-payment cashback up to \u20b9100", cta: "Get up to \u20b9100 cashback" },
  unverified: { goal: "Awareness", key: "simple payments for everyday life", cta: "Meet PayNest" },
  "hype-mail": { goal: "Conversion", key: "cashback on your first UPI payment", cta: "Your PayNest cashback is waiting" },
  "clean-mail": { goal: "Conversion", key: "first UPI payment cashback", cta: "Get up to \u20b9100 cashback" },
  "risky-ad": { goal: "Awareness", key: "payments app", cta: "Get PayNest today" },
};
const DOT: Record<string, string> = { high: "bg-red-400", medium: "bg-amber-400", low: "bg-emerald-400" };
const RAIL: Record<string, string> = { high: "bg-red-400", medium: "bg-amber-400", low: "bg-emerald-500" };
const VERDICT_STYLE: Record<string, string> = {
  approved: "border-mint/30 bg-mint/[0.07] text-mint",
  needs_changes: "border-amber-300/30 bg-amber-400/10 text-amber-200",
  unverifiable: "border-sky-300/30 bg-sky-400/10 text-sky-200",
  blocked: "border-red-300/30 bg-red-400/10 text-red-200",
};
const KIND: Record<string, "email" | "ad" | "image" | "single"> = {
  "Instagram caption": "single", Email: "email", "Ad copy": "ad", "Image creative": "image",
};

const fieldCls =
  "w-full rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm leading-6 text-cream outline-none transition placeholder:text-cream/30 focus:border-mint/60 [color-scheme:dark]";
const labelCls = "mb-1 block text-[10px] font-medium uppercase tracking-[0.14em] text-cream/45";

export default function NewDraft({
  today, facts, customRules, palette, role,
  onStep, onSubmit,
}: {
  today: Date;
  facts: Fact[];
  customRules: Rule[];
  palette: PaletteColor[];
  role: Role;
  onStep: (id: string) => void;
  onSubmit: (item: QueueItem) => void;
}) {
  const [format, setFormat] = useState<Format>("Instagram caption");
  const [title, setTitle] = useState("Festive launch caption");
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [campaign, setCampaign] = useState("Diwali 2026");
  const [goal, setGoal] = useState(GOALS[0]);
  const [keyMessage, setKeyMessage] = useState("");
  const [cta, setCta] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const [text, setText] = useState(SAMPLES[0].text);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [headline, setHeadline] = useState("");
  const [desc, setDesc] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [ai, setAi] = useState<{ draft: string; findings: Finding[] }>({ draft: "", findings: [] });
  const [visual, setVisual] = useState<{ label: string; findings: Finding[] } | null>(null);
  const [busyFile, setBusyFile] = useState(false);
  const [fileNote, setFileNote] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const kind = KIND[format];
  const isImage = kind === "image";
  const first = kind === "email" ? subject : headline;
  const rest = kind === "email" ? body : desc;
  const draft = kind === "email" ? `${subject}\n${body}` : kind === "ad" ? `${headline}\n${desc}` : text;

  const aiFindings = ai.draft === draft ? ai.findings : [];
  const textFindings = useMemo(
    () =>
      isImage
        ? []
        : runChecks(draft, today, facts, kind === "email" || kind === "ad" ? formatChecks(kind, first, rest) : [], customRules),
    [draft, today, facts, kind, first, rest, customRules, isImage]
  );
  const findings = isImage ? (visual?.findings ?? []) : [...textFindings, ...aiFindings];
  const activeText = isImage ? (visual?.label ?? "") : draft;
  const score = brandScore(isImage ? findings : textFindings);
  const decision = verdict(findings);
  const counts = {
    high: findings.filter((f) => f.severity === "high").length,
    medium: findings.filter((f) => f.severity === "medium").length,
    low: findings.filter((f) => f.severity === "low").length,
  };

  /** Intent is compared against the live draft: fixes must not silently drop the brief. */
  const keyWords = keyMessage.toLowerCase().split(/[^a-z0-9₹%.]+/i).filter((w) => w.length > 3);
  const ctaWords = cta.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  const missingKey = confirmed ? keyWords.filter((w) => !draft.toLowerCase().includes(w)) : [];
  const missingCta = confirmed ? ctaWords.filter((w) => !draft.toLowerCase().includes(w)) : [];

  /** Put a corrected draft back into whichever boxes this format uses. */
  function writeBack(next: string) {
    setOpen(null);
    if (isImage) return;
    if (kind === "single") return setText(next);
    const i = next.indexOf("\n");
    const a = i < 0 ? next : next.slice(0, i);
    const b = i < 0 ? "" : next.slice(i + 1);
    if (kind === "email") { setSubject(a); setBody(b); } else { setHeadline(a); setDesc(b); }
  }

  function loadSample(s: (typeof SAMPLES)[number]) {
    setFormat(s.format);
    setTitle(s.label);
    setText(s.text);
    const i = s.text.indexOf("\n");
    if (s.format === "Email") { setSubject(s.text.slice(0, i)); setBody(s.text.slice(i + 1)); }
    if (s.format === "Ad copy") { setHeadline(s.text.slice(0, i)); setDesc(s.text.slice(i + 1)); }
    setOpen(null);
    setAi({ draft: "", findings: [] });
    setFileNote("");
    const it = SAMPLE_INTENT[s.id];
    if (it) { setGoal(it.goal); setKeyMessage(it.key); setCta(it.cta); setConfirmed(true); }
    onStep("sample");
  }

  async function onFile(file: File) {
    setBusyFile(true);
    setFileNote("");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pages = await readGuideline(file.name, bytes);
      const joined = pages.map((p) => p.text).join("\n\n").trim();
      if (joined.length < 4) throw new Error("No readable text found in that file.");
      writeBack(joined);
      setFileNote(`${file.name} · ${pages.length} page${pages.length === 1 ? "" : "s"} · text loaded into the editor below.`);
      onStep("sample");
    } catch (err) {
      setFileNote(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setBusyFile(false);
    }
  }

  function fixAll() {
    const { text: next } = autoFix(draft, today, facts);
    writeBack(next);
    onStep("fix");
  }

  function applyOne(f: Finding) {
    writeBack(applyFixes(draft, [f]));
    onStep("fix");
  }

  function submit() {
    const item: QueueItem = {
      id: `q-${Date.now()}`,
      title: title.trim() || "Untitled draft",
      format,
      channel,
      content: activeText,
      intent: confirmed ? { goal, keyMessage, cta } : null,
      submittedAt: new Date().toISOString(),
      submitter: `You · ${role}`,
      status: "in_review",
      openFindings: findings.map((f) => f.ruleId),
    };
    onSubmit(item);
    onStep("submit");
  }

  const canSubmit = activeText.trim().length > 0 && confirmed && title.trim().length > 0;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
      {/* Left: brief + editor */}
      <div className="min-w-0 space-y-5">
        {/* Intent card */}
        <section className="rounded-3xl border border-gold/25 bg-gradient-to-br from-gold/[0.08] to-transparent p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <Icon name="decide" className="h-4 w-4" />
              </span>
              <h2 className="font-display text-xl">Intent card</h2>
            </div>
            <span className="text-[11px] text-cream/50">Fixes are checked against this brief</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className={labelCls}>Goal</span>
              <select value={goal} onChange={(e) => setGoal(e.target.value)} className={fieldCls}>
                {GOALS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Key message</span>
              <input
                value={keyMessage}
                onChange={(e) => setKeyMessage(e.target.value)}
                placeholder="e.g. first-payment cashback up to ₹100"
                className={fieldCls}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Call to action</span>
              <input
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="e.g. download PayNest today"
                className={fieldCls}
              />
            </label>
            <label className="flex items-end gap-2 pb-1 text-sm text-cream/80">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="h-4 w-4 accent-[#6ff5c9]"
              />
              This is what the draft is for
            </label>
          </div>
        </section>

        {/* Format + meta */}
        <section className="rounded-3xl border border-white/10 bg-night-2 p-5">
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => { setFormat(f); setOpen(null); }}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  format === f ? "border-mint/60 bg-mint/10 text-mint" : "border-white/10 text-cream/70 hover:border-white/30 hover:text-cream"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="block sm:col-span-1">
              <span className={labelCls}>Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldCls} />
            </label>
            <label className="block">
              <span className={labelCls}>Channel</span>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className={fieldCls}>
                {CHANNELS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Campaign</span>
              <input value={campaign} onChange={(e) => setCampaign(e.target.value)} className={fieldCls} />
            </label>
          </div>

          {/* Samples */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <span className={labelCls}>Sample drafts · known outcomes, checked live</span>
              <span className="text-[10px] text-cream/40">{SAMPLES.length} samples</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SAMPLES.map((s) => {
                const n = runChecks(
                  s.text,
                  today,
                  facts,
                  KIND[s.format] === "email" || KIND[s.format] === "ad"
                    ? formatChecks(KIND[s.format] as "email" | "ad", s.text.slice(0, s.text.indexOf("\n")), s.text.slice(s.text.indexOf("\n") + 1))
                    : []
                ).length;
                return (
                  <button
                    key={s.id}
                    onClick={() => loadSample(s)}
                    className="group rounded-2xl border border-white/10 bg-night p-3.5 text-left transition hover:border-mint/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-cream group-hover:text-mint">{s.label}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${n === 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-gold/10 text-gold"}`}>
                        {n === 0 ? "clean" : `${n} findings`}
                      </span>
                    </div>
                    <div className="mt-1 text-[10.5px] uppercase tracking-wide text-cream/40">{s.format}</div>
                    <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-4 text-cream/55">{s.blurb}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor */}
          {isImage ? (
            <div className="mt-6">
              <VisualCheck onResult={setVisual} palette={palette} />
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {kind === "single" && (
                <textarea
                  value={text}
                  onChange={(e) => { setText(e.target.value); setOpen(null); }}
                  rows={4}
                  placeholder="Paste or write the draft here"
                  className={`${fieldCls} resize-none`}
                />
              )}
              {(kind === "email" || kind === "ad") && (
                <>
                  <div>
                    <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-cream/45">
                      <span>{kind === "email" ? "Subject · first line" : "Headline · first line"}</span>
                      <span className={first.length > (kind === "email" ? LIMITS.emailSubject : LIMITS.adHeadline) ? "text-red-300" : ""}>
                        {first.length}/{kind === "email" ? LIMITS.emailSubject : LIMITS.adHeadline}
                      </span>
                    </div>
                    <input
                      value={first}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\n/g, " ");
                        if (kind === "email") setSubject(v); else setHeadline(v);
                        setOpen(null);
                      }}
                      className={fieldCls}
                    />
                  </div>
                  <textarea
                    value={rest}
                    onChange={(e) => {
                      if (kind === "email") setBody(e.target.value); else setDesc(e.target.value);
                      setOpen(null);
                    }}
                    rows={kind === "email" ? 6 : 3}
                    placeholder={kind === "email" ? "Body" : "Description"}
                    className={`${fieldCls} resize-none`}
                  />
                </>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => fileInput.current?.click()}
                  disabled={busyFile}
                  className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-xs text-cream/80 transition hover:border-mint/60 hover:text-mint disabled:opacity-40"
                >
                  <Icon name="upload" className="h-3.5 w-3.5" />
                  {busyFile ? "Reading…" : "Upload a draft · PDF, DOCX, TXT"}
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                    e.target.value = "";
                  }}
                />
                {fileNote && <span className="text-[11px] text-cream/50">{fileNote}</span>}
              </div>

              {draft.trim() && (
                <div className="rounded-2xl bg-cream p-4 text-ink">
                  <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-ink/50">
                    <span>Annotated draft · click a highlight</span>
                    <span className="font-mono normal-case tracking-normal">{draft.trim().split(/\s+/).length} words</span>
                  </div>
                  <Annotated text={draft} findings={findings} activeId={open} onSelect={(id) => setOpen(id)} />
                </div>
              )}
            </div>
          )}
        </section>

        {/* AI review */}
        <AiReview
          tone="dark"
          draft={draft}
          findings={textFindings}
          onResult={(list) => setAi({ draft, findings: list })}
          disabled={isImage}
        />
      </div>

      {/* Right: score + findings + submit */}
      <div className="min-w-0 space-y-4 xl:sticky xl:top-20">
        <section className="rounded-3xl border border-white/10 bg-night-2 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <ScoreRing score={score} size={64} />
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />{counts.high} high</span>
              <span className="flex items-center gap-1.5 text-cream/60"><span className="h-2 w-2 rounded-full bg-amber-400" />{counts.medium} med</span>
              <span className="flex items-center gap-1.5 text-cream/60"><span className="h-2 w-2 rounded-full bg-emerald-400" />{counts.low} low</span>
            </div>
            <button
              onClick={() => onStep("run")}
              className="flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-xs font-medium text-night transition hover:-translate-y-0.5 hover:bg-white"
            >
              <Icon name="scan" className="h-3.5 w-3.5" />
              Run check
            </button>
          </div>
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-xs ${VERDICT_STYLE[decision.status]}`}>
            <div className="font-medium">Decision: {decision.label}</div>
            <p className="mt-1 leading-4 opacity-80">{decision.detail}</p>
          </div>
          <p className="mt-3 text-[11px] leading-4 text-cream/45">
            Live against rulebook {BRAND.rulebookVersion} and the Claim Ledger. The check runs on every keystroke;
            nothing leaves this browser except the redacted, optional AI review.
          </p>

          {/* Intent status */}
          <div className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-[11.5px]">
            {!confirmed ? (
              <p className="text-cream/45">Confirm the intent card and fixes get checked against the brief.</p>
            ) : (
              <>
                <p className={missingKey.length ? "text-gold" : "text-mint"}>
                  {missingKey.length ? `Key message words missing after edits: ${missingKey.join(", ")}` : "Key message intact after edits"}
                </p>
                <p className={missingCta.length ? "text-gold" : "text-mint"}>
                  {missingCta.length ? `CTA wording not found: ${missingCta.join(", ")}` : "Call to action still present"}
                </p>
              </>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-night-2">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="text-sm font-medium">
              {findings.length === 0 ? "No issues found" : `${findings.length} ${findings.length === 1 ? "finding" : "findings"}`}
            </div>
            <div className="text-xs text-cream/50">{format} · checked just now</div>
          </div>
          <ul className="divide-y divide-white/5">
            {findings.length === 0 && (
              <li className="px-5 py-6 text-sm text-cream/55">
                {isImage && !visual
                  ? "Upload a creative or load a sample to check palette and contrast."
                  : "This draft follows the rulebook. Submit it below."}
              </li>
            )}
            {findings.map((f) => {
              const isOpen = open === f.id;
              return (
                <li key={f.id} className={`relative ${isOpen ? "bg-white/[0.04]" : ""}`}>
                  <span aria-hidden className={`absolute inset-y-0 left-0 w-0.5 ${RAIL[f.severity]} ${isOpen ? "opacity-100" : "opacity-40"}`} />
                  <div className="flex items-center gap-3 px-5 py-3">
                    <button
                      onClick={() => setOpen(isOpen ? null : f.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-cream">
                        {f.id}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[f.severity]}`} title={f.severity} />
                          <span className="truncate text-sm font-medium text-cream">{f.title}</span>
                          <span className="hidden shrink-0 rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9.5px] text-cream/60 ring-1 ring-white/10 sm:inline">
                            {f.ruleId}
                          </span>
                        </span>
                        <span className="block truncate text-xs text-cream/50">
                          {f.end > f.start ? `“${f.quote}”` : f.quote} → {f.fix ?? (f.ruleId === "CLAIM-06" ? "verify with an approver, or remove" : f.end > f.start ? "remove" : "add line")}
                        </span>
                      </span>
                    </button>
                    {!f.manual && !isImage && (
                      <button
                        onClick={() => applyOne(f)}
                        className="shrink-0 rounded-full border border-mint/50 px-3 py-1 text-xs font-medium text-mint transition hover:bg-mint hover:text-night"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                  {isOpen && (
                    <div className="space-y-2 px-5 pb-4 pl-[3.25rem] text-sm">
                      <p className="text-cream/70">{f.why}</p>
                      <p className="text-xs text-cream/45">{f.category} · {f.ruleId} · {f.source}</p>
                      {f.manual && <p className="text-xs text-cream/60">You make this change yourself.</p>}
                      {f.disclaimerToAdd && <p className="text-xs text-cream/60">Adds: {f.disclaimerToAdd}</p>}
                      {f.ai && <p className="text-xs text-gold">AI suggestion, grounded in the draft — a person decides.</p>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {!isImage && findings.some((f) => !f.manual) && (
            <div className="border-t border-white/10 px-5 py-3">
              <button
                onClick={fixAll}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-cream transition hover:bg-mint hover:text-night"
              >
                <Icon name="fix" className="h-3.5 w-3.5" />
                Fix all · deterministic passes
              </button>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-night-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-base">Send for review</h3>
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-cream/50">{channel}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-cream/55">
            “{title.trim() || "Untitled"}” goes to the queue with {findings.length} open{" "}
            {findings.length === 1 ? "finding" : "findings"}
            {counts.high > 0 && <span className="text-red-300">, {counts.high} of them high severity — the reviewer will see this</span>}.
            Nothing is published from here; a person decides.
          </p>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="mt-3 w-full rounded-full bg-mint px-4 py-2 text-sm font-medium text-night shadow-[0_14px_36px_-16px_rgba(111,245,201,0.7)] transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Submit for review
          </button>
          {!confirmed && (
            <p className="mt-2 text-[11px] text-cream/45">Confirm the intent card above to enable submission.</p>
          )}
        </section>
      </div>
    </div>
  );
}
