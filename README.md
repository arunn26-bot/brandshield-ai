# BrandShield AI

**Check brand content before it ships.** BrandShield checks captions, emails, ads and image creatives against a brand's approved rules, facts and palette. Every finding quotes the draft, names the rule it breaks, cites its source and suggests a fix. A person makes the final call, and a claim nobody can verify is never approved silently.

- **Live demo:** FINAL_LINK_HERE (no sign-in, no demo account needed)
- **Built by:** Arun Sharma, team `sharmaarun24089`, CodeNova India 2026
- **Problem statement:** Brand governance, by Inkloom AI
- **Demo brand:** PayNest, a fictional Indian UPI and savings app

## Judge quick start (2 minutes, no login)

Open `/app`. Roles are switched from the dropdown at the top right (Creator submits, Reviewer decides, Compliance overrides). The **Judge path** panel at the bottom right walks through the same steps.

1. **New draft**, load the **Unverified claims** sample. The decision banner says **Unverifiable**: "50% faster" and "10,000 customers" have no approved fact behind them.
2. Press **Submit for review** (the intent card is pre-filled), then switch role to **Reviewer** and open **Review queue**. The draft carries a blue **Unverifiable claim** chip, and **Approve** stays locked until the approver writes which source supports the claims.
3. Back in New draft, press **Run AI review**. The model may only propose tone and terminology findings. A gate drops any proposal that invents a quote, cites an unknown rule, adds a number, or "corrects" an approved brand name.
4. Open **Attack lab** (14 adversarial drafts with fixed outcomes), **Governance**, and **Audit trail** (verify the hash chain, then simulate tampering).
5. **Review API** for AI writing tools: open `/api/review/check` in the browser for a self-description, or call it:

```
curl -X POST FINAL_LINK_HERE/api/review/check -H "Content-Type: application/json" \
  -d '{"text":"Our tool is 50% faster and used by 10,000 customers."}'
```

It returns the decision (`unverifiable` here), the score and every finding with its quote, rule and source.

## What it does

| Area | What works |
|---|---|
| Formats | Instagram caption, Email (subject + body), Ad copy, Image creative. Upload PDF, DOCX or TXT drafts |
| Rules | Financial promises, unsupported superlatives, regulator claims, hype tone, product naming, disclaimers, PII (email, phone, Aadhaar, PAN, card), look-alike characters, Hinglish patterns |
| Claim Ledger | Approved facts with owner and valid-to date. Wrong numbers and expired offers are flagged |
| **Unverifiable claims** | Numbers with no approved fact (percentages, "Nx faster", customer counts) are marked Unverifiable and routed to a human approver |
| **Decision** | One verdict per draft: Approved by rules, Needs changes, Unverifiable, or Blocked |
| Review API | `POST /api/review/check`: the full deterministic review as JSON for AI writing tools. Stateless, validates input (400 and 413 errors), CORS enabled |
| Brand score and fixes | 0-100 score, one-click minimal fixes with approved wording, diff view |
| AI tone review | Grounded in the rulebook, redacted before leaving the browser, every proposal gated |
| Guideline upload | Extract rules from a brand-guideline PDF or DOCX. A person confirms each rule |
| Approval queue | Roles, written overrides for high severity, extra comment needed to approve Unverifiable drafts |
| Audit trail | SHA-256 hash chain, verify, tamper demo, exportable bundle that verifies offline |
| Governance | Approval and override rates, pushback clusters, Guideline Health, Expiry inbox, Content Watch |
| Image check | Palette distance (CIE76 delta E) and headline contrast (WCAG AA), measured in the browser |

## Evaluation

- 94 labelled cases (43 are clean or "trap" drafts: negations, competitor quotes, idioms, old offers). The Round 2 engine scored 58.8% precision and 75.0% recall. The current engine scores 100% and 100%, with 0 false positives, re-checked on the shipped engine after adding Unverifiable claims.
- Attack lab: 14 of 14 adversarial drafts behave as expected.
- AI gate: 9 of 9 test proposals are classified as expected (accepted, or dropped with a reason).
- **Held-out set, 34 new drafts not used for tuning: 96.8% precision, 93.8% recall, F1 95.2%.** 31 of 34 drafts match exactly. The three misses are listed and left unfixed on purpose (`docs/heldout-eval.md`): "safest" is not caught as a superlative, one ad's call to action is arguable, and "Saving 20% of your salary" wrongly asks for a disclaimer.
- The 100% figure on the 94 development cases is optimistic, because the engine was tuned on them. Use the held-out figure.
- API checks: 14 malformed or edge-case requests (empty, wrong type, array, too long, bad date, missing fields) return clear 400 or 413 errors and never crash.
- Reports are in `docs/`.

## How it is built

- Next.js 16, TypeScript, Tailwind CSS, deployed on Vercel
- Rule, claim and visual engines are plain TypeScript and run in the browser. Drafts are not sent to a server, except the redacted text of an AI review
- `app/api/review` runs the AI tone review through the grounding gate. `app/api/review/check` is the full review API. `app/api/rulebook` extracts rules from an uploaded guideline

```
app/         home page, /app workspace, /dashboards, API routes
components/  marketing site; components/app = workspace views
lib/         engine.ts (rules, claims, verdict), grounding.ts (AI gate), ai.ts, reviewApi.ts,
             queue.ts, dashboard.ts, bundle.ts, extract.ts, redact.ts, attacks.ts
data/        brand.ts (rules, Claim Ledger, palette)
```

## Run locally

```
npm install
npm run dev
```

Open http://localhost:3000. For the live AI review, set these environment variables (any OpenAI-compatible API works):

| Variable | Purpose |
|---|---|
| `AI_API_KEY` | API key. Without it, the AI panel runs a clearly labelled scripted demo |
| `AI_BASE_URL` | Optional. Defaults to the OpenAI API |
| `AI_MODEL` | Optional. Defaults to `gpt-4o-mini` |
| `AI_TIMEOUT_MS` | Optional. Defaults to 12000 |

## Honest limits

- The queue and audit trail are stored per browser. A shared backend is next.
- There is no real sign-in. Roles are switched from a dropdown to demonstrate the approval flow.
- Logo presence and OCR on images are not built yet. Contrast is measured on the area the user selects.
- `/api/review/check` runs the deterministic checks only. The AI tone review is a separate call (`/api/review`), and the two are not combined into one response yet.
- Held-out accuracy is 96.8% precision and 93.8% recall on 34 drafts. That set is small.
- If the model's quota runs out, the AI panel falls back to the scripted demo and says so.

## Next steps

Shared database with real roles, OCR and logo checks, one combined review call (rules plus AI), fixes for the three held-out misses, and a larger independent evaluation set.
