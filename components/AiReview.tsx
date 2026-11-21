"use client";

import { useState } from "react";
import { redact, redactionSummary, unredact } from "@/lib/redact";
import { groundProposals, simulatedProposals } from "@/lib/grounding";
import type { AiProposal, DroppedProposal, Finding } from "@/lib/types";

type Status = "idle" | "running" | "done";
type Mode = "model" | "simulated";

const REASON: Record<DroppedProposal["reason"], string> = {
  bad_shape: "malformed response",
  unknown_rule: "rule not in the rulebook",
  quote_not_found: "quote is not in the draft",
  quote_too_short: "quote too short or too long",
  duplicate: "already covered by a rule",
  invented_number: "invented a number",
  disallowed_category: "category not open to AI",
};

const DOT: Record<string, string> = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-emerald-500" };

const GATE = [
  { t: "Real quotes only", d: "Every quote must already exist in your draft." },
  { t: "Tone only", d: "Claims and numbers stay with the rule checks." },
  { t: "Rulebook decides", d: "Severity and wording never come from the model." },
];

function unredactProposal(p: unknown, map: Record<string, string>): unknown {
  if (!p || typeof p !== "object") return p;
  const next: Record<string, unknown> = { ...(p as Record<string, unknown>) };
  for (const key of ["quote", "why", "fix"]) {
    if (typeof next[key] === "string") next[key] = unredact(next[key] as string, map);
  }
  return next;
}

