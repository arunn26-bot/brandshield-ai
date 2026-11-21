"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PALETTE } from "@/data/brand";
import { extractProposals, proposalToRule, type RuleProposal } from "@/lib/extract";
import type { Rule } from "@/lib/types";
import type { PaletteColor } from "@/lib/visual";

const SAMPLE = `Never promise guaranteed returns or risk-free savings.
Never say "double your money".
Use "Nest Save" instead of "savings account".
Always include an unsubscribe line.
Keep the email subject under 60 characters.
Primary brand colour: #0F766E
Nest Save earns 6.5% interest p.a. valid until 31 Dec 2026.`;

const KIND: Record<RuleProposal["kind"], string> = {
  prohibited: "Prohibited phrase",
  required: "Required element",
  replacement: "Approved wording",
  limit: "Character limit",
  colour: "Palette colour",
  fact: "Rate or offer",
};

const CONF: Record<RuleProposal["confidence"], string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-line bg-paper text-muted",
};

const KIND_BADGE: Record<RuleProposal["kind"], string> = {
  prohibited: "bg-red-50 text-red-700",
  required: "bg-sky-50 text-sky-700",
  replacement: "bg-emerald-50 text-emerald-700",
  limit: "bg-paper text-muted",
  colour: "bg-purple-50 text-purple-700",
  fact: "bg-amber-50 text-amber-800",
};

export default function RulebookPanel({
  onRules, onPalette,
}: {
  onRules: (rules: Rule[]) => void;
  onPalette: (colors: PaletteColor[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [docName, setDocName] = useState("");
  const [meta, setMeta] = useState("");
  const [proposals, setProposals] = useState<RuleProposal[]>([]);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pasted, setPasted] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);

  const activeRules = useMemo(
    () => proposals.filter((p) => confirmed.has(p.id)).map(proposalToRule).filter((r): r is Rule => !!r),
    [proposals, confirmed]
  );
  const activeColours = useMemo(
    () =>
      proposals
        .filter((p) => p.kind === "colour" && confirmed.has(p.id) && typeof p.meta?.hex === "string")
        .map((p) => ({ name: String(p.meta?.name ?? p.meta?.hex), hex: String(p.meta?.hex) })),
    [proposals, confirmed]
  );
  const checklist = useMemo(
    () => proposals.filter((p) => confirmed.has(p.id) && !p.pattern && p.kind !== "colour"),
    [proposals, confirmed]
  );

  useEffect(() => {
    const seen = new Set(PALETTE.map((p) => p.hex.toUpperCase()));
    const extra = activeColours.filter((c) => !seen.has(c.hex.toUpperCase()));
    onPalette([...PALETTE, ...extra]);
    onRules(activeRules);
  }, [activeRules, activeColours, onPalette, onRules]);

  function load(next: RuleProposal[], name: string, summary: string) {
    setProposals(next);
    setConfirmed(new Set());
    setDocName(name);
    setMeta(summary);
    setError("");
  }

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/rulebook", { method: "POST", body });
      const data = (await response.json()) as {
        docName?: string;
        pages?: number;
        characters?: number;
        proposals?: RuleProposal[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Could not read the guideline.");
      load(
        data.proposals ?? [],
        data.docName ?? file.name,
        `${data.pages ?? 0} page${data.pages === 1 ? "" : "s"} · ${data.characters ?? 0} characters`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read the guideline.");
    } finally {
      setBusy(false);
    }
  }

  function fromText() {
    const text = pasted.trim();
    if (text.length < 10) return;
    load(
      extractProposals([{ page: 1, text }], "Pasted guideline"),
      "Pasted guideline",
      `${text.length} characters`,
    );
    setPasted("");
    setPasteOpen(false);
  }

  function sample() {
    load(extractProposals([{ page: 1, text: SAMPLE }], "Sample brand book"), "Sample brand book", "1 page · 7 rules");
  }

  function toggle(id: string) {
    setConfirmed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const liveCount = activeRules.length + activeColours.length;

  return (
    <section className="mt-10 rounded-3xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl">Turn a guideline into live rules</h3>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Upload the brand book as PDF, DOCX or text. Every rule comes back with a page citation, and nothing
            runs until a person confirms it. Confirmed rules are checked against the draft above, in this
            browser.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => input.current?.click()}
            disabled={busy}
            className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-white hover:bg-brand disabled:opacity-40"
          >
            {busy ? "Reading…" : "Upload guideline"}
          </button>
          <button onClick={sample} className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-ink">
            Try a sample
          </button>
          <button onClick={() => setPasteOpen((v) => !v)} className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-ink">
            Paste text
          </button>
          <input
            ref={input}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {pasteOpen && (
        <div className="mt-4">
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={5}
            placeholder={'Never promise guaranteed returns.\nUse "Nest Save" instead of "savings account".'}
            className="w-full resize-none rounded-2xl border border-line bg-paper p-3 text-sm outline-none focus:border-brand"
          />
          <button
            onClick={fromText}
            disabled={pasted.trim().length < 10}
            className="mt-2 rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-ink disabled:opacity-40"
          >
            Extract rules
          </button>
        </div>
      )}

      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {proposals.length > 0 && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium">{docName}</span>
            <span className="text-muted">{meta}</span>
            <span className="rounded-full bg-paper px-3 py-0.5 text-xs text-muted">
              {proposals.length} proposals
            </span>
            <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${liveCount ? "bg-emerald-50 text-emerald-700" : "bg-paper text-muted"}`}>
              {liveCount} live · {checklist.length} checklist
            </span>
          </div>

          <ul className="mt-4 space-y-2">
            {proposals.map((p) => {
              const on = confirmed.has(p.id);
              return (
                <li
                  key={p.id}
                  className={`rounded-2xl border p-4 text-sm ${on ? "border-brand/40 bg-brand/[0.04]" : "border-line"}`}
                >
                  <div className="flex flex-wrap items-start gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${KIND_BADGE[p.kind]}`}>
                      {KIND[p.kind]}
                    </span>
                    <span className="font-medium">{p.title}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${CONF[p.confidence]}`}>
                      {p.confidence} confidence
                    </span>
                    <span className="ml-auto text-xs text-muted">{p.source}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted">{p.detail}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => toggle(p.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        on ? "bg-ink text-white hover:bg-brand" : "border border-ink hover:bg-ink hover:text-white"
                      }`}
                    >
                      {on ? "Confirmed · undo" : p.pattern ? "Confirm and activate" : p.kind === "colour" ? "Add to palette" : "Add to checklist"}
                    </button>
                    <span className="text-xs text-muted">“{p.quote}”</span>
                  </div>
                </li>
              );
            })}
          </ul>

          {checklist.length > 0 && (
            <div className="mt-4 rounded-2xl bg-paper p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted">
                Human checklist · the pattern rules cannot check these
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {checklist.map((p) => (
                  <li key={p.id}>• {p.title} <span className="text-muted">({p.source})</span></li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
