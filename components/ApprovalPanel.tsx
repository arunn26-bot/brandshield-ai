"use client";

import { useEffect, useState } from "react";
import { AuditEntry, Decision, TRAIL_KEY, createEntry, sha256, verifyTrail } from "@/lib/audit";
import { Finding } from "@/lib/types";
import { BRAND } from "@/data/brand";

const REVIEWERS = [
  { name: "Ananya", role: "Compliance Lead" },
  { name: "Rohan", role: "Brand Reviewer" },
];

const LABEL: Record<Decision, string> = {
  approved: "Approved",
  approved_override: "Approved with override",
  changes_requested: "Changes requested",
  rejected: "Rejected",
};

const BADGE: Record<Decision, string> = {
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  approved_override: "bg-amber-50 text-amber-700 border-amber-200",
  changes_requested: "bg-sky-50 text-sky-700 border-sky-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function ApprovalPanel({
  text, findings, format, trail, setTrail,
}: {
  text: string; findings: Finding[]; format: string;
  trail: AuditEntry[]; setTrail: (t: AuditEntry[]) => void;
}) {
  const [who, setWho] = useState(0);
  const [comment, setComment] = useState("");
  const [verdict, setVerdict] = useState<string | null>(null);
  const [hash, setHash] = useState("");

  const reviewer = REVIEWERS[who];
  const high = findings.filter((f) => f.severity === "high");
  const isCompliance = reviewer.role === "Compliance Lead";
  const commentOk = comment.trim().length >= 10;

  useEffect(() => {
    sha256(text).then(setHash);
  }, [text]);

  function save(next: AuditEntry[]) {
    setTrail(next);
    setVerdict(null);
    try { localStorage.setItem(TRAIL_KEY, JSON.stringify(next)); } catch {}
  }

  async function decide(decision: Decision) {
    const entry = await createEntry(trail[trail.length - 1], {
      reviewer: reviewer.name, role: reviewer.role, decision,
      comment: comment.trim(), format, contentHash: hash,
      contentPreview: text.slice(0, 80), content: text, openFindings: findings.map((f) => f.ruleId),
      rulebook: BRAND.rulebookVersion,
    }, new Date());
    save([...trail, entry]);
    setComment("");
  }

  async function verify() {
    const bad = await verifyTrail(trail);
    setVerdict(
      bad === -1
        ? `Trail verified: all ${trail.length} entries are intact and linked.`
        : `Entry #${trail[bad].n} does not match its hash. The trail was altered after it was written.`
    );
  }

  function tamper() {
    if (!trail.length) return;
    const copy = trail.map((e, i) => (i === 0 ? { ...e, comment: e.comment + " (edited)" } : e));
    save(copy);
  }

  const canApprove = text.trim().length > 0 && (high.length === 0 || (isCompliance && commentOk));
  const last = trail[trail.length - 1];
  const stale = last && last.contentHash !== hash;

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-2">
      {/* Decision */}
      <div className="rounded-3xl border border-line bg-card p-6">
        <h3 className="font-display text-2xl">Human decision</h3>
        <p className="mt-1 text-sm text-muted">
          Nothing is published automatically. A reviewer records the final call.
        </p>

        <div className="mt-5 flex gap-2">
          {REVIEWERS.map((r, i) => (
            <button
              key={r.name}
              onClick={() => setWho(i)}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                who === i ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
              }`}
            >
              {r.name} · {r.role}
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Comment (required for overrides, 10+ characters)"
          className="mt-4 w-full resize-none rounded-2xl border border-line bg-paper p-3 text-sm outline-none focus:border-brand"
        />

        {high.length > 0 && (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {high.length} high-severity {high.length === 1 ? "issue is" : "issues are"} still open.
            Fix them, or a Compliance Lead can approve with a written override.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            disabled={!canApprove}
            onClick={() => decide(high.length ? "approved_override" : "approved")}
            className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {high.length ? "Approve with override" : "Approve"}
          </button>
          <button
            disabled={!text.trim() || !commentOk}
            onClick={() => decide("changes_requested")}
            className="rounded-full border border-ink px-5 py-2 text-sm font-medium hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Request changes
          </button>
          <button
            disabled={!text.trim() || !commentOk}
            onClick={() => decide("rejected")}
            className="rounded-full border border-red-300 px-5 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reject
          </button>
        </div>

        {last && (
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className={`rounded-full border px-3 py-1 ${BADGE[last.decision]}`}>
              {LABEL[last.decision]}
            </span>
            <span className="text-muted">entry #{last.n}</span>
            {stale && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                Draft changed since this decision
              </span>
            )}
          </div>
        )}
      </div>

      {/* Audit trail */}
      <div className="rounded-3xl border border-line bg-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl">Approval trail</h3>
            <p className="mt-1 text-sm text-muted">
              Each entry stores the draft&apos;s SHA-256, the rulebook version and the open issues,
              and is chained to the entry before it.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={verify} disabled={!trail.length}
            className="rounded-full border border-ink px-4 py-1.5 text-sm hover:bg-ink hover:text-white disabled:opacity-40">
            Verify trail
          </button>
          <button onClick={tamper} disabled={!trail.length}
            className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-ink disabled:opacity-40">
            Simulate tampering
          </button>
          <button onClick={() => save([])} disabled={!trail.length}
            className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-ink disabled:opacity-40">
            Clear
          </button>
        </div>

        {verdict && <p className="mt-3 rounded-xl bg-paper p-3 text-sm">{verdict}</p>}

        {trail.length === 0 ? (
          <p className="mt-5 text-sm text-muted">No decisions yet. Record one on the left.</p>
        ) : (
          <ol className="mt-5 space-y-3">
            {[...trail].reverse().map((e) => (
              <li key={e.n} className="rounded-2xl border border-line p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">#{e.n}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${BADGE[e.decision]}`}>
                    {LABEL[e.decision]}
                  </span>
                  <span className="text-muted">
                    {e.reviewer} · {e.role} · {new Date(e.at).toLocaleString()}
                  </span>
                </div>
                {e.comment && <div className="mt-2">&ldquo;{e.comment}&rdquo;</div>}
                <div className="mt-2 text-xs text-muted">
                  {e.format} · rulebook {e.rulebook} · open: {e.openFindings.length ? e.openFindings.join(", ") : "none"}
                </div>
                <div className="mt-1 font-mono text-xs text-muted">
                  content {e.contentHash.slice(0, 16)}… · entry {e.hash.slice(0, 16)}…
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
