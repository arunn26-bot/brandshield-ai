import type { Category, Rule, Severity } from "./types";

export interface GuidelinePage {
  page: number;
  text: string;
}

export interface RuleProposal {
  id: string;
  kind: "prohibited" | "required" | "replacement" | "limit" | "colour" | "fact";
  title: string;
  detail: string;
  quote: string;
  page: number;
  source: string;
  category: Category;
  severity: Severity;
  confidence: "high" | "medium" | "low";
  /** Present when the proposal can become a live pattern rule. */
  pattern?: string;
  fix?: string | null;
  meta?: Record<string, string | number>;
}

function clean(s: string): string {
  return s.replace(/\s+/g, " ").replace(/^[-•*]\s*/, "").trim();
}

function stripPeriod(s: string): string {
  return s.replace(/[.;:,]+$/, "").trim();
}

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function categoryFor(phrase: string): Category {
  if (/\b(?:guarantee|guaranteed|returns?|interest|safe|secure|best|approved|certified|risk)\b/i.test(phrase)) {
    return "Claim";
  }
  if (/\b(?:omg|hurry|last chance|must-have|free|instant)\b/i.test(phrase)) return "Tone";
  return "Terminology";
}

function severityFor(category: Category): Severity {
  return category === "Claim" ? "high" : category === "Tone" ? "medium" : "low";
}

/** Splits a clause such as "guaranteed returns or risk-free savings" into alternatives. */
function alternatives(phrase: string): string[] {
  const alts = phrase
    .split(/\s*(?:,|\bor\b|\band\b)\s*/i)
    .map((p) => stripPeriod(p))
    .filter((p) => p.length >= 3 && p.length <= 40);
  // Prose ("before and after photos of skin or hair") fragments into useless one-word
  // patterns. Keep the whole clause as a literal pattern instead.
  if (isProse(phrase, alts)) {
    const whole = stripPeriod(phrase);
    if (whole.length >= 3 && whole.length <= 60) return [whole];
  }
  return alts.slice(0, 3);
}

function isProse(phrase: string, alts: string[]): boolean {
  return phrase.split(/\s+/).length > 6 || alts.some((p) => p.split(/\s+/).length < 2);
}

