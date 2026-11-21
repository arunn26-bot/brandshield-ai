import { FACTS, RULES } from "@/data/brand";
import type { Fact, Finding, Rule, Severity } from "./types";
import {
  isAttributed,
  isClosure,
  isNegated,
  normalizeDraft,
  parseAmount,
  toOriginal,
} from "./normalize";

const WEIGHT: Record<Severity, number> = { high: 3, medium: 2, low: 1 };

/** A global regex loses its capture groups under String.match, so clone without g. */
function firstMatch(re: RegExp | null, text: string): RegExpMatchArray | null {
  if (!re) return null;
  return new RegExp(re.source, re.flags.replace("g", "")).exec(text);
}

function sentences(text: string) {
  // Protect decimals ("6.5") and "p.a." from being treated as sentence ends.
  const safe = text
    .replace(/(\d)\.(?=\d)/g, "$1\u00b7")
    .replace(/\bp\.a\./gi, (m) => m.replace(/\./g, "\u00b7"))
    .replace(/\b(?:rs|mr|mrs|ms|dr|no)\./gi, (m) => m.replace(/\./g, "\u00b7"));
  const out: { s: string; start: number }[] = [];
  const re = /[^.!?।\n]+[.!?।]*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(safe))) out.push({ s: text.slice(m.index, m.index + m[0].length), start: m.index });
  return out;
}

/**
 * Numeric performance or popularity claims. When no approved fact covers them
 * they are never approved silently: they are marked Unverifiable (CLAIM-06)
 * and a named reviewer has to verify or remove them.
 */
const UNVERIFIED_CLAIMS: RegExp[] = [
  /\b\d+(?:\.\d+)?\s?(?:%|percent)\s+(?:faster|quicker|better|cheaper|more|less|lower|higher|bigger|smarter)\b/gi,
  /\b\d+(?:\.\d+)?\s?x\s+(?:faster|quicker|more|better|cheaper)\b/gi,
  /(?:\d[\d,]{2,}|\d+(?:\.\d+)?\s?(?:k|lakh|lac|crore|cr|million|mn))\+?\s+(?:happy\s+|active\s+|daily\s+)?(?:customers?|users?|merchants?|downloads?|businesses|companies|families)\b/gi,
];

