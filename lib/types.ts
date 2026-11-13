export type Severity = "high" | "medium" | "low";
export type Category = "Claim" | "Tone" | "Terminology" | "Disclaimer";

export interface Rule {
  id: string;
  category: Category;
  severity: Severity;
  pattern: RegExp;          // must have the g flag
  title: string;
  why: string;
  fix: string | null;       // replacement text; null = remove the span
  source: string;           // brand book citation
}

export interface Fact {
  id: string;
  topic: string;
  topicPattern: RegExp;     // finds sentences about this fact
  valuePattern: RegExp;     // captures the number in group 1
  value: number | null;     // null = no numeric check (offer only)
  approved: string;         // approved wording used for the fix
  validTo: string;          // ISO date
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
}
