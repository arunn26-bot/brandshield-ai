"use client";

import { useMemo, useRef, useState } from "react";
import { AuditEntry, Decision } from "@/lib/audit";
import { exportBundle, verifyBundle, type BundleVerification } from "@/lib/bundle";
import { buildDashboard } from "@/lib/dashboard";
import { buildDemoHistory } from "@/lib/demo";
import { BRAND, RULE_META } from "@/data/brand";
import type { Fact } from "@/lib/types";

const LABEL: Record<Decision, string> = {
  approved: "Approved",
  approved_override: "Override",
  changes_requested: "Changes",
  rejected: "Rejected",
};

const BADGE: Record<Decision, string> = {
  approved: "bg-emerald-50 text-emerald-700",
  approved_override: "bg-amber-50 text-amber-700",
  changes_requested: "bg-sky-50 text-sky-700",
  rejected: "bg-red-50 text-red-700",
};

const BAR: Record<Decision, string> = {
  approved: "bg-emerald-500/70",
  approved_override: "bg-amber-400/80",
  changes_requested: "bg-sky-400/70",
  rejected: "bg-red-400/70",
};

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="text-2xl font-semibold leading-tight">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export default function Governance({
  trail, facts, today,
}: {
  trail: AuditEntry[];
  facts: Fact[];
  today: Date;
}) {
  const [demo, setDemo] = useState<AuditEntry[] | null>(null);
  const [building, setBuilding] = useState(false);
  const [verdict, setVerdict] = useState<BundleVerification | null>(null);
  const [fileName, setFileName] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const source = useMemo(() => (trail.length ? trail : (demo ?? [])), [trail, demo]);
  const usingDemo = !trail.length && !!demo;
  const dash = useMemo(() => buildDashboard(source, facts, today, 30), [source, facts, today]);
  const maxDay = Math.max(1, ...dash.byDay.map((d) => d.approved + d.overridden + d.changes + d.rejected));

  const pushback = useMemo(() => {
    const map = new Map<string, { count: number; comments: string[] }>();
    for (const e of source) {
      if (e.decision !== "approved_override" && e.decision !== "changes_requested") continue;
      for (const ruleId of new Set(e.openFindings)) {
        const row = map.get(ruleId) ?? { count: 0, comments: [] };
        row.count += 1;
        if (e.comment && row.comments.length < 2 && !row.comments.includes(e.comment)) {
          row.comments.push(e.comment);
        }
        map.set(ruleId, row);
      }
    }
    return [...map.entries()]
      .map(([ruleId, v]) => ({ ruleId, ...v }))
      .sort((a, b) => b.count - a.count || a.ruleId.localeCompare(b.ruleId));
  }, [source]);

  async function loadDemo() {
    setBuilding(true);
    setDemo(await buildDemoHistory(today));
    setBuilding(false);
  }

  function download() {
    const bundle = exportBundle(source, BRAND.rulebookVersion);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brandshield-audit-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoking before the browser has read the blob cancels the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function check(file: File) {
    setFileName(file.name);
    try {
      setVerdict(await verifyBundle(JSON.parse(await file.text())));
    } catch {
      setVerdict({ ok: false, brokenAt: -1, rootHashOk: false, message: "That file is not valid JSON." });
    }
  }

  return (
    <section id="governance" className="scroll-mt-20 bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-5xl md:text-6xl">Governance, not just linting</h2>
            <p className="mt-3 max-w-2xl text-muted">
              Every decision above feeds a dashboard: who approves, how often high findings are overridden, which
              rules fire most, and which approved content has quietly gone stale. The audit bundle can be checked
              by anyone, offline.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadDemo}
              disabled={building || trail.length > 0}
              title={trail.length ? "Clear the live trail to load demo history" : undefined}
              className="rounded-full border border-line bg-white px-4 py-1.5 text-sm hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              {building ? "Building…" : "Load demo history"}
            </button>
            <button
              onClick={download}
              disabled={!source.length}
              className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-white hover:bg-brand disabled:opacity-40"
            >
              Export audit bundle
            </button>
            <button
              onClick={() => input.current?.click()}
              className="rounded-full border border-ink px-4 py-1.5 text-sm font-medium hover:bg-ink hover:text-white"
            >
              Verify a bundle
            </button>
            <input
              ref={input}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) check(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {usingDemo && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            Showing demo history, not saved to this browser. Record a real decision above to replace it.
          </p>
        )}
        {!source.length && (
          <p className="mt-4 rounded-xl border border-line bg-white p-4 text-sm text-muted">
            No decisions yet. Approve or reject a draft above, or load demo history to see the dashboard.
          </p>
        )}

        {verdict && (
          <div
            className={`mt-4 rounded-xl p-3 text-sm ${verdict.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
          >
            <b>{verdict.ok ? "Verified." : "Verification failed."}</b> {verdict.message}
            {fileName && <span className="text-xs"> · {fileName}</span>}
          </div>
        )}

        {source.length > 0 && (
          <>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
              <Stat label="Decisions" value={String(dash.total)} hint="hash-chained entries" />
              <Stat label="Approval rate" value={`${Math.round(dash.approvalRate * 100)}%`} hint="approved + overrides" />
              <Stat label="Override rate" value={`${Math.round(dash.overrideRate * 100)}%`} hint="of approvals" />
              <Stat label="Open at approval" value={dash.avgOpenAtApproval.toFixed(1)} hint="avg findings" />
              <Stat label="Stale approved" value={String(dash.staleCount)} hint="needs re-review" />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">Decisions · last 30 days</div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted">
                    {(["approved", "approved_override", "changes_requested", "rejected"] as Decision[]).map((d) => (
                      <span key={d} className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-sm ${BAR[d]}`} /> {LABEL[d]}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex h-24 items-end gap-[3px]" aria-label="Decisions per day">
                  {dash.byDay.map((d) => {
                    const total = d.approved + d.overridden + d.changes + d.rejected;
                    return (
                      <div key={d.day} className="flex flex-1 flex-col justify-end" title={`${d.day}: ${total} decision(s)`}>
                        {(["approved", "approved_override", "changes_requested", "rejected"] as Decision[]).map((k) => {
                          const n = k === "approved" ? d.approved : k === "approved_override" ? d.overridden : k === "changes_requested" ? d.changes : d.rejected;
                          return n ? (
                            <div
                              key={k}
                              className={`w-full ${BAR[k]}`}
                              style={{ height: `${(n / maxDay) * 88}px` }}
                            />
                          ) : null;
                        })}
                        {total === 0 && <div className="h-px w-full bg-line" />}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-muted">
                  <span>{dash.byDay[0]?.day.slice(5)}</span>
                  <span>today</span>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-line bg-white p-5">
                  <div className="font-medium">Rules that fire most</div>
                  {dash.byRule.length === 0 ? (
                    <p className="mt-2 text-sm text-muted">No findings recorded yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2 text-sm">
                      {dash.byRule.slice(0, 5).map((r) => (
                        <li key={r.key} className="flex items-center gap-2">
                          <span className="w-24 shrink-0 font-mono text-xs">{r.key}</span>
                          <span className="h-2 rounded-full bg-brand/60" style={{ width: `${(r.count / dash.byRule[0].count) * 100}%` }} />
                          <span className="ml-auto text-xs text-muted">{r.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-2xl border border-line bg-white p-5">
                  <div className="font-medium">Decisions by reviewer</div>
                  <ul className="mt-3 space-y-2 text-sm">
                    {dash.byReviewer.map((r) => (
                      <li key={r.key} className="flex justify-between gap-2">
                        <span>{r.key}</span>
                        <span className="text-muted">{r.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">Approved content that no longer holds</div>
                <span className="rounded-full bg-red-50 px-3 py-0.5 text-xs font-medium text-red-700">
                  {dash.staleCount} item{dash.staleCount === 1 ? "" : "s"}
                </span>
              </div>
              {dash.stale.length === 0 ? (
                <p className="mt-2 text-sm text-muted">
                  Every approved item still matches the Claim Ledger and its shelf life.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {dash.stale.slice(0, 6).map((s) => (
                    <li key={s.n} className="flex flex-wrap items-start gap-3 py-3 text-sm">
                      <span className="font-mono text-xs text-muted">#{s.n}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{s.preview}</div>
                        <div className="mt-1 text-xs text-red-700">
                          {s.issues.length ? s.issues.join(" · ") : "Fact expired"}
                          {s.until ? ` · shelf life ended ${s.until}` : ""}
                        </div>
                      </div>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                        {s.reviewer}
                        <span className={`rounded-full px-2 py-0.5 ${BADGE.approved}`}>{LABEL.approved}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium">Rules people push back on</div>
                  <p className="mt-1 max-w-3xl text-sm text-muted">
                    Findings still open when a reviewer overrode or returned a draft. Repeated pushback is evidence
                    the guidance needs rewording, not only the content.
                  </p>
                </div>
                {pushback.length > 0 && (
                  <span className="rounded-full bg-amber-50 px-3 py-0.5 text-xs font-medium text-amber-700">
                    top: {pushback[0].ruleId} · {pushback[0].count}×
                  </span>
                )}
              </div>
              {pushback.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  No overrides or returned drafts in this trail yet. Load demo history to see how pushback clusters.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {pushback.slice(0, 5).map((p) => (
                    <li key={p.ruleId} className="grid gap-2 sm:grid-cols-[10rem_1fr_auto] sm:items-center">
                      <div>
                        <div className="font-mono text-xs">{p.ruleId}</div>
                        <div className="truncate text-[11px] text-muted">
                          {RULE_META[p.ruleId]?.title ?? "Custom rule"}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="h-2 rounded-full bg-line">
                          <div
                            className="h-2 rounded-full bg-amber-400/80"
                            style={{ width: `${(p.count / pushback[0].count) * 100}%` }}
                          />
                        </div>
                        {p.comments[0] && <p className="mt-1 truncate text-xs text-muted">“{p.comments[0]}”</p>}
                      </div>
                      <div className="text-xs tabular-nums text-muted">{p.count}×</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