export function extractProposals(
  pages: GuidelinePage[],
  docName = "Brand guideline"
): RuleProposal[] {
  const out: RuleProposal[] = [];
  let n = 0;

  const add = (p: Omit<RuleProposal, "id" | "source">) => {
    const key = `${p.kind}|${p.quote.toLowerCase()}|${p.page}|${p.meta?.hex ?? ""}`;
    if (out.some((o) => `${o.kind}|${o.quote.toLowerCase()}|${o.page}|${o.meta?.hex ?? ""}` === key)) return;
    n++;
    out.push({ ...p, id: `G-${String(n).padStart(2, "0")}`, source: `${docName} p.${p.page}` });
  };

  for (const page of pages) {
    // DOCX/PDF paragraphs often hold several sentences; patterns are sentence-anchored.
    const lines = page.text
      .split(/\n+/)
      .flatMap((l) => clean(l).split(/(?<=[.!?])\s+(?=[A-Z“"'])/))
      .map(clean)
      .filter(Boolean);
    for (const line of lines) {
      // 1) Prohibited phrase: "Never promise guaranteed returns or risk-free savings."
      const never = /^(?:never|do\s+not|don'?t|avoid)\s+((?:promise|say|use|write|claim|offer|mention|show|create|post|share|include|imply|state|describe|feature|compare|target|scare|shame|retouch|threaten|urge))\s+(?:the\s+word\s+)?(.+?)[.!]?$/i.exec(line);
      if (never) {
        const clause = never[2].split(/,\s*(?:and|but)\s+/i)[0];
        const phrase = stripPeriod(clause.replace(/^["'“”]|["'“”]$/g, ""));
        const alts = alternatives(phrase);
        if (alts.length) {
          const category = categoryFor(phrase);
          const literal = alts.length === 1 && alts[0].toLowerCase() === stripPeriod(phrase).toLowerCase()
            && isProse(phrase, phrase.split(/\s*(?:,|\bor\b|\band\b)\s*/i));
          const label = literal ? `${never[1].toLowerCase()} ${phrase}`.slice(0, 70) : alts.join(" / ");
          add({
            kind: "prohibited",
            title: `Avoid: ${label}`,
            detail: `The guideline prohibits this wording. Match it at least once before publishing.`,
            quote: line,
            page: page.page,
            category,
            severity: severityFor(category),
            confidence: category === "Claim" ? "high" : "medium",
            pattern: alts.map((a) => `\\b${esc(a)}\\b`).join("|"),
            fix: null,
          });
        }
        continue;
      }

      // 2) Replacement: "Use 'Nest Save' instead of 'savings account'."
      const replace = /\buse\s+["'“]?([^"'”]{2,40})["'”]?\s+instead\s+of\s+["'“]?([^"'”.,]{2,40})["'”]?/i.exec(line);
      if (replace) {
        add({
          kind: "replacement",
          title: `Use “${stripPeriod(replace[1])}” instead of “${stripPeriod(replace[2])}”`,
          detail: `Approved wording is “${stripPeriod(replace[1])}”.`,
          quote: line,
          page: page.page,
          category: "Terminology",
          severity: "low",
          confidence: "high",
          pattern: `\\b${esc(stripPeriod(replace[2]))}\\b`,
          fix: stripPeriod(replace[1]),
        });
        continue;
      }

      // 3) Required element: "Always include an unsubscribe line."
      const required = /\b(?:always|must)\s+(?:include|add|use|write|show|display|carry|contain|state|end\s+with|start\s+with)\s+(.+?)[.!]?$/i.exec(line);
      if (required) {
        const what = stripPeriod(required[1]);
        const detail = /unsubscribe|opt[- ]?out/i.test(what)
          ? "Already enforced by rule EMAIL-02 for email drafts."
          : /terms|disclaimer|t&c/i.test(what)
            ? "Already enforced by rule DISC-01 when a rate is claimed."
            : "Add this as a manual checklist item; it has no pattern yet.";
        add({
          kind: "required",
          title: `Must include: ${what}`,
          detail,
          quote: line,
          page: page.page,
          category: /terms|disclaimer|t&c|unsubscribe/i.test(what) ? "Disclaimer" : "Terminology",
          severity: "medium",
          confidence: "medium",
          meta: { requirement: what },
        });
        continue;
      }

      // 4) Character limit near a known field.
      const limit = /\b(\d{2,3})\s+characters?\b/i.exec(line);
      if (limit && /subject|headline|description|title|body/i.test(line)) {
        const field = /subject/i.test(line)
          ? "emailSubject"
          : /headline/i.test(line)
            ? "adHeadline"
            : "adDescription";
        add({
          kind: "limit",
          title: `${field} limit: ${limit[1]} characters`,
          detail: `The guideline sets a limit of ${limit[1]} characters.`,
          quote: line,
          page: page.page,
          category: "Terminology",
          severity: "medium",
          confidence: "high",
          meta: { field, limit: Number(limit[1]) },
        });
        continue;
      }

      // 5) Palette colours.
      const hexes = line.match(/#[0-9A-F]{6}\b/gi) ?? [];
      if (hexes.length) {
        const name = line.replace(/#[0-9A-F]{6}\b/gi, "").replace(/[:;,.\s]+/g, " ").trim();
        for (const hex of hexes) {
          add({
            kind: "colour",
            title: `Palette colour ${hex.toUpperCase()}`,
            detail: name ? `Named “${name}” in the guideline.` : "Approved palette colour.",
            quote: line,
            page: page.page,
            category: "Visual",
            severity: "low",
            confidence: "high",
            meta: { hex: hex.toUpperCase(), name: name || hex.toUpperCase() },
          });
        }
        continue;
      }

      // 6) Fact / offer with a rate and optional validity date.
      const rate = /(\d+(?:\.\d+)?)\s?%/.exec(line);
      if (rate && /interest|returns?|rate|p\.a\./i.test(line)) {
        const date = /valid\s+(?:until|to|till)\s+([0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|\w+\s+[0-9]{4})/i.exec(line);
        add({
          kind: "fact",
          title: `Rate fact: ${rate[1]}%`,
          detail: "A person must confirm the value, owner and valid-to date before this enters the Claim Ledger.",
          quote: line,
          page: page.page,
          category: "Claim",
          severity: "high",
          confidence: "medium",
          meta: { value: Number(rate[1]), validTo: date?.[1] ?? "needs confirmation" },
        });
      }
    }
  }

  const order = { high: 0, medium: 1, low: 2 } as const;
  return out.sort((a, b) => a.page - b.page || order[a.confidence] - order[b.confidence]);
}

/** Converts a confirmed proposal into a live runtime rule. */
export function proposalToRule(p: RuleProposal): Rule | null {
  if (!p.pattern) return null;
  return {
    id: p.id,
    category: p.category,
    severity: p.severity,
    pattern: new RegExp(p.pattern, "gi"),
    title: p.title,
    why: p.detail,
    fix: p.fix ?? null,
    source: p.source,
  };
}
