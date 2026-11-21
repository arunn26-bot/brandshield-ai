import type { Category, Fact, Rule, Severity } from "@/lib/types";
import {
  contextHas,
  isAttributed,
  isNegated,
  isSafePhrase,
  luhn,
} from "@/lib/normalize";

export const BRAND = {
  name: "PayNest",
  tagline: "UPI payments and savings for India (fictional brand for demo)",
  rulebookVersion: "v1.1",
  audience: "Salaried and student users, 20-35, India",
};

export const FACTS: Fact[] = [
  {
    id: "F-101",
    topic: "First-payment cashback",
    topicPattern: /\bcash\s?back\b|कैशबैक/i,
    valuePattern:
      /(?:₹|rs\.?\s?|inr\s?|rupees?\s?)(?<amt>[\d,.]+)\s*(?<unit>lakh|lac|crore|cr|k)?|(?<amt2>[\d,.]+)\s*(?<unit2>lakh|lac|crore|cr|k)?\s?(?:₹|rs\b|rupees?)|\b(?<amt3>[\d,.]+)\s*(?<unit3>lakh|lac|crore|cr)\s*(?:cash\s?back|कैशबैक)/gi,
    value: 100,
    unit: "₹",
    approved: "up to ₹100 cashback",
    validTo: "2026-12-31",
    owner: "Growth",
  },
  {
    id: "F-102",
    topic: "Nest Save interest rate",
    topicPattern: /\binterest(?:\s+rate)?\b|\breturns?\b|ब्याज|\bsavings?\s+rate\b|nest\s+save/i,
    valuePattern: /(?<amt>\d+(?:\.\d+)?)\s*(?<unit>%|percent|p\.a\.)/gi,
    value: 6.5,
    unit: "%",
    approved: "6.5% p.a. interest*",
    validTo: "2026-12-31",
    owner: "Treasury",
    disclaimer: "*Rate as of Nov 2026. Terms apply.",
  },
  {
    id: "F-104",
    topic: "Diwali double cashback offer",
    topicPattern: /\b(?:diwali|deepavali)\b(?:\s+(?:double|extra|bonus))?(?:\s+(?:cashback|offer))?|दिवाली|दीवाली/i,
    valuePattern: null,
    value: null,
    approved: "our latest offers",
    validTo: "2026-11-10",
    owner: "Growth",
  },
];

function liveClaim(text: string, m: RegExpExecArray): boolean {
  const start = m.index ?? 0;
  const end = start + m[0].length;
  if (/[.!?]\s+[A-Z]/.test(m[0])) return false; // never bridge two sentences
  if (/\b(?:not|never|without)\b/i.test(m[0])) return false;
  return !isNegated(text, start, end) && !isAttributed(text, start);
}

