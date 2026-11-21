import { RULE_META } from "@/data/brand";
import { AI_ALLOWED_RULES } from "./grounding";

export interface ModelConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export function modelConfigFromEnv(env: Record<string, string | undefined> = process.env): ModelConfig | null {
  const apiKey = env.AI_API_KEY ?? env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return {
    baseUrl: (env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
    apiKey,
    model: env.AI_MODEL ?? "gpt-4o-mini",
    timeoutMs: Number(env.AI_TIMEOUT_MS ?? 12000),
  };
}

const SYSTEM = `You are the tone reviewer inside BrandShield, a pre-publication brand firewall.

You may ONLY cite these rules:
${[...AI_ALLOWED_RULES]
  .map((id) => `- ${id}: ${RULE_META[id]?.title ?? id} (${RULE_META[id]?.source ?? "brand book"})`)
  .join("\n")}

Return at most 3 findings. Each finding must have:
- "quote": an EXACT substring of the draft, 3-160 characters. Copy it character for character.
- "ruleId": one of the rule ids above.
- "why": at most 200 characters, explaining the issue using only words in the draft.
- "fix": optional, one concrete rewrite. Do not add new facts, prices, numbers or claims.

Hard rules:
- Never invent a quote, a rule id, a number or a fact.
- Do not comment on prices, rates, dates, claims, disclaimers or visuals. A deterministic engine already checks those.
- Tokens like {{EMAIL_1}} are redacted personal data. Quote them as-is; never guess their contents.
- If the draft is on-brand, return {"proposals":[]}.
- Output JSON only, shaped like {"proposals":[{"quote":"...","ruleId":"...","why":"...","fix":"..."}]}.`;

export interface ModelResult {
  proposals: unknown;
  model: string;
}

export async function proposeWithModel(
  redactedDraft: string,
  config: ModelConfig,
  fetchImpl: typeof fetch = fetch
): Promise<ModelResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Draft to review:\n\n${redactedDraft}` },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Model returned ${response.status}`);
    }
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(stripFences(content)) as { proposals?: unknown };
    return { proposals: Array.isArray(parsed.proposals) ? parsed.proposals : [], model: config.model };
  } finally {
    clearTimeout(timer);
  }
}

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
}
