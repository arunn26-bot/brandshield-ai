import { FACTS, RULES } from "@/data/brand";
import { Finding, Severity } from "./types";

const WEIGHT: Record<Severity, number> = { high: 3, medium: 2, low: 1 };

function sentences(text: string) {
  const out: { s: string; start: number }[] = [];
  const re = /[^.!?।\n]+[.!?।]*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push({ s: m[0], start: m.index });
  return out;
}

export function runChecks(text: string, today: Date): Finding[] {
  const found: Omit<Finding, "id">[] = [];

  // 1) Pattern rules (tone, terminology, banned claims)
  for (const r of RULES) {
    for (const m of text.matchAll(r.pattern)) {
      if (m.index === undefined || !m[0]) continue;
      found.push({
        ruleId: r.id, category: r.category, severity: r.severity,
        title: r.title, why: r.why, start: m.index, end: m.index + m[0].length,
        quote: m[0], fix: r.fix, source: r.source,
      });
    }
  }

  // 2) Claim Ledger: numeric mismatch and expiry
  for (const { s, start } of sentences(text)) {
    for (const f of FACTS) {
      const t = s.match(f.topicPattern);
      if (!t || t.index === undefined) continue;

      if (new Date(f.validTo + "T23:59:59") < today) {
        found.push({
          ruleId: "CLAIM-05", factId: f.id, category: "Claim", severity: "high",
          title: "Expired offer or fact",
          why: `${f.id} (${f.topic}) was valid only until ${f.validTo}.`,
          start: start + t.index, end: start + t.index + t[0].length,
          quote: t[0], fix: f.approved, source: `Claim Ledger ${f.id} · owner ${f.owner}`,
        });
        continue;
      }
      if (f.value === null) continue;
      const v = s.match(f.valuePattern);
      if (!v || v.index === undefined) continue;
      const num = parseFloat((v[1] ?? v[2]).replace(/,/g, ""));
      if (num === f.value) continue;
      const a = Math.min(t.index, v.index);
      const b = Math.max(t.index + t[0].length, v.index + v[0].length);
      found.push({
        ruleId: "CLAIM-01", factId: f.id, category: "Claim", severity: "high",
        title: "Claim contradicts an approved fact",
        why: `${f.id} says ${f.topic} is ${f.value}${f.valuePattern.source.includes("%") ? "%" : ""}, not ${num}.`,
        start: start + a, end: start + b, quote: s.slice(a, b),
        fix: f.approved, source: `Claim Ledger ${f.id} · owner ${f.owner} · valid to ${f.validTo}`,
        disclaimerToAdd: f.disclaimer,
      });
    }
  }

  // 3) Missing disclaimer when rates/returns are mentioned
  if (/interest|returns?|ब्याज|p\.a\./i.test(text) && !/terms apply/i.test(text)) {
    found.push({
      ruleId: "DISC-01", category: "Disclaimer", severity: "medium",
      title: "Missing disclaimer",
      why: "Any mention of rates or returns must carry the standard disclaimer.",
      start: text.length, end: text.length, quote: "(end of draft)",
      fix: null, source: "Brand Book p.16 §5.6",
      disclaimerToAdd: "*Rate as of Nov 2026. Terms apply.",
    });
  }

  // Overlap handling: keep the more severe finding when two spans collide
  found.sort((a, b) => a.start - b.start || WEIGHT[b.severity] - WEIGHT[a.severity]);
  const kept: Omit<Finding, "id">[] = [];
  for (const f of found) {
    const last = kept[kept.length - 1];
    if (last && f.start < last.end && f.end > f.start) {
      if (WEIGHT[f.severity] > WEIGHT[last.severity]) { kept[kept.length - 1] = f; continue; }
      if (WEIGHT[f.severity] === WEIGHT[last.severity]) {
        // same severity: merge into one finding over the union of both spans
        const base = f.factId ? f : last;
        const other = base === f ? last : f;
        const s0 = Math.min(f.start, last.start), e0 = Math.max(f.end, last.end);
        kept[kept.length - 1] = { ...base, start: s0, end: e0, quote: text.slice(s0, e0),
          why: base.why + " " + other.why };
      }
      continue;
    }
    kept.push(f);
  }
  return kept.map((f, i) => ({ ...f, id: String(i + 1) }));
}

/** Apply selected fixes: each fix replaces only its own span. */
export function applyFixes(text: string, findings: Finding[]): string {
  let out = text;
  const extras: string[] = [];
  for (const f of [...findings].sort((a, b) => b.start - a.start)) {
    if (f.end > f.start) {
      out = out.slice(0, f.start) + (f.fix ?? "") + out.slice(f.end);
    }
    if (f.disclaimerToAdd && !extras.includes(f.disclaimerToAdd)) extras.push(f.disclaimerToAdd);
  }
  out = out.replace(/\s{2,}/g, " ").replace(/\s+([!?.,])/g, "$1").trim();
  return extras.length ? `${out}\n${extras.join("\n")}` : out;
}

export function brandScore(findings: Finding[]): number {
  const penalty = findings.reduce((n, f) => n + { high: 25, medium: 12, low: 5 }[f.severity], 0);
  return Math.max(0, 100 - penalty);
}
