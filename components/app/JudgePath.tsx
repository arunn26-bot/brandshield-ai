"use client";

import Icon from "@/components/Icon";

export interface JudgeStep {
  id: string;
  label: string;
  hint: string;
  /** App view to open, or null when the step lives on the marketing page. */
  view: string | null;
  href?: string;
}

export const JUDGE_STEPS: JudgeStep[] = [
  { id: "sample", label: "Open a sample draft", hint: "New draft → sample gallery, seven drafts with known outcomes and a pre-filled intent card", view: "new" },
  { id: "run", label: "Read a cited finding", hint: "Every finding shows the exact quote, the rule and its source", view: "new" },
  { id: "fix", label: "Apply a deterministic fix", hint: "Only the offending words change; the message survives", view: "new" },
  { id: "submit", label: "Submit it for review", hint: "Lands in the queue with its open findings attached", view: "queue" },
  { id: "decide", label: "Switch role and decide", hint: "Approve, request changes or reject — recorded with your role", view: "queue" },
  { id: "trail", label: "Verify the hash chain", hint: "Simulate tampering with an old entry and verification fails", view: "trail" },
  { id: "lab", label: "Run the adversarial suite", hint: "14 attacks and traps with fixed expected outcomes", view: null, href: "/app?view=lab" },
];

export default function JudgePath({
  done, onGo, onClose,
}: {
  done: Set<string>;
  onGo: (step: JudgeStep) => void;
  onClose: () => void;
}) {
  const total = JUDGE_STEPS.length;
  const left = total - done.size;

  return (
    <aside
      aria-label="Judge path"
      className="fixed bottom-4 right-4 z-50 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/10 bg-night-2/95 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)] ring-1 ring-white/5 backdrop-blur"
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint/10 text-mint">
          <Icon name="judge" className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">Judge path</div>
          <div className="text-[11px] text-cream/50">
            {left === 0 ? "Every step walked." : `${done.size} of ${total} walked`}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Hide judge path"
          className="rounded-full p-1.5 text-cream/40 transition hover:bg-white/10 hover:text-cream"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 3 10 10M13 3 3 13" /></svg>
        </button>
      </div>

      <div className="h-1 bg-white/5">
        <div className="h-full bg-mint transition-[width] duration-500" style={{ width: `${(done.size / total) * 100}%` }} />
      </div>

      <ol className="max-h-72 overflow-y-auto px-2 py-2">
        {JUDGE_STEPS.map((step, i) => {
          const isDone = done.has(step.id);
          return (
            <li key={step.id}>
              <button
                onClick={() => onGo(step)}
                className="flex w-full items-start gap-3 rounded-2xl px-2.5 py-2 text-left transition hover:bg-white/5"
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                    isDone ? "bg-mint text-night" : "bg-white/10 text-cream/60"
                  }`}
                >
                  {isDone ? (
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="m2 6.5 2.5 2.5L10 3.5" /></svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[13px] leading-5 ${isDone ? "text-cream/55 line-through decoration-cream/30" : "text-cream"}`}>
                    {step.label}
                  </span>
                  <span className="block text-[11px] leading-4 text-cream/45">{step.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