const INVISIBLE_NEAR_BRAND =
  /[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;

/**
 * Runs every deterministic check on a draft.
 * `extras` are format-specific findings whose offsets already refer to `text`.
 */
export function runChecks(
  text: string,
  today: Date,
  facts: Fact[] = FACTS,
  extras: Omit<Finding, "id">[] = [],
  customRules: Rule[] = []
): Finding[] {
  const { text: clean, map } = normalizeDraft(text);
  const found: Omit<Finding, "id">[] = [];
  const rules = customRules.length ? [...RULES, ...customRules] : RULES;

  const addClean = (f: Omit<Finding, "id">) => {
    const start = toOriginal(map, f.start);
    const end = toOriginal(map, f.end);
    found.push({ ...f, start, end, quote: text.slice(start, end) || f.quote });
  };

  // 1) Pattern rules. HOMO-01 must run on the original text, not the folded text.
  for (const r of rules) {
    const onOriginal = r.id === "HOMO-01";
    const haystack = onOriginal ? text : clean;
    r.pattern.lastIndex = 0;
    for (const m of haystack.matchAll(r.pattern)) {
      if (m.index === undefined || !m[0]) continue;
      if (r.allow) {
        r.pattern.lastIndex = 0;
        if (!r.allow(haystack, m)) continue;
      }
      const start = m.index;
      const end = start + m[0].length;
      const base = {
        ruleId: r.id,
        category: r.category,
        severity: r.severity,
        title: r.title,
        why: r.why,
        start,
        end,
        quote: haystack.slice(start, end),
        fix: r.fixFor ? r.fixFor(haystack, m) : r.fix,
        source: r.source,
        manual: r.id.startsWith("PII-") || r.id === "HOMO-02",
      };
      if (onOriginal) found.push(base);
      else addClean(base);
    }
  }

  // 2) Invisible characters used to fake the product name.
  for (const m of text.matchAll(INVISIBLE_NEAR_BRAND)) {
    if (m.index === undefined) continue;
    const around = (text.slice(Math.max(0, m.index - 10), m.index) +
      text.slice(m.index + m[0].length, Math.min(text.length, m.index + 11)))
      .replace(INVISIBLE_NEAR_BRAND, "");
    if (!/pay\s?nest/i.test(around)) continue;
    found.push({
      ruleId: "HOMO-02",
      category: "Terminology",
      severity: "high",
      title: "Invisible characters inside the brand name",
      why: "An invisible character splits the brand name. This is used to evade filters and impersonate PayNest.",
      start: m.index,
      end: m.index + m[0].length,
      quote: "(invisible character)",
      fix: null,
      source: "Brand Book p.9 §4.1 · Impersonation",
      manual: true,
    });
  }

  // 3) Claim Ledger: numeric mismatch and expiry.
  for (const { s, start } of sentences(clean)) {
    for (const f of facts) {
      const t = firstMatch(f.topicPattern, s);
      if (!t || t.index === undefined) continue;
      // "100% safe" is a promise, not a rate; do not compare it to the ledger rate.
      const amountSource =
        f.unit === "%"
          ? s.replace(/100\s?%\s?(?:safe|secure|guaranteed|free)/gi, (m) => " ".repeat(m.length))
          : s;
      const amountMatch = firstMatch(f.valuePattern, amountSource);
      const amount = parseAmount(amountMatch);

      // A numeric fact is only "used" when its number is actually claimed.
      if (f.value !== null && amount === null) continue;
      if (isClosure(clean, start + t.index, start + t.index + t[0].length)) continue;

      const expired = new Date(f.validTo + "T23:59:59") < today;
      if (expired) {
        const b = amountMatch && amountMatch.index !== undefined
          ? Math.max(t.index + t[0].length, amountMatch.index + amountMatch[0].length)
          : t.index + t[0].length;
        const from = start + Math.min(t.index, amountMatch?.index ?? t.index);
        const to = start + b;
        addClean({
          ruleId: "CLAIM-05",
          factId: f.id,
          category: "Claim",
          severity: "high",
          title: "Expired offer or fact",
          why: `${f.id} (${f.topic}) was valid only until ${f.validTo}.`,
          start: from,
          end: to,
          quote: clean.slice(from, to),
          fix: f.approved,
          source: `Claim Ledger ${f.id} · owner ${f.owner}`,
        });
        continue;
      }
      if (f.value === null || amount === null) continue;
      if (amount === f.value) continue;
      const a = Math.min(t.index, amountMatch!.index ?? t.index);
      const b = Math.max(t.index + t[0].length, (amountMatch!.index ?? 0) + amountMatch![0].length);
      // "guaranteed 9%..." is one promise. Including the lead word in the span
      // stops a later pass from leaving "guaranteed 6.5% interest" behind.
      let from = start + a;
      const lead = /\b(?:guaranteed|guarantees?)\s+$/i.exec(clean.slice(0, from));
      if (lead) from -= lead[0].length;
      addClean({
        ruleId: "CLAIM-01",
        factId: f.id,
        category: "Claim",
        severity: "high",
        title: "Claim contradicts an approved fact",
        why: `${f.id} says ${f.topic} is ${f.value}${f.unit === "%" ? "%" : ""}, not ${amount}.`,
        start: from,
        end: start + b,
        quote: clean.slice(from, start + b),
        fix: f.approved,
        source: `Claim Ledger ${f.id} · owner ${f.owner} · valid to ${f.validTo}`,
        disclaimerToAdd: f.disclaimer,
      });
    }
  }

  // 3b) Numeric claims that no approved fact covers are Unverifiable, never silently approved.
  for (const { s, start } of sentences(clean)) {
    const judged: Array<[number, number]> = [];
    for (const f of facts) {
      if (f.value === null || !firstMatch(f.topicPattern, s)) continue;
      const vm = firstMatch(f.valuePattern, s);
      if (vm && vm.index !== undefined) judged.push([vm.index, vm.index + vm[0].length]);
    }
    for (const re of UNVERIFIED_CLAIMS) {
      for (const m of s.matchAll(re)) {
        if (m.index === undefined) continue;
        const a = m.index;
        const b = a + m[0].length;
        if (judged.some(([x, y]) => a < y && b > x)) continue; // the ledger already judged this number
        if (isNegated(clean, start + a, start + b) || isAttributed(clean, start + a)) continue;
        addClean({
          ruleId: "CLAIM-06",
          category: "Claim",
          severity: "medium",
          title: "Unverifiable claim",
          why: "No approved fact in the Claim Ledger supports this number. It is not approved silently: a named reviewer must verify it or remove it.",
          start: start + a,
          end: start + b,
          quote: clean.slice(start + a, start + b),
          fix: null,
          manual: true,
          source: "Claim Ledger \u00b7 no matching approved fact",
        });
      }
    }
  }

  // 4) Missing disclaimer when a rate or return is actually claimed.
  const rateText = clean
    .replace(/100\s?%\s?(?:safe|secure|free|guaranteed|cashback)/gi, " ");
  const rate = /(?<amt>\d+(?:\.\d+)?)\s*(?:%|percent|p\.a\.)/i.exec(rateText);
  if (
    rate &&
    rate.index !== undefined &&
    /\b(?:interest|returns?|savings?|rate|yield)\b|nest\s+save|p\.a\./i.test(
      rateText.slice(Math.max(0, rate.index - 40), rate.index + rate[0].length + 40)
    ) &&
    !isNegated(rateText, rate.index, rate.index + rate[0].length) &&
    !/terms\s+apply|t&c|terms\s+and\s+conditions/i.test(clean)
  ) {
    found.push({
      ruleId: "DISC-01",
      category: "Disclaimer",
      severity: "medium",
      title: "Missing disclaimer",
      why: "Any mention of rates or returns must carry the standard disclaimer.",
      start: text.length,
      end: text.length,
      quote: "(end of draft)",
      fix: null,
      source: "Brand Book p.16 §5.6",
      disclaimerToAdd: "*Rate as of Nov 2026. Terms apply.",
    });
  }

  // 5) Deduplicate identical spans only; never drop a different rule's evidence.
  const seen = new Set<string>();
  const unique = found.filter((f) => {
    const key = `${f.ruleId}|${f.start}|${f.end}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const all = [...unique, ...extras].sort(
    (a, b) => a.start - b.start || WEIGHT[b.severity] - WEIGHT[a.severity]
  );
  return all.map((f, i) => ({ ...f, id: String(i + 1) }));
}

function fixPriority(f: Finding): number {
  // A ledger-backed fix is more specific than a generic phrase rule.
  return (f.factId ? 100 : 0) + WEIGHT[f.severity] * 10 + (f.end - f.start ? 1 : 0);
}

/** Apply selected fixes without letting overlapping spans corrupt the draft. */
export function applyFixes(text: string, findings: Finding[]): string {
  const extras: string[] = [];
  const candidates = findings
    .filter((f) => !f.manual && (f.end > f.start || f.disclaimerToAdd))
    .sort((a, b) => fixPriority(b) - fixPriority(a) || a.start - b.start);

  const accepted: Finding[] = [];
  for (const f of candidates) {
    if (f.end > f.start) {
      const overlaps = accepted.some((a) => f.start < a.end && f.end > a.start);
      if (overlaps) continue;
    }
    accepted.push(f);
    if (f.disclaimerToAdd && !extras.includes(f.disclaimerToAdd)) extras.push(f.disclaimerToAdd);
  }

  let out = text;
  for (const f of accepted.filter((f) => f.end > f.start).sort((a, b) => b.start - a.start)) {
    out = out.slice(0, f.start) + (f.fix ?? "") + out.slice(f.end);
  }
  out = out.replace(/[ \t]{2,}/g, " ").replace(/[ \t]+([!?.,])/g, "$1").trim();
  return extras.length ? `${out}\n${extras.join("\n")}` : out;
}

/** Re-check after fixing, up to `passes` times. Returns the draft and pass count. */
export function autoFix(
  text: string,
  today: Date,
  facts: Fact[] = FACTS,
  passes = 3
): { text: string; passes: number } {
  let out = text;
  for (let i = 1; i <= passes; i++) {
    const next = applyFixes(out, runChecks(out, today, facts));
    if (next === out) return { text: out, passes: i - 1 };
    out = next;
  }
  return { text: out, passes };
}

export type VerdictStatus = "approved" | "needs_changes" | "unverifiable" | "blocked";

export interface Verdict {
  status: VerdictStatus;
  label: string;
  detail: string;
}

/** One decision for the whole draft. Blocked beats Unverifiable beats Needs changes. */
export function verdict(findings: Finding[]): Verdict {
  const high = findings.filter((f) => f.severity === "high").length;
  const unverifiable = findings.filter((f) => f.ruleId === "CLAIM-06").length;
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
  if (high) {
    return {
      status: "blocked",
      label: "Blocked",
      detail: `${high} high-severity ${plural(high, "issue", "issues")} must be fixed, or approved with a written override by a Compliance Lead.`,
    };
  }
  if (unverifiable) {
    return {
      status: "unverifiable",
      label: "Unverifiable",
      detail: `${unverifiable} ${plural(unverifiable, "claim has", "claims have")} no approved fact behind ${plural(unverifiable, "it", "them")}. A named approver must verify or remove ${plural(unverifiable, "it", "them")}.`,
    };
  }
  if (findings.length) {
    return {
      status: "needs_changes",
      label: "Needs changes",
      detail: `${findings.length} open ${plural(findings.length, "issue", "issues")} to fix before approval.`,
    };
  }
  return {
    status: "approved",
    label: "Approved by rules",
    detail: "No rule or ledger issue found. A person still makes the final call.",
  };
}

export function brandScore(findings: Finding[]): number {
  const penalty = findings.reduce((n, f) => n + { high: 25, medium: 12, low: 5 }[f.severity], 0);
  return Math.max(0, 100 - penalty);
}

/** Facts a draft actually relies on. */
export function factsUsed(text: string, facts: Fact[] = FACTS): Fact[] {
  const { text: clean } = normalizeDraft(text);
  const used: Fact[] = [];
  for (const { s } of sentences(clean)) {
    for (const f of facts) {
      if (used.includes(f) || !firstMatch(f.topicPattern, s)) continue;
      if (f.value === null) {
        used.push(f);
        continue;
      }
      const amount = parseAmount(firstMatch(f.valuePattern, s));
      if (amount === f.value) used.push(f);
    }
  }
  return used;
}

/** The date after which this content is no longer safe. */
export function shelfLife(
  text: string,
  facts: Fact[] = FACTS
): { until: string | null; ids: string[] } {
  const used = factsUsed(text, facts);
  if (!used.length) return { until: null, ids: [] };
  const until = used.map((f) => f.validTo).sort()[0];
  return { until, ids: used.filter((f) => f.validTo === until).map((f) => f.id) };
}
