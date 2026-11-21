import { reviewDraft } from "@/lib/reviewApi";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

/** Self-describing: what to send, and what comes back. */
export async function GET() {
  return Response.json(
    {
      endpoint: "POST /api/review/check",
      purpose: "Pre-publish guardrail for AI writing tools. Stateless: nothing is stored.",
      body: {
        caption: { text: "Our tool is 50% faster." },
        email: { format: "email", subject: "...", body: "..." },
        ad: { format: "ad", headline: "...", description: "..." },
        optional: { today: "2026-11-21" },
      },
      returns: "decision (approved | needs_changes | unverifiable | blocked), score 0-100, counts, findings with quote, rule, fix and source",
      limits: "8000 characters per draft",
    },
    { headers: CORS }
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400, headers: CORS });
  }
  const out = reviewDraft(body);
  if (!out.ok) return Response.json({ error: out.error }, { status: out.status, headers: CORS });
  return Response.json(out.result, { headers: CORS });
}
