export type Severity = "high" | "medium" | "low";
export type Category =
  | "Claim"
  | "Tone"
  | "Terminology"
  | "Disclaimer"
  | "Visual"
  | "Privacy";

export interface Rule {
  id: string;
  category: Category;
  severity: Severity;
  pattern: RegExp; // must have the g flag
  title: string;
  why: string;
  fix: string | null; // replacement text; null = remove the span
  /** Optional context-aware replacement; wins over `fix` when present. */
  fixFor?: (text: string, match: RegExpExecArray) => string | null;
  source: string; // brand book citation
  /** Optional guard: return false to suppress a match (negation, idiom, context). */
  allow?: (text: string, match: RegExpExecArray) => boolean;
}

export interface Fact {
  id: string;
  topic: string;
  topicPattern: RegExp;
  /** Named groups `amt`/`unit` preferred; falls back to groups 1/2. */
  valuePattern: RegExp | null;
  value: number | null; // null = no numeric check (offer only)
  unit?: "%" | "₹" | null;
  approved: string;
  validTo: string; // ISO date
  owner: string;
  disclaimer?: string;
}

export interface Finding {
  id: string;
  ruleId: string;
  factId?: string;
  category: Category;
  severity: Severity;
  title: string;
  why: string;
  start: number;
  end: number;
  quote: string;
  fix: string | null;
  source: string;
  disclaimerToAdd?: string;
  /** A suggestion the person applies themselves (no automatic replacement). */
  manual?: boolean;
  /** Present only on findings proposed by a language model and grounded in the draft. */
  ai?: boolean;
}

export interface AiProposal {
  quote: string;
  ruleId: string;
  why: string;
  fix?: string;
}

export interface DroppedProposal {
  proposal: unknown;
  reason:
    | "bad_shape"
    | "unknown_rule"
    | "quote_not_found"
    | "quote_too_short"
    | "duplicate"
    | "invented_number"
    | "disallowed_category";
  detail: string;
}
