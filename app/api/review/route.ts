import { modelConfigFromEnv, proposeWithModel } from "@/lib/ai";

const MAX_CHARS = 8000;

/** Reports whether a live model is configured, without exposing the key. */
export async function GET() {
  const config = modelConfigFromEnv();
  return Response.json({
    mode: config ? "model" : "simulated",
    model: config?.model ?? "scripted demo",
  });
}

/**
 * Stateless tone review. The caller sends an already-redacted draft;
 * nothing is stored or logged. Accepting a proposal is the caller's job.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const text = (body as { text?: unknown } | null)?.text;
  if (typeof text !== "string" || text.trim().length < 4) {
    return Response.json({ error: "Send { text } with the draft to review." }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return Response.json({ error: `Drafts are limited to ${MAX_CHARS} characters.` }, { status: 413 });
  }

  const config = modelConfigFromEnv();
  if (!config) return Response.json({ mode: "simulated" });

  try {
    const result = await proposeWithModel(text, config);
    return Response.json({ mode: "model", model: result.model, proposals: result.proposals });
  } catch (error) {
    return Response.json(
      { mode: "error", error: error instanceof Error ? error.message : "The model call failed." },
      { status: 502 }
    );
  }
}
