import { BRAND, FACTS } from "@/data/brand";
import { AuditEntry, Decision, createEntry, sha256 } from "./audit";
import { runChecks } from "./engine";

export type DemoRow = {
  daysAgo: number;
  reviewer: string;
  role: string;
  decision: Decision;
  comment: string;
  format: string;
  content: string;
};

/** A month of review history for the fictional PayNest team. Used to seed dashboards, labelled demo. */
export const DEMO_ROWS: DemoRow[] = [
  { daysAgo: 22, reviewer: "Rohan", role: "Brand Reviewer", decision: "rejected", comment: "Hype and a risk-free promise. Rejecting rather than rewriting.", format: "Ad copy", content: "Guaranteed returns on your savings account. Paynest is risk-free. Win big!!" },
  { daysAgo: 21, reviewer: "Ananya", role: "Compliance Lead", decision: "changes_requested", comment: "Superlative with no fact behind it. Please use the approved positioning line.", format: "Ad copy", content: "Get the best payments app in India today and win big!!" },
  { daysAgo: 20, reviewer: "Meera", role: "Legal Counsel", decision: "changes_requested", comment: "Rate claim needs the standard disclaimer and the approved product name.", format: "Email", content: "Earn 6.5% interest on your savings account." },
  { daysAgo: 19, reviewer: "Rohan", role: "Brand Reviewer", decision: "approved", comment: "Clean, cites an approved fact, unsubscribe line present.", format: "Email", content: "Your first UPI payment, made simple\n\nGet up to ₹100 cashback on your first UPI payment.\n\nTo stop receiving these emails, unsubscribe at any time.\n\nTeam PayNest" },
  { daysAgo: 17, reviewer: "Ananya", role: "Compliance Lead", decision: "approved_override", comment: "Campaign deadline; Growth owns the ₹500 number and will correct the ledger today.", format: "Instagram caption", content: "Get ₹500 cashback on your first UPI payment." },
  { daysAgo: 15, reviewer: "Rohan", role: "Brand Reviewer", decision: "approved", comment: "Festive offer approved while Diwali was live.", format: "Instagram caption", content: "Diwali double cashback is live. Get up to ₹100 cashback on your first UPI payment." },
  { daysAgo: 13, reviewer: "Meera", role: "Legal Counsel", decision: "rejected", comment: "Cannot imply RBI endorsement.", format: "Ad copy", content: "RBI approved PayNest for instant savings." },
  { daysAgo: 12, reviewer: "Ananya", role: "Compliance Lead", decision: "changes_requested", comment: "Customer phone number must not be in a creative.", format: "Instagram caption", content: "Questions? WhatsApp us on 9876543210 for instant help." },
  { daysAgo: 10, reviewer: "Rohan", role: "Brand Reviewer", decision: "changes_requested", comment: "Look-alike characters in the brand name. Treat as impersonation.", format: "Instagram caption", content: "PaуNest is live in your city. Download today." },
  { daysAgo: 9, reviewer: "Ananya", role: "Compliance Lead", decision: "approved", comment: "Approved wording, disclaimer included.", format: "Instagram caption", content: "Earn 6.5% p.a. interest on your Nest Save. *Rate as of Nov 2026. Terms apply." },
  { daysAgo: 7, reviewer: "Meera", role: "Legal Counsel", decision: "changes_requested", comment: "Subject line over the limit and mostly capitals.", format: "Email", content: "LAST CHANCE MEGA SAVINGS\n\nGet up to ₹100 cashback on your first UPI payment.\n\nTo stop receiving these emails, unsubscribe at any time." },
  { daysAgo: 6, reviewer: "Rohan", role: "Brand Reviewer", decision: "approved", comment: "Short, clear call to action.", format: "Ad copy", content: "PayNest: simple UPI payments\n\nGet up to ₹100 cashback on your first UPI payment. Download PayNest today." },
  { daysAgo: 4, reviewer: "Ananya", role: "Compliance Lead", decision: "rejected", comment: "Hurry framing and an unapproved card number.", format: "Instagram caption", content: "Hurry! Only today. Pay with card 4111 1111 1111 1111 and get cashback." },
  { daysAgo: 3, reviewer: "Meera", role: "Legal Counsel", decision: "changes_requested", comment: "Rate claim without the disclaimer.", format: "Ad copy", content: "Save more with 6.5% interest on Nest Save." },
  { daysAgo: 2, reviewer: "Rohan", role: "Brand Reviewer", decision: "approved", comment: "On-brand and grounded.", format: "Instagram caption", content: "Meet PayNest: simple payments for everyday life." },
  { daysAgo: 1, reviewer: "Ananya", role: "Compliance Lead", decision: "changes_requested", comment: "Fixed returns wording is prohibited even for a short caption.", format: "Instagram caption", content: "Fixed returns, zero risk. Start today." },
];

/** Builds the hash-chained demo trail. Deterministic apart from the timestamps derived from `today`. */
export async function buildDemoHistory(today: Date): Promise<AuditEntry[]> {
  const entries: AuditEntry[] = [];
  for (const row of DEMO_ROWS) {
    const at = new Date(today.getTime() - row.daysAgo * 86400000);
    at.setHours(10 + (entries.length % 7), 15, 0, 0);
    const openFindings = runChecks(row.content, at, FACTS).map((f) => f.ruleId);
    entries.push(
      await createEntry(
        entries[entries.length - 1],
        {
          reviewer: row.reviewer,
          role: row.role,
          decision: row.decision,
          comment: row.comment,
          format: row.format,
          contentHash: await sha256(row.content),
          contentPreview: row.content.replace(/\n+/g, " ").slice(0, 80),
          content: row.content,
          openFindings,
          rulebook: BRAND.rulebookVersion,
        },
        at
      )
    );
  }
  return entries;
}
