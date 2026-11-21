import { brandScore, runChecks, verdict } from "./engine";
import { formatChecks } from "./formats";

export const MAX_CHARS = 8000;

export type ReviewFormat = "caption" | "email" | "ad";

interface Failure {
  ok: false;
  status: number;
  error: string;
}

export interface ReviewOutput {
  ok: true;
  result: {
    format: ReviewFormat;
    decision: ReturnType<typeof verdict>;
    score: number;
    counts: { high: number; medium: number; low: number };
    reviewedText: string;
    findings: Array<{
      id: string;
      ruleId: string;
      category: string;
      severity: string;
      title: string;
      quote: string;
      start: number;
      end: number;
      fix: string | null;
      why: string;
      source: string;
    }>;
  };
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/**
 * Stateless review for AI writing tools: the same deterministic engine the
 * workspace uses (rules, Claim Ledger, Unverifiable claims, format rules).
 * Nothing is stored. The caller decides what to do with the verdict.
 */
export function reviewDraft(input: unknown): ReviewOutput | Failure {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, status: 400, error: "Send a JSON object, for example { \"text\": \"...\" }." };
  }
  const b = input as Record<string, unknown>;
  const format: ReviewFormat = b.format === "email" || b.format === "ad" ? b.format : "caption";

  let draft = "";
  let extras: ReturnType<typeof formatChecks> = [];
  if (format === "email") {
    const subject = str(b.subject);
    const body = str(b.body) || str(b.text);
    draft = `${subject}\n${body}`;
    extras = formatChecks("email", subject, body);
  } else if (format === "ad") {
    const headline = str(b.headline);
    const description = str(b.description) || str(b.text);
    draft = `${headline}\n${description}`;
    extras = formatChecks("ad", headline, description);
  } else {
    draft = str(b.text);
  }

  if (draft.trim().length < 4) {
    const hint =
      format === "email" ? "{ format: \"email\", subject, body }" : format === "ad" ? "{ format: \"ad\", headline, description }" : "{ text }";
    return { ok: false, status: 400, error: `Nothing to review. Send ${hint}.` };
  }
  if (draft.length > MAX_CHARS) {
    return { ok: false, status: 413, error: `Drafts are limited to ${MAX_CHARS} characters.` };
  }

  let today = new Date();
  if (b.today !== undefined) {
    const parsed = new Date(str(b.today));
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, status: 400, error: "today must be a date such as 2026-11-21." };
    }
    today = parsed;
  }

  const findings = runChecks(draft, today, undefined, extras);
  const counts = { high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity as keyof typeof counts] += 1;

  return {
    ok: true,
    result: {
      format,
      decision: verdict(findings),
      score: brandScore(findings),
      counts,
      reviewedText: draft,
      findings: findings.map((f) => ({
        id: f.id,
        ruleId: f.ruleId,
        category: f.category,
        severity: f.severity,
        title: f.title,
        quote: f.quote,
        start: f.start,
        end: f.end,
        fix: f.fix,
        why: f.why,
        source: f.source,
      })),
    },
  };
}
