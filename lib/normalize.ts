/**
 * Unicode-aware hardening for an evidence-first checker.
 * Rewrites only character-for-character so every match can be mapped back
 * to the original draft and highlighted in place.
 */

const FOLD: Record<string, string> = {
  // Cyrillic look-alikes
  "\u0410": "A", "\u0412": "B", "\u0415": "E", "\u041A": "K", "\u041C": "M",
  "\u041D": "H", "\u041E": "O", "\u0420": "P", "\u0421": "C", "\u0422": "T",
  "\u0425": "X", "\u0423": "Y", "\u0406": "I", "\u0408": "J", "\u0405": "S",
  "\u0430": "a", "\u0435": "e", "\u043E": "o", "\u0440": "p", "\u0441": "c",
  "\u0443": "y", "\u0445": "x", "\u0456": "i", "\u0458": "j", "\u0455": "s",
  "\u04BB": "h", "\u0501": "d", "\u051B": "q", "\u051D": "w",
  // Greek look-alikes
  "\u0391": "A", "\u0392": "B", "\u0395": "E", "\u0396": "Z", "\u0397": "H",
  "\u0399": "I", "\u039A": "K", "\u039C": "M", "\u039D": "N", "\u039F": "O",
  "\u03A1": "P", "\u03A4": "T", "\u03A5": "Y", "\u03A7": "X",
  "\u03B1": "a", "\u03B5": "e", "\u03B9": "i", "\u03BA": "k", "\u03BD": "v",
  "\u03BF": "o", "\u03C1": "p", "\u03C4": "t", "\u03C5": "u", "\u03C7": "x",
  // Punctuation that models and keyboards swap in
  "\u2018": "'", "\u2019": "'", "\u201C": '"', "\u201D": '"',
  "\u2013": "-", "\u2014": "-", "\u00A0": " ",
};

const INVISIBLE_RANGES: Array<[number, number]> = [
  [0x00ad, 0x00ad], // soft hyphen
  [0x180e, 0x180e],
  [0x200b, 0x200f], // zero-width space/joiners, bidi marks
  [0x202a, 0x202e],
  [0x2060, 0x2064],
  [0xfeff, 0xfeff],
];

function isInvisible(code: number): boolean {
  return INVISIBLE_RANGES.some(([a, b]) => code >= a && code <= b);
}

function foldChar(ch: string): string {
  const code = ch.charCodeAt(0);
  if (code >= 0x0966 && code <= 0x096f) return String(code - 0x0966); // Devanagari digits
  return FOLD[ch] ?? ch;
}

export interface Normalized {
  /** Draft with invisible characters removed and look-alikes folded. */
  text: string;
  /** map[i] = index in the original string; last entry = original length. */
  map: number[];
  removed: number;
}

export function normalizeDraft(text: string): Normalized {
  let out = "";
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (isInvisible(text.charCodeAt(i))) continue;
    out += foldChar(text[i]);
    map.push(i);
  }
  map.push(text.length);
  return { text: out, map, removed: text.length - out.length };
}

export function toOriginal(map: number[], i: number): number {
  const k = Math.max(0, Math.min(i, map.length - 1));
  return map[k];
}

const ESC = /[.*+?^${}()|[\]\\]/g;

/** Exact substring first, then a whitespace/case-tolerant match. */
export function findQuote(
  haystack: string,
  quote: string
): { start: number; end: number } | null {
  const q = quote.trim();
  if (q.length < 3) return null;
  const exact = haystack.indexOf(q);
  if (exact >= 0) return { start: exact, end: exact + q.length };
  const re = new RegExp(
    q.split(/\s+/).map((p) => p.replace(ESC, "\\$&")).join("[\\s\\u00A0]+"),
    "i"
  );
  const m = re.exec(haystack);
  return m ? { start: m.index, end: m.index + m[0].length } : null;
}

