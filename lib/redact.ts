export interface RedactionResult {
  text: string;
  /** token -> original text, kept only in the browser */
  map: Record<string, string>;
  counts: Record<string, number>;
  total: number;
}

const RULES: Array<[string, RegExp]> = [
  ["CARD", /\b(?:\d[ -]?){13,19}\b/g],
  ["AADHAAR", /\b\d{4}\s\d{4}\s\d{4}\b/g],
  ["EMAIL", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi],
  ["PHONE", /(?:\+91[\s-]?)?\b[6-9]\d{9}\b/g],
  ["PAN", /\b[A-Z]{5}\d{4}[A-Z]\b/g],
  ["LONGNUM", /\b\d{10,}\b/g],
];

/**
 * Replaces PII with stable ASCII tokens before anything leaves the browser.
 * Currency amounts such as ₹500 are deliberately left intact.
 */
export function redact(text: string): RedactionResult {
  let out = text;
  const map: Record<string, string> = {};
  const counts: Record<string, number> = {};
  let n = 0;

  for (const [label, re] of RULES) {
    re.lastIndex = 0;
    out = out.replace(re, (match) => {
      n++;
      counts[label] = (counts[label] ?? 0) + 1;
      const token = `{{${label}_${n}}}`;
      map[token] = match;
      return token;
    });
  }

  return { text: out, map, counts, total: n };
}

/** Restores the original values inside a quote returned by the model. */
export function unredact(text: string, map: Record<string, string>): string {
  return text.replace(/\{\{[A-Z]+_\d+\}\}/g, (token) => map[token] ?? token);
}

export function redactionSummary(counts: Record<string, number>): string {
  const parts = Object.entries(counts).map(([k, v]) => `${v} ${k.toLowerCase()}`);
  return parts.length ? parts.join(", ") : "no personal data found";
}