export const RULES: Rule[] = [
  {
    id: "CLAIM-02", category: "Claim", severity: "high",
    pattern:
      /\b(?:guarantees?|guaranteed|assures?|assured)\b[^!?\n]{0,40}\b(?:returns?|interest|profit|income)|\bfixed\s+(?:returns?|interest)\b|\brisk[-\s]?free\b|\bzero[-\s]?risk\b|\b100\s?%\s?(?:safe|secure|guaranteed)\b|\bdouble\s+your\s+money\b|\bno[-\s]?loss\b|\bcapital\s+protection\b|गारंटीड\s?रिटर्न|पूरी\s?तरह\s?सुरक्षित/gi,
    title: "Prohibited financial promise",
    why: "PayNest never promises guaranteed or risk-free returns. Savings rates can change.",
    fix: "6.5% p.a. interest*",
    source: "Brand Book p.14 §5.1",
    allow: liveClaim,
  },
  {
    id: "CLAIM-03", category: "Claim", severity: "high",
    pattern:
      /(?:the\s+)?\b(?:best|number\s+one|no\.?\s*1)\b(?:\s+\w+){0,3}?(?:\s+in\s+india)?|#1\b|\bsabse\s+(?:best|accha|achha|badhiya)\b|सबसे\s+(?:बेहतर|अच्छा|शानदार)/gi,
    title: "Unsupported superlative",
    why: "Superlatives need an approved fact behind them. None exists for PayNest.",
    fix: null,
    fixFor: (text, m) => {
      const end = (m.index ?? 0) + m[0].length;
      const after = text.slice(end, end + 16);
      // "the best payments app" needs an article; "sabse best offers" does not.
      return /^\s+(?:[\w'-]+\s+){0,2}app\b/i.test(after) ? "a simple" : "simple";
    },
    source: "Brand Book p.15 §5.3",
    allow: (text, m) => {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      return liveClaim(text, m) && !isSafePhrase("CLAIM-03", text, start, end);
    },
  },
  {
    id: "CLAIM-04", category: "Claim", severity: "high",
    pattern:
      /\b(?:rbi|reserve\s+bank)\b[^.!?\n]{0,25}\b(?:approved|certified|endorsed|authori[sz]ed)\b|\b(?:approved|certified)\s+by\s+(?:the\s+)?rbi\b/gi,
    title: "Regulator endorsement claim",
    why: "PayNest may not imply regulator approval. Use the approved partner-bank line instead.",
    fix: "built with RBI-regulated partner banks",
    source: "Brand Book p.15 §5.4",
    allow: liveClaim,
  },
  {
    id: "VOICE-01", category: "Tone", severity: "medium",
    pattern:
      /\bOMG\b|!{2,}|\bhurry\b|\blast\s+chance\b|\bmust[-\s]?have\b|\bact\s+now\b|\bonly\s+today\b|\bwon'?t\s+last\b|\bclick\s+now\b|\blimited\s+time\b/gi,
    title: "Hype in the tone",
    why: "PayNest speaks calmly and clearly. Avoid shouting, stacked exclamations and pressure.",
    fix: null,
    source: "Brand Book p.6 §2.2",
    allow: liveClaim,
  },
  {
    id: "TERM-01", category: "Terminology", severity: "low",
    pattern:
      /\bPay\s+Nest\b|\bPay\s+nest\b|\bpay\s+nest\b|\bPaynest\b|\bpaynest\b|\bPAYNEST\b|\bPayNEST\b|\bPAYnest\b/g,
    title: "Use the product name",
    why: "The name is always written PayNest, one word, capital P and N.",
    fix: "PayNest",
    source: "Brand Book p.9 §4.1",
    allow: liveClaim,
  },
  {
    id: "TERM-02", category: "Terminology", severity: "low",
    pattern: /\bsavings?\s+account\b|\bbank\s+account\b/gi,
    title: "Say Nest Save",
    why: "PayNest does not offer a bank account. Call the product Nest Save.",
    fix: "Nest Save",
    source: "Brand Book p.10 §4.2",
    allow: liveClaim,
  },
  {
    id: "PII-01", category: "Privacy", severity: "high",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    title: "Personal email address in a draft",
    why: "Customer contact details must never appear in published content.",
    fix: null,
    source: "Brand Book p.28 §10.2 · Privacy",
  },
  {
    id: "PII-02", category: "Privacy", severity: "high",
    pattern: /(?:\+91[\s-]?)?\b[6-9]\d{9}\b/g,
    title: "Personal phone number in a draft",
    why: "Customer phone numbers must never appear in published content.",
    fix: null,
    source: "Brand Book p.28 §10.2 · Privacy",
    allow: (text, m) => {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      return m[0].startsWith("+91") || contextHas(text, start, end, /\b(?:call|phone|mobile|whatsapp|contact|dial|sms|helpline)\b/i);
    },
  },
  {
    id: "PII-03", category: "Privacy", severity: "high",
    pattern: /\b\d{4}\s\d{4}\s\d{4}\b/g,
    title: "Aadhaar-like identity number",
    why: "Government identity numbers must never appear in marketing drafts.",
    fix: null,
    source: "Brand Book p.28 §10.3 · Privacy",
    allow: (text, m) => {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      return contextHas(text, start, end, /\b(?:aadhaar|aadhar|uid|identity|id\s+number)\b/i);
    },
  },
  {
    id: "PII-04", category: "Privacy", severity: "high",
    pattern: /\b[A-Z]{5}\d{4}[A-Z]\b/g,
    title: "PAN-like tax identifier",
    why: "Tax identifiers must never appear in marketing drafts.",
    fix: null,
    source: "Brand Book p.28 §10.3 · Privacy",
    allow: (text, m) => {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      return contextHas(text, start, end, /\b(?:pan|tax|identity|kyc)\b/i);
    },
  },
  {
    id: "PII-05", category: "Privacy", severity: "high",
    pattern: /\b(?:\d[ -]?){13,19}\b/g,
    title: "Payment card number",
    why: "Card numbers must never appear in marketing drafts.",
    fix: null,
    source: "Brand Book p.28 §10.4 · Privacy",
    allow: (text, m) => {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      return (
        luhn(m[0]) &&
        contextHas(text, start, end, /\b(?:card|visa|mastercard|rupay|debit|credit)\b/i)
      );
    },
  },
  {
    id: "HOMO-01", category: "Terminology", severity: "high",
    pattern: /[Pp][aаα][yуυ][Nn][eеε][sѕ][tтτ]/g,
    title: "Look-alike characters in the brand name",
    why: "A non-Latin look-alike character is impersonating PayNest. This is a phishing pattern.",
    fix: "PayNest",
    source: "Brand Book p.9 §4.1 · Impersonation",
    allow: (_text, m) => /[^\x00-\x7F]/.test(m[0]),
  },
];

export const PALETTE = [
  { name: "Nest Teal", hex: "#0F766E" },
  { name: "Night", hex: "#0B1816" },
  { name: "Cream", hex: "#F3EFE4" },
  { name: "Mint", hex: "#5EEAD4" },
  { name: "Gold", hex: "#E6C364" },
  { name: "White", hex: "#FFFFFF" },
];

export const LIMITS = { emailSubject: 60, adHeadline: 40, adDescription: 125 };

/** Metadata for every rule a finding or AI proposal may cite. */
export interface RuleMeta {
  title: string;
  category: Category;
  severity: Severity;
  source: string;
}

export const RULE_META: Record<string, RuleMeta> = {};
for (const r of RULES) {
  RULE_META[r.id] = { title: r.title, category: r.category, severity: r.severity, source: r.source };
}
Object.assign(RULE_META, {
  "CLAIM-01": { title: "Claim contradicts an approved fact", category: "Claim", severity: "high", source: "Claim Ledger" },
  "CLAIM-06": { title: "Unverifiable claim", category: "Claim", severity: "medium", source: "Claim Ledger \u00b7 no matching approved fact" },
  "CLAIM-05": { title: "Expired offer or fact", category: "Claim", severity: "high", source: "Claim Ledger" },
  "DISC-01": { title: "Missing disclaimer", category: "Disclaimer", severity: "medium", source: "Brand Book p.16 §5.6" },
  "EMAIL-00": { title: "Missing subject line", category: "Terminology", severity: "high", source: "Brand Book p.24 §8.1 · Email" },
  "EMAIL-01": { title: "Subject line too long", category: "Terminology", severity: "medium", source: "Brand Book p.24 §8.1 · Email" },
  "EMAIL-02": { title: "Missing unsubscribe line", category: "Disclaimer", severity: "high", source: "Brand Book p.25 §8.3 · Email" },
  "EMAIL-03": { title: "Subject is mostly capitals", category: "Tone", severity: "medium", source: "Brand Book p.24 §8.2 · Email" },
  "EMAIL-04": { title: "No greeting", category: "Tone", severity: "low", source: "Brand Book p.25 §8.4 · Email" },
  "AD-01": { title: "Headline too long", category: "Terminology", severity: "medium", source: "Brand Book p.26 §9.1 · Ads" },
  "AD-02": { title: "Description too long", category: "Terminology", severity: "medium", source: "Brand Book p.26 §9.1 · Ads" },
  "AD-03": { title: "No call to action", category: "Terminology", severity: "medium", source: "Brand Book p.26 §9.2 · Ads" },
  "VIS-01": { title: "Off-palette colour", category: "Visual", severity: "medium", source: "Brand Book p.20 §7.1 · Colour palette" },
  "VIS-02": { title: "Low headline contrast", category: "Visual", severity: "medium", source: "Brand Book p.21 §7.4 · WCAG 2.1 AA" },
  "HOMO-02": { title: "Invisible characters inside the brand name", category: "Terminology", severity: "high", source: "Brand Book p.9 §4.1 · Impersonation" },
  // Rules the model may cite that regex cannot express. Kept in the rulebook,
  // but only the AI reviewer applies them.
  "TONE-02": { title: "Off-brand tone", category: "Tone", severity: "medium", source: "Brand Book p.6 §2.2" },
  "MSG-01": { title: "Message is unclear or off-brief", category: "Tone", severity: "low", source: "Brand Book p.6 §2.1" },
});