export default function AiReview({
  draft, findings, onResult, disabled, tone = "light",
}: {
  draft: string;
  findings: Finding[];
  onResult: (accepted: Finding[]) => void;
  disabled?: boolean;
  /** "dark" matches the workspace; "light" matches the marketing site. */
  tone?: "light" | "dark";
}) {
  const d = tone === "dark";
  const [status, setStatus] = useState<Status>("idle");
  const [mode, setMode] = useState<Mode>("simulated");
  const [model, setModel] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<{ summary: string; chars: number } | null>(null);
  const [accepted, setAccepted] = useState<Finding[]>([]);
  const [dropped, setDropped] = useState<DroppedProposal[]>([]);
  const [raw, setRaw] = useState<AiProposal[]>([]);
  const [showRaw, setShowRaw] = useState(false);

  async function run() {
    setStatus("running");
    setNote("");
    setShowRaw(false);

    const scrubbed = redact(draft);
    setSent({ summary: redactionSummary(scrubbed.counts), chars: scrubbed.text.length });

    let proposals: unknown = [];
    let usedMode: Mode = "simulated";
    let usedModel = "";

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: scrubbed.text }),
      });
      const data = (await response.json()) as {
        mode?: string;
        model?: string;
        proposals?: unknown;
        error?: string;
      };
      if (response.ok && data.mode === "model") {
        usedMode = "model";
        usedModel = data.model ?? "model";
        proposals = Array.isArray(data.proposals)
          ? data.proposals.map((p) => unredactProposal(p, scrubbed.map))
          : [];
      } else if (response.ok && data.mode === "simulated") {
        proposals = simulatedProposals(draft, findings);
        setNote("No model key on this deployment. The scripted response below deliberately includes bad proposals so the gate can be watched working.");
      } else {
        proposals = simulatedProposals(draft, findings);
        setNote(`Live model unavailable (${data.error ?? response.status}). Ran the scripted demo instead.`);
      }
    } catch {
      proposals = simulatedProposals(draft, findings);
      setNote("Could not reach the review route. Ran the scripted demo instead.");
    }

    const grounded = groundProposals(draft, proposals, findings);
    setMode(usedMode);
    setModel(usedModel);
    setRaw(Array.isArray(proposals) ? (proposals as AiProposal[]) : []);
    setAccepted(grounded.accepted);
    setDropped(grounded.dropped);
    onResult(grounded.accepted);
    setStatus("done");
  }

  const muted = d ? "text-cream/60" : "text-muted";
  const faint = d ? "text-cream/45" : "text-muted";
  const tile = d ? "bg-night border border-white/10" : "bg-paper border border-line";
  const inner = d ? "bg-night" : "bg-white";

  const chip =
    status === "done"
      ? mode === "model"
        ? d ? "bg-mint/15 text-mint" : "bg-emerald-50 text-emerald-700"
        : d ? "bg-gold/15 text-gold" : "bg-amber-50 text-amber-700"
      : d ? "bg-white/10 text-cream/70" : "bg-paper text-muted";
  const chipText =
    status === "running" ? "Reviewing…"
    : status === "done" ? (mode === "model" ? `live · ${model}` : "scripted demo")
    : "Optional · not run yet";

  return (
    <section
      className={`mt-6 rounded-3xl p-5 md:p-6 ${
        d ? "border border-white/10 bg-night-2 text-cream" : "mt-10 border border-line bg-white text-ink"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${d ? "bg-mint/15 text-mint" : "bg-brand/10 text-brand"}`}>
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M10 1l2.2 6.3L19 10l-6.8 2.7L10 19l-2.2-6.3L1 10l6.8-2.7z" />
              </svg>
            </span>
            <h3 className="font-display text-xl md:text-2xl">AI tone review</h3>
            <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${chip}`}>{chipText}</span>
          </div>
          <p className={`mt-2 max-w-xl text-sm ${muted}`}>
            An optional second opinion on tone and wording. It only suggests, and every suggestion must pass a gate first.
          </p>
        </div>
        <button
          onClick={run}
          disabled={disabled || status === "running" || draft.trim().length < 4}
          className={`rounded-full px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
            d ? "bg-mint text-night hover:-translate-y-0.5 hover:bg-white" : "bg-ink text-white hover:bg-brand"
          }`}
        >
          {status === "running" ? "Reviewing…" : status === "done" ? "Run again" : "Run AI review"}
        </button>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {GATE.map((g) => (
          <li key={g.t} className={`rounded-2xl p-3 ${tile}`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <svg viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 ${d ? "text-mint" : "text-brand"}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m4 10 4 4 8-8" />
              </svg>
              {g.t}
            </div>
            <p className={`mt-1 text-xs leading-5 ${faint}`}>{g.d}</p>
          </li>
        ))}
      </ul>

      {disabled && (
        <p className={`mt-3 rounded-xl p-3 text-sm ${d ? "bg-night text-cream/60" : "bg-paper text-muted"}`}>
          Switch to a text format to run the tone reviewer. Image creatives are checked by the visual engine.
        </p>
      )}

      {status === "done" && (
        <div className="mt-5 space-y-4">
          {sent && (
            <p className={`rounded-xl p-3 text-xs ${d ? "bg-night text-cream/60" : "bg-paper text-muted"}`}>
              Sent to the reviewer route: {sent.chars} characters · {sent.summary}. Original personal data is
              put back locally after the reply, so it never leaves this page.
            </p>
          )}
          {note && (
            <p className={`rounded-xl p-3 text-xs ${d ? "bg-gold/10 text-gold" : "bg-amber-50 text-amber-800"}`}>{note}</p>
          )}

          <div className="grid gap-4">
            <div className={`rounded-2xl border p-4 ${d ? "border-mint/25 bg-mint/5" : "border-emerald-200 bg-emerald-50/50"}`}>
              <div className={`text-xs font-medium uppercase tracking-wide ${d ? "text-mint" : "text-emerald-800"}`}>
                Accepted · {accepted.length}
              </div>
              {accepted.length === 0 ? (
                <p className={`mt-2 text-sm ${muted}`}>
                  Nothing cleared the gate. The deterministic findings above are the whole review.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {accepted.map((f) => (
                    <li key={f.id} className={`rounded-xl p-3 text-sm ${inner}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[f.severity]}`} />
                        <span className="font-medium">{f.title}</span>
                        <span className={`ml-auto rounded-full border px-2 py-0.5 font-mono text-[11px] ${d ? "border-white/15" : "border-line"}`}>
                          {f.ruleId}
                        </span>
                      </div>
                      <blockquote className={`mt-2 border-l-2 pl-3 ${d ? "border-mint/50" : "border-emerald-300"} ${muted}`}>
                        “{f.quote}”
                      </blockquote>
                      <p className={`mt-2 text-xs ${muted}`}>{f.why}</p>
                      <p className={`mt-1 text-xs ${faint}`}>Suggestion only · nobody edits the draft for you.</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={`rounded-2xl border p-4 ${d ? "border-coral/30 bg-coral/5" : "border-red-200 bg-red-50/40"}`}>
              <div className={`text-xs font-medium uppercase tracking-wide ${d ? "text-coral" : "text-red-800"}`}>
                Blocked by the gate · {dropped.length}
              </div>
              {dropped.length === 0 ? (
                <p className={`mt-2 text-sm ${muted}`}>Every proposal was grounded. Nothing needed blocking.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {dropped.map((x, i) => (
                    <li key={i} className={`rounded-xl p-3 ${inner}`}>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${d ? "bg-coral/15 text-coral" : "bg-red-100 text-red-700"}`}>
                        {REASON[x.reason]}
                      </span>
                      <p className={`mt-1.5 text-xs ${muted}`}>{x.detail}</p>
                      <p className={`mt-1.5 truncate font-mono text-[11px] ${faint}`}>
                        {(x.proposal as AiProposal | null)?.quote ?? JSON.stringify(x.proposal)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <button
              onClick={() => setShowRaw((v) => !v)}
              className={`text-xs underline underline-offset-4 ${d ? "decoration-white/30 hover:text-mint" : "decoration-line hover:text-brand"}`}
            >
              {showRaw ? "Hide" : "Show"} what the model returned ({raw.length})
            </button>
            {showRaw && (
              <pre className="mt-2 max-h-64 overflow-auto rounded-2xl bg-night p-4 text-[11px] leading-5 text-mint/90">
                {JSON.stringify(raw, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
