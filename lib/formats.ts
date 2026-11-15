import { LIMITS } from "@/data/brand";
import { Finding } from "./types";

type Extra = Omit<Finding, "id">;

const CTA = /\b(download|open|start|try|join|sign up|register|save|pay|shop|learn more|claim|apply|get started)\b/i;
const UNSUB = /unsubscribe|opt[- ]?out/i;
const GREETING = /^\s*(hi|hello|dear|namaste|hey)\b/i;

/**
 * Format-specific rules. `first` is the subject or headline, `rest` is the body or description.
 * These are suggestions the person applies themselves, except the unsubscribe line, which can be added.
 */
export function formatChecks(kind: "email" | "ad", first: string, rest: string): Extra[] {
  const out: Extra[] = [];
  const end = first.length + 1 + rest.length;

  if (kind === "email") {
    const n = first.trim().length;
    if (n === 0) {
      out.push({ ruleId: "EMAIL-00", category: "Terminology", severity: "high", title: "Missing subject line",
        why: "Every email needs a subject line.", start: 0, end: 0, quote: "(no subject)",
        fix: "Write a clear subject of 60 characters or fewer", source: "Brand Book p.24 §8.1 · Email", manual: true });
    }
    if (n > LIMITS.emailSubject) {
      out.push({ ruleId: "EMAIL-01", category: "Terminology", severity: "medium", title: "Subject line too long",
        why: `The subject is ${n} characters. Phones cut it off after about ${LIMITS.emailSubject}.`,
        start: 0, end: 0, quote: `${n} characters (limit ${LIMITS.emailSubject})`,
        fix: `Shorten by ${n - LIMITS.emailSubject} characters`, source: "Brand Book p.24 §8.1 · Email", manual: true });
    }
    const letters = first.replace(/[^A-Za-z]/g, "");
    if (letters.length > 8 && letters.replace(/[^A-Z]/g, "").length / letters.length > 0.6) {
      out.push({ ruleId: "EMAIL-03", category: "Tone", severity: "medium", title: "Subject is mostly capitals",
        why: "All-caps subjects read as shouting and trigger spam filters.",
        start: 0, end: 0, quote: first.slice(0, 40), fix: "Use sentence case", source: "Brand Book p.24 §8.2 · Email", manual: true });
    }
    if (rest.trim() && !GREETING.test(rest)) {
      out.push({ ruleId: "EMAIL-04", category: "Tone", severity: "low", title: "No greeting",
        why: "PayNest emails open with a greeting, for example “Hi there,”.",
        start: 0, end: 0, quote: rest.trim().slice(0, 30), fix: "Start with “Hi there,”", source: "Brand Book p.25 §8.4 · Email", manual: true });
    }
    if (!UNSUB.test(rest)) {
      out.push({ ruleId: "EMAIL-02", category: "Disclaimer", severity: "high", title: "Missing unsubscribe line",
        why: "Marketing emails must let people opt out.", start: end, end, quote: "(end of email)",
        fix: null, source: "Brand Book p.25 §8.3 · Email",
        disclaimerToAdd: "To stop receiving these emails, unsubscribe at any time." });
    }
  } else {
    const h = first.trim().length, d = rest.trim().length;
    if (h > LIMITS.adHeadline) {
      out.push({ ruleId: "AD-01", category: "Terminology", severity: "medium", title: "Headline too long",
        why: `The headline is ${h} characters. Ad platforms cut it off after ${LIMITS.adHeadline}.`,
        start: 0, end: 0, quote: `${h} characters (limit ${LIMITS.adHeadline})`,
        fix: `Shorten by ${h - LIMITS.adHeadline} characters`, source: "Brand Book p.26 §9.1 · Ads", manual: true });
    }
    if (d > LIMITS.adDescription) {
      out.push({ ruleId: "AD-02", category: "Terminology", severity: "medium", title: "Description too long",
        why: `The description is ${d} characters. The limit is ${LIMITS.adDescription}.`,
        start: 0, end: 0, quote: `${d} characters (limit ${LIMITS.adDescription})`,
        fix: `Shorten by ${d - LIMITS.adDescription} characters`, source: "Brand Book p.26 §9.1 · Ads", manual: true });
    }
    if (!CTA.test(`${first} ${rest}`)) {
      out.push({ ruleId: "AD-03", category: "Terminology", severity: "medium", title: "No call to action",
        why: "Every ad needs one clear action for the reader.",
        start: 0, end: 0, quote: "(no action word found)",
        fix: "Add one, for example “Download PayNest today.”", source: "Brand Book p.26 §9.2 · Ads", manual: true });
    }
  }
  return out;
}