/** Reads an amount from a match and applies Indian units (lakh, crore, k). */
export function parseAmount(m: RegExpMatchArray | null): number | null {
  if (!m) return null;
  const g = (m.groups ?? {}) as Record<string, string | undefined>;
  const raw = g.amt ?? g.amt2 ?? g.amt3 ?? m[1] ?? m[2];
  if (!raw) return null;
  let n = parseFloat(raw.replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const unit = (g.unit ?? g.unit2 ?? g.unit3 ?? "").toLowerCase() ||
    (/\b(lakh|lac|crore|cr|k)\b/i.exec(m[0])?.[1] ?? "").toLowerCase();
  if (unit === "lakh" || unit === "lac") n *= 1e5;
  else if (unit === "crore" || unit === "cr") n *= 1e7;
  else if (unit === "k") n *= 1e3;
  return n;
}

const NEGATOR =
  /\b(?:not|never|no|without|cannot|can't|won't|don't|doesn't|isn't|aren't|wasn't|weren't|avoid|avoids|avoided|prohibited|forbidden|refuse|refuses|refused|stop|stops)\b/i;
const SAFE_META_AFTER =
  /\b(?:never|do\s+not|don't|does\s+not|doesn't)\s+(?:use|say|promise|claim|offer|make)\b/i;
const SAFE_META_BEFORE = /\b(?:never|do\s+not|don't|avoid|stop)\s*$/i;

/** True when the matched claim is negated or used as a meta-example. */
export function isNegated(text: string, start: number, end: number): boolean {
  const boundary = Math.max(
    text.lastIndexOf(".", start - 1),
    text.lastIndexOf("!", start - 1),
    text.lastIndexOf("?", start - 1),
    text.lastIndexOf("।", start - 1),
    text.lastIndexOf("\n", start - 1)
  );
  const prefix = text.slice(Math.max(0, start - 90, boundary + 1), start);
  if (NEGATOR.test(prefix)) return true;
  if (SAFE_META_BEFORE.test(prefix)) return true;
  const suffix = text.slice(end, Math.min(text.length, end + 45));
  if (
    /\b(?:is|are|was|were)\s+(?:not|never)\b|\b(?:isn't|aren't|wasn't|weren't)\b/i.test(suffix)
  ) return true;
  if (SAFE_META_AFTER.test(suffix)) return true;
  return false;
}

const ATTRIBUTION =
  /\b(?:competitors?|rivals?|other\s+apps?|another\s+app|some\s+apps?|a\s+startup|scammers?|fraudsters?|critics?)\b/i;
const BRAND_ACTOR = /\b(?:paynest|pay\s?nest|we|our)\b/g;

function lastActorIndex(prefix: string): number {
  const lower = prefix.toLowerCase();
  let last = lower.lastIndexOf("paynest");
  BRAND_ACTOR.lastIndex = 0;
  for (const m of lower.matchAll(BRAND_ACTOR)) {
    if (m.index !== undefined) last = Math.max(last, m.index);
  }
  return last;
}

/** True when the phrase is describing a competitor's claim, not ours. */
export function isAttributed(text: string, start: number): boolean {
  const boundary = Math.max(
    text.lastIndexOf(".", start - 1),
    text.lastIndexOf("!", start - 1),
    text.lastIndexOf("?", start - 1),
    text.lastIndexOf("।", start - 1),
    text.lastIndexOf("\n", start - 1)
  );
  const prefix = text.slice(Math.max(0, start - 90, boundary + 1), start);
  const marker = prefix.search(ATTRIBUTION);
  if (marker < 0) return false;
  return lastActorIndex(prefix) < marker;
}

const SAFE_SUPERLATIVE = [
  /\bbest\s+practices?\b/i,
  /\bbest\s+efforts?\b/i,
  /\bbest\s+wishes\b/i,
  /\bbest\s+regards\b/i,
  /\ball\s+the\s+best\b/i,
  /\b(?:do|try)\s+(?:your|our)\s+best\b/i,
  /\bbest\s+of\s+luck\b/i,
  /\bbest\s+time\b/i,
  /\bnumber\s+one\s+priority\b/i,
];

export function isSafePhrase(ruleId: string, text: string, start: number, end: number): boolean {
  if (ruleId !== "CLAIM-03") return false;
  const window = text.slice(Math.max(0, start - 24), Math.min(text.length, end + 24));
  return SAFE_SUPERLATIVE.some((re) => re.test(window));
}

const CLOSURE =
  /\b(?:ended|is\s+over|was\s+over|closed|expired|no\s+longer|discontinued|last\s+year|previous)\b/i;

/** True when the sentence talks about a finished offer rather than promoting it. */
export function isClosure(text: string, start: number, end: number): boolean {
  const left = Math.max(text.lastIndexOf(".", start), text.lastIndexOf("\n", start), 0);
  const dot = text.indexOf(".", end);
  const nl = text.indexOf("\n", end);
  const right = [dot, nl].filter((n) => n >= 0).sort((a, b) => a - b)[0] ?? text.length;
  return CLOSURE.test(text.slice(left, right));
}

export function luhn(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function contextHas(text: string, start: number, end: number, re: RegExp): boolean {
  return re.test(text.slice(Math.max(0, start - 45), Math.min(text.length, end + 45)));
}
