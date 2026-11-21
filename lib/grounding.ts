import { BRAND, RULE_META } from "@/data/brand";
import type { AiProposal, DroppedProposal, Finding } from "./types";
import { findQuote } from "./normalize";

/**
 * The model may only apply rules that regex cannot express.
 * Claims, prices, dates, privacy and visual checks stay deterministic.
 */
export const AI_ALLOWED_RULES = new Set([
  "VOICE-01",
  "TERM-01",
  "TERM-02",
  "TONE-02",
  "MSG-01",
]);

export const AI_ALLOWED_CATEGORIES = new Set(["Tone", "Terminology"]);

/** Names the rulebook already approves. The model may not flag them. */
const APPROVED_NAMES = [BRAND.name, "Nest Save"];

export interface GroundingResult {
  accepted: Finding[];
  dropped: DroppedProposal[];
}

function drop(reason: DroppedProposal["reason"], detail: string, proposal: unknown): DroppedProposal {
  return { reason, detail, proposal };
}

function numbersIn(text: string): string[] {
  return (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(/,/g, ""));
}

/**
 * Accepts a model proposal only if:
 *  - the rule exists and is one the model is allowed to apply;
 *  - the quote is a real substring of the draft;
 *  - it is not already covered by a deterministic finding;
 *  - it does not invent a number.
 * Severity and category always come from the rulebook, never from the model.
 */
export function groundProposals(
  draft: string,
  proposals: unknown,
  existing: Finding[] = [],
  allowedRules: Set<string> = AI_ALLOWED_RULES
): GroundingResult {
  const accepted: Finding[] = [];
  const dropped: DroppedProposal[] = [];
  if (!Array.isArray(proposals)) {
    return { accepted, dropped: [drop("bad_shape", "Response was not an array.", proposals)] };
  }

  for (const raw of proposals) {
    if (!raw || typeof raw !== "object") {
      dropped.push(drop("bad_shape", "Proposal was not an object.", raw));
      continue;
    }
    const p = raw as Partial<AiProposal>;
    if (
      typeof p.quote !== "string" ||
      typeof p.ruleId !== "string" ||
      typeof p.why !== "string"
    ) {
      dropped.push(drop("bad_shape", "quote, ruleId and why must be strings.", raw));
      continue;
    }
    if (p.fix !== undefined && typeof p.fix !== "string") {
      dropped.push(drop("bad_shape", "fix must be a string.", raw));
      continue;
    }

    const meta = RULE_META[p.ruleId];
    if (!meta) {
      dropped.push(drop("unknown_rule", `Rule ${p.ruleId} is not in the rulebook.`, raw));
      continue;
    }
    if (!allowedRules.has(p.ruleId) || !AI_ALLOWED_CATEGORIES.has(meta.category)) {
      dropped.push(
        drop(
          "disallowed_category",
          `${p.ruleId} is ${meta.category}; the model may only apply tone and terminology rules.`,
          raw
        )
      );
      continue;
    }

    const quote = p.quote.trim();
    if (quote.length < 3) {
      dropped.push(drop("quote_too_short", "Quote is shorter than 3 characters.", raw));
      continue;
    }
    if (quote.length > 240) {
      dropped.push(drop("quote_too_short", "Quote is longer than 240 characters.", raw));
      continue;
    }
    const span = findQuote(draft, quote);
    if (!span) {
      dropped.push(drop("quote_not_found", "Quote does not appear in the draft.", raw));
      continue;
    }

    // A terminology proposal must not "correct" an approved name, or change nothing.
    if (meta.category === "Terminology" && (APPROVED_NAMES.includes(quote) || p.fix?.trim() === quote)) {
      dropped.push(drop("duplicate", `"${quote}" is already an approved name, or the suggestion changes nothing.`, raw));
      continue;
    }

    const invented = numbersIn(`${p.why} ${p.fix ?? ""}`).filter(
      (n) => !numbersIn(draft).includes(n) && !numbersIn(meta.title).includes(n)
    );
    if (invented.length) {
      dropped.push(
        drop("invented_number", `Proposal introduced ${invented.join(", ")} not present in the draft.`, raw)
      );
      continue;
    }

    const overlaps = [...existing, ...accepted].some(
      (f) => f.start < span.end && f.end > span.start
    );
    if (overlaps) {
      dropped.push(drop("duplicate", "An existing finding already covers this text.", raw));
      continue;
    }

    accepted.push({
      id: "",
      ruleId: p.ruleId,
      category: meta.category,
      severity: meta.severity,
      title: meta.title,
      why: p.why.trim().slice(0, 400),
      start: span.start,
      end: span.end,
      quote: draft.slice(span.start, span.end),
      fix: p.fix?.trim() || null,
      source: meta.source,
      manual: true,
      ai: true,
    });
  }

  return {
    accepted: accepted.map((f, i) => ({ ...f, id: `ai-${i + 1}` })),
    dropped,
  };
}

/** A small, clearly-labelled demo response used when no model key is configured. */
export function simulatedProposals(draft: string, existing: Finding[] = []): AiProposal[] {
  const sentences = draft
    .split(/[.!?\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12);
  const clean = sentences.find((s) =>
    !existing.some((f) => s.includes(f.quote) || f.quote.includes(s))
  );
  const validQuote = (clean ?? sentences[0] ?? draft.trim()).slice(0, 120);
  return [
    {
      quote: validQuote,
      ruleId: "MSG-01",
      why: "The opening describes the product but does not name one concrete benefit for the reader. Lead with what the person can do.",
      fix: "Lead with one concrete benefit for the reader.",
    },
    {
      quote: "the best payments app in India",
      ruleId: "CLAIM-03",
      why: "Superlative comparison.",
    },
    {
      quote: "this exact sentence is not in the draft",
      ruleId: "TONE-02",
      why: "Hallucinated quote used to test the gate.",
    },
    {
      quote: validQuote,
      ruleId: "TONE-NOT-IN-RULEBOOK",
      why: "Unknown rule used to test the gate.",
    },
  ];
}
