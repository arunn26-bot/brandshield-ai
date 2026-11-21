"use client";

import { useState } from "react";
import { AuditEntry, Decision, TRAIL_KEY, createEntry, sha256 } from "@/lib/audit";
import { runChecks } from "@/lib/engine";
import { BRAND } from "@/data/brand";
import type { Fact } from "@/lib/types";
import {
  QueueItem, STATUS_BADGE, STATUS_LABEL, saveQueue,
} from "@/lib/queue";
import type { Role } from "./AppShell";
import Icon from "@/components/Icon";

const DOT: Record<string, string> = { high: "bg-red-400", medium: "bg-amber-400", low: "bg-emerald-400" };

export default function ReviewQueue({
  queue, setQueue, trail, setTrail, facts, today, role, onStep, onSeedDemo, seeding,
}: {
  queue: QueueItem[];
  setQueue: (q: QueueItem[]) => void;
  trail: AuditEntry[];
  setTrail: (t: AuditEntry[]) => void;
  facts: Fact[];
  today: Date;
  role: Role;
  onStep: (id: string) => void;
  onSeedDemo: () => void;
  seeding: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  const canDecide = role !== "Creator";
  const canOverride = role === "Compliance" || role === "Admin";
  const inReview = queue.filter((q) => q.status === "in_review").length;

  async function decide(item: QueueItem, decision: Decision) {
    const comment = (comments[item.id] ?? "").trim();
    const live = runChecks(item.content, today, facts);
    const high = live.filter((f) => f.severity === "high").length;
    const entry = await createEntry(trail[trail.length - 1], {
      reviewer: `You (${role})`,
      role,
      decision,
      comment,
      format: item.format,
      contentHash: await sha256(item.content),
      contentPreview: item.content.replace(/\n+/g, " ").slice(0, 80),
      content: item.content,
      openFindings: live.map((f) => f.ruleId),
      rulebook: BRAND.rulebookVersion,
    }, new Date());
    const nextTrail = [...trail, entry];
    setTrail(nextTrail);
    try { localStorage.setItem(TRAIL_KEY, JSON.stringify(nextTrail)); } catch {}

    const status = decision === "approved_override" ? "approved" : decision;
    const next = queue.map((q) => (q.id === item.id ? { ...q, status, openFindings: live.map((f) => f.ruleId) } : q));
    setQueue(next);
    saveQueue(next);
    setOpenId(null);
    setNote(
      `${STATUS_LABEL[status]} · entry #${entry.n} sealed on the trail${high && decision.startsWith("approved") ? ` with ${high} high-severity ${high === 1 ? "issue" : "issues"} still open — recorded, not hidden` : ""}.`
    );
    onStep("decide");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-cream/70">{queue.length} total</span>
          <span className="rounded-full border border-sky-200/30 bg-sky-400/10 px-3 py-1 text-sky-300">{inReview} waiting</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-cream/70">
            Deciding as <b className="text-mint">{role}</b>
          </span>
        </div>
        {queue.length === 0 && (
          <button
            onClick={onSeedDemo}
            disabled={seeding}
            className="flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-xs font-medium text-night transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-40"
          >
            <Icon name="inbox" className="h-3.5 w-3.5" />
            {seeding ? "Seeding…" : "Load demo workspace"}
          </button>
        )}
      </div>

      {note && <p className="rounded-2xl border border-mint/25 bg-mint/[0.07] px-4 py-3 text-sm text-mint">{note}</p>}

      {queue.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center">
          <Icon name="inbox" className="mx-auto h-10 w-10 text-cream/25" />
          <p className="mt-4 font-display text-2xl">The queue is empty</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-cream/55">
            Submit a draft from the New draft tab, or load the demo workspace — three submissions with known
            outcomes, clearly labelled as demo data.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {queue.map((item) => {
            const isOpen = openId === item.id;
            const live = isOpen ? runChecks(item.content, today, facts) : [];
            const high = live.filter((f) => f.severity === "high").length;
            const unv = live.filter((f) => f.ruleId === "CLAIM-06").length;
            const comment = comments[item.id] ?? "";
            const commentOk = comment.trim().length >= 10;
            const status = item.status;
            return (
              <li key={item.id} className={`rounded-3xl border transition ${isOpen ? "border-mint/40 bg-night-2" : "border-white/10 bg-night-2/60 hover:border-white/25"}`}>
                <button
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-cream">{item.title}</span>
                      {item.demo && (
                        <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[9.5px] font-medium uppercase tracking-wide text-gold">demo data</span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-cream/50">
                      {item.format} · {item.channel} · {item.submitter} · {new Date(item.submittedAt).toLocaleString()}
                    </div>
                  </div>
                  {item.openFindings.includes("CLAIM-06") && (
                    <span className="rounded-full border border-sky-300/30 bg-sky-400/10 px-2.5 py-1 text-[10.5px] font-medium text-sky-200">Unverifiable claim</span>
                  )}
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
                  <span className="rounded-full bg-white/5 px-2.5 py-1 font-mono text-[10.5px] text-cream/60">
                    {item.openFindings.length} open
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 px-5 py-4">
                    <blockquote className="whitespace-pre-wrap rounded-2xl bg-night p-4 text-sm leading-6 text-cream/85">
                      {item.content}
                    </blockquote>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.openFindings.length === 0 ? (
                        <span className="text-xs text-mint">No open findings at submit</span>
                      ) : (
                        item.openFindings.map((id) => {
                          const f = live.find((x) => x.ruleId === id);
                          return (
                            <span
                              key={id}
                              title={f?.title}
                              className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 font-mono text-[10.5px] text-cream/70 ring-1 ring-white/10"
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${DOT[f?.severity ?? "low"]}`} />
                              {id}
                            </span>
                          );
                        })
                      )}
                    </div>

                    {item.intent && (
                      <p className="mt-3 text-xs text-cream/55">
                        Intent · <span className="text-cream/80">{item.intent.goal}</span> — “{item.intent.keyMessage}” · CTA: {item.intent.cta}
                      </p>
                    )}

                    {status === "in_review" && (
                      <div className="mt-4">
                        <textarea
                          value={comment}
                          onChange={(e) => setComments((c) => ({ ...c, [item.id]: e.target.value }))}
                          rows={2}
                          placeholder="Comment for the trail (required for changes or rejection, 10+ characters)"
                          className="w-full resize-none rounded-2xl border border-white/10 bg-night px-4 py-3 text-sm text-cream outline-none placeholder:text-cream/30 focus:border-mint/60"
                        />
                        {unv > 0 && (
                          <p className="mt-2 rounded-xl bg-sky-400/10 px-3 py-2 text-xs text-sky-200">
                            {unv} unverifiable {unv === 1 ? "claim has" : "claims have"} no approved fact. To approve, write which source supports {unv === 1 ? "it" : "them"} (10+ characters), or request changes.
                          </p>
                        )}
                        {high > 0 && (
                          <p className="mt-2 rounded-xl bg-red-400/10 px-3 py-2 text-xs text-red-300">
                            Re-checked just now: {high} high-severity {high === 1 ? "issue is" : "issues are"} still open in this draft.
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {canDecide ? (
                            <>
                              <button
                                onClick={() => decide(item, high > 0 && canOverride ? "approved_override" : "approved")}
                                disabled={(high > 0 && !canOverride) || (unv > 0 && !commentOk)}
                                className="rounded-full bg-mint px-5 py-2 text-xs font-medium text-night transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                                title={high > 0 && !canOverride ? "High-severity findings need a Compliance or Admin override" : undefined}
                              >
                                {high > 0 ? (canOverride ? "Approve with override" : "Needs override") : "Approve"}
                              </button>
                              <button
                                onClick={() => decide(item, "changes_requested")}
                                disabled={!commentOk}
                                className="rounded-full border border-white/20 px-5 py-2 text-xs font-medium text-cream transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Request changes
                              </button>
                              <button
                                onClick={() => decide(item, "rejected")}
                                disabled={!commentOk}
                                className="rounded-full border border-red-300/40 px-5 py-2 text-xs font-medium text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <p className="flex items-center gap-2 text-xs text-cream/50">
                              <Icon name="users" className="h-3.5 w-3.5" />
                              Switch to Reviewer, Compliance or Admin in the top bar to decide. Creators cannot approve their own queue.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
