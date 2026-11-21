import { runChecks, shelfLife } from "./engine";
import type { Fact } from "./types";

export interface TrailEntry {
  n: number;
  at: string;
  reviewer: string;
  role: string;
  decision: "approved" | "approved_override" | "changes_requested" | "rejected";
  comment: string;
  format: string;
  contentHash: string;
  contentPreview: string;
  content: string;
  openFindings: string[];
  rulebook: string;
  prevHash: string;
  hash: string;
}

export interface DayCount {
  day: string;
  approved: number;
  overridden: number;
  changes: number;
  rejected: number;
}

export interface StaleItem {
  n: number;
  preview: string;
  reviewer: string;
  until: string | null;
  factIds: string[];
  issues: string[];
}

export interface Dashboard {
  total: number;
  approved: number;
  overridden: number;
  changes: number;
  rejected: number;
  approvalRate: number;
  overrideRate: number;
  avgOpenAtApproval: number;
  byFormat: Array<{ key: string; count: number }>;
  byReviewer: Array<{ key: string; count: number }>;
  byRule: Array<{ key: string; count: number }>;
  byDay: DayCount[];
  stale: StaleItem[];
  staleCount: number;
}

function group(entries: TrailEntry[], key: (e: TrailEntry) => string) {
  const map = new Map<string, number>();
  for (const e of entries) map.set(key(e), (map.get(key(e)) ?? 0) + 1);
  return [...map.entries()].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count);
}

export function buildDashboard(
  trail: TrailEntry[],
  facts: Fact[],
  today: Date,
  days = 30
): Dashboard {
  const approvedEntries = trail.filter(
    (e) => e.decision === "approved" || e.decision === "approved_override"
  );
  const overridden = trail.filter((e) => e.decision === "approved_override");
  const changes = trail.filter((e) => e.decision === "changes_requested");
  const rejected = trail.filter((e) => e.decision === "rejected");

  const dayMap = new Map<string, DayCount>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10);
    dayMap.set(d, { day: d, approved: 0, overridden: 0, changes: 0, rejected: 0 });
  }
  for (const e of trail) {
    const day = e.at.slice(0, 10);
    const row = dayMap.get(day);
    if (!row) continue;
    if (e.decision === "approved") row.approved++;
    else if (e.decision === "approved_override") row.overridden++;
    else if (e.decision === "changes_requested") row.changes++;
    else row.rejected++;
  }

  const ruleCounts = new Map<string, number>();
  for (const e of trail) {
    for (const id of new Set(e.openFindings)) {
      ruleCounts.set(id, (ruleCounts.get(id) ?? 0) + 1);
    }
  }

  const stale: StaleItem[] = [];
  for (const e of approvedEntries) {
    const issues = runChecks(e.content, today, facts).filter((f) => f.factId);
    const life = shelfLife(e.content, facts);
    const expired = life.until ? new Date(life.until + "T23:59:59") < today : false;
    if (issues.length || expired) {
      stale.push({
        n: e.n,
        preview: e.contentPreview || e.content.slice(0, 80),
        reviewer: e.reviewer,
        until: life.until,
        factIds: life.ids,
        issues: issues.map((f) => `${f.ruleId}: ${f.title}`),
      });
    }
  }

  return {
    total: trail.length,
    approved: approvedEntries.filter((e) => e.decision === "approved").length,
    overridden: overridden.length,
    changes: changes.length,
    rejected: rejected.length,
    approvalRate: trail.length ? approvedEntries.length / trail.length : 0,
    overrideRate: approvedEntries.length ? overridden.length / approvedEntries.length : 0,
    avgOpenAtApproval: approvedEntries.length
      ? approvedEntries.reduce((n, e) => n + e.openFindings.length, 0) / approvedEntries.length
      : 0,
    byFormat: group(trail, (e) => e.format),
    byReviewer: group(trail, (e) => e.reviewer),
    byRule: [...ruleCounts.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count),
    byDay: [...dayMap.values()],
    stale,
    staleCount: stale.length,
  };
}
