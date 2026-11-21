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

function unredactProposal(p: unknown, map: Record<string, string>): unknown {
  if (!p || typeof p !== "object") return p;
  const next: Record<string, unknown> = { ...(p as Record<string, unknown>) };
  for (const key of ["quote", "why", "fix"]) {
    if (typeof next[key] === "string") next[key] = unredact(next[key] as string, map);
  }
  return next;
}

export default function AiReview({
  draft, findings, onResult, disabled,
}: {
  draft: string;
  findings: Finding[];
  onResult: (accepted: Finding[]) => void;
  disabled?: boolean;
}) {
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

  return (
    <section className="mt-10 rounded-3xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-2xl">AI tone review, grounded in the rulebook</h3>
            {status === "done" && (
              <span
                className={`rounded-full px-3 py-0.5 text-xs font-medium ${
                  mode === "model" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {mode === "model" ? `live · ${model}` : "scripted demo"}
              </span>
            )}
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            The model never decides anything. It may only propose tone and terminology findings, and only by
            quoting words that already exist in the draft. A gate rejects every proposal that invents a quote,
            cites an unknown rule, overlaps a deterministic finding or adds a number. Severity and wording come
            from the rulebook, never from the model.
          </p>
        </div>
        <button
          onClick={run}
          disabled={disabled || status === "running" || draft.trim().length < 4}
          className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-white hover:bg-brand disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "running" ? "Reviewing…" : "Run AI review"}
        </button>
      </div>

      {disabled && (
        <p className="mt-3 rounded-xl bg-paper p-3 text-sm text-muted">
          Switch to a text format to run the tone reviewer. Image creatives are checked by the visual engine.
        </p>
      )}

      {status === "done" && (
        <div className="mt-5 space-y-4">
          {sent && (
            <p className="rounded-xl bg-paper p-3 text-xs text-muted">
              Sent to the reviewer route: {sent.chars} characters · {sent.summary}. Original personal data is
              put back locally after the reply, so it never leaves this page.
            </p>
          )}
          {note && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{note}</p>}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                Accepted · {accepted.length}
              </div>
              {accepted.length === 0 ? (
                <p className="mt-2 text-sm text-muted">
                  Nothing cleared the gate. The deterministic findings above are the whole review.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {accepted.map((f) => (
                    <li key={f.id} className="rounded-xl bg-white p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[f.severity]}`} />
                        <span className="font-medium">{f.title}</span>
                        <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[11px]">
                          {f.ruleId}
                        </span>
                      </div>
                      <blockquote className="mt-2 border-l-2 border-emerald-300 pl-3 text-muted">
                        “{f.quote}”
                      </blockquote>
                      <p className="mt-2 text-xs text-muted">{f.why}</p>
                      <p className="mt-1 text-xs text-muted">Suggestion only · nobody edits the draft for you.</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-red-800">
                Blocked by the gate · {dropped.length}
              </div>
              {dropped.length === 0 ? (
                <p className="mt-2 text-sm text-muted">
                  Every proposal was grounded. That is unusual for an adversarial draft.
                </p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {dropped.map((d, i) => (
                    <li key={i} className="rounded-xl bg-white p-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                          {REASON[d.reason]}
                        </span>
                        <span className="text-xs text-muted">{d.detail}</span>
                      </div>
                      <p className="mt-1.5 truncate font-mono text-[11px] text-muted">
                        {(d.proposal as AiProposal | null)?.quote ?? JSON.stringify(d.proposal)}
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
              className="text-xs underline decoration-line underline-offset-4 hover:text-brand"
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
