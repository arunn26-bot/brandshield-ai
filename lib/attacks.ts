import { FACTS } from "@/data/brand";
import { runChecks } from "./engine";

export interface AttackCase {
  id: string;
  label: string;
  kind: "trap" | "violation";
  text: string;
  /** Rules that must be present to pass. */
  expect: string[];
  /** Rules that must stay absent, even if other rules fire. */
  absent?: string[];
  /** Why this case exists. */
  note: string;
}

export interface AttackResult {
  attack: AttackCase;
  found: { ruleId: string; quote: string }[];
  rules: string[];
  pass: boolean;
}

/**
 * A fixed adversarial suite. The traps assert precision (no false alarms),
 * the violations assert recall. Expected outcomes are part of the suite,
 * not derived from the engine at runtime.
 */
export const ATTACKS: AttackCase[] = [
  {
    id: "negation",
    label: "Negated promise",
    kind: "trap",
    text: "PayNest is not risk-free, and we never promise guaranteed returns.",
    expect: [],
    note: "Negation and the meta-rule “never promise” both suppress the match.",
  },
  {
    id: "attribution",
    label: "Competitor quote",
    kind: "trap",
    text: "Some apps promise guaranteed returns. PayNest does not.",
    expect: [],
    note: "The promise belongs to another app, not to PayNest.",
  },
  {
    id: "idiom",
    label: "Idiom, not a claim",
    kind: "trap",
    text: "We do our best to keep payments simple.",
    expect: [],
    note: "“Do our best” is an idiom, so the superlative rule stays quiet.",
  },
  {
    id: "closure",
    label: "Finished offer",
    kind: "trap",
    text: "Diwali double cashback ended on 10 Nov 2026.",
    expect: [],
    note: "Closure language describes history rather than promoting an expired offer.",
  },
  {
    id: "id-guard",
    label: "Twelve digits, no ID context",
    kind: "trap",
    text: "Ticket 1234 5678 9012 for your seat.",
    expect: [],
    note: "An Aadhaar-shaped number without identity context is not treated as one.",
  },
  {
    id: "approved",
    label: "Grounded claim + disclaimer",
    kind: "trap",
    text: "Earn 6.5% p.a. interest on Nest Save. *Rate as of Nov 2026. Terms apply.",
    expect: [],
    note: "Matches the Claim Ledger exactly and carries the standard disclaimer.",
  },
  {
    id: "guarantee",
    label: "Guaranteed returns",
    kind: "violation",
    text: "Get guaranteed returns of 9% on your savings account.",
    expect: ["CLAIM-02", "CLAIM-01", "TERM-02", "DISC-01"],
    note: "One sentence breaks four rules: promise, wrong rate, wrong product name, no disclaimer.",
  },
  {
    id: "homoglyph",
    label: "Look-alike brand",
    kind: "violation",
    text: "P\u0430yNest is live in your city.",
    expect: ["HOMO-01"],
    note: "A Cyrillic “а” impersonates PayNest. The raw text is checked before folding.",
  },
  {
    id: "invisible",
    label: "Zero-width split",
    kind: "violation",
    text: "Pay\u200Bnest is live in your city.",
    expect: ["HOMO-02"],
    note: "An invisible character splits the name; the folded text also trips TERM-01.",
  },
  {
    id: "pii",
    label: "Phone number in copy",
    kind: "violation",
    text: "Questions? Call 9876543210 for instant help.",
    expect: ["PII-02"],
    note: "A number with contact context. Redaction runs in the browser before any model call.",
  },
  {
    id: "expired",
    label: "Expired offer",
    kind: "violation",
    text: "Diwali double cashback is live today!",
    expect: ["CLAIM-05"],
    note: "F-104 ended on 10 Nov 2026. The Claim Ledger, not a keyword list, catches this.",
  },
  {
    id: "rate",
    label: "Wrong rate, no terms",
    kind: "violation",
    text: "Earn 9% interest on your Nest Save.",
    expect: ["CLAIM-01", "DISC-01"],
    note: "9% contradicts the approved 6.5% and the disclaimer is missing.",
  },
  {
    id: "hype",
    label: "Pressure + superlative",
    kind: "violation",
    text: "OMG!! Best app ever. Hurry, only today!",
    expect: ["VOICE-01", "CLAIM-03"],
    note: "Hype and urgency, plus a superlative with no approved fact behind it.",
  },
  {
    id: "percent",
    label: "“100% safe”",
    kind: "violation",
    text: "100% safe payments, every time.",
    expect: ["CLAIM-02"],
    absent: ["DISC-01"],
    note: "Caught as a financial promise, deliberately not mistaken for a percentage rate.",
  },
];

export function runAttacks(today: Date, facts = FACTS): AttackResult[] {
  return ATTACKS.map((attack) => {
    const findings = runChecks(attack.text, today, facts);
    const rules = [...new Set(findings.map((f) => f.ruleId))];
    const pass =
      attack.kind === "trap"
        ? findings.length === 0
        : attack.expect.every((id) => rules.includes(id)) &&
          (attack.absent ?? []).every((id) => !rules.includes(id));
    return {
      attack,
      found: findings.map((f) => ({ ruleId: f.ruleId, quote: f.quote })),
      rules,
      pass,
    };
  });
}
