# BrandShield AI

**Check brand content before it ships.** BrandShield checks captions, emails, ads and image creatives against a brand's approved rules, facts and palette. Every finding quotes the draft, names the rule it breaks, cites its source and suggests a fix. A person makes the final call.

- **Live demo:** https://brandshield-ai-mauve.vercel.app/  (no sign-in)
- **Built by:** Arun Sharma, team `sharmaarun24089`, CodeNova India 2026
- **Problem statement:** Brand governance, by Inkloom AI
- **Demo brand:** PayNest, a fictional Indian UPI and savings app

## What it does

| Area | What works |
|---|---|
| Text checks | Instagram caption, Email (subject + body) and Ad copy (headline + description), checked live as you type |
| Rules | Banned financial promises, unsupported superlatives, regulator claims, hype in tone, product naming, missing disclaimers |
| Claim Ledger | Approved facts with owner and valid-to date. Wrong numbers and expired offers are flagged |
| Format rules | Email: subject length, all-caps subject, greeting, unsubscribe line. Ads: headline and description limits, call to action |
| Hinglish | Hindi and romanised patterns such as "सबसे बेहतर" and "sabse best" |
| Image check | Brand palette distance (ΔE) and headline contrast (WCAG AA), measured in the browser |
| Fixes | One click applies a minimal fix using approved wording. Visual and format issues come with a suggestion |
| Human approval | Approve, Request changes, Reject. High-severity issues block normal approval; only a Compliance Lead can override with a written comment |
| Approval trail | Each decision stores the content's SHA-256 and is hash-chained to the one before. Verify and tamper demo included |
| **Content Watch** | Approved content has a **shelf life**. Move the date forward or edit the Claim Ledger and see what goes stale |

## Try it in two minutes

1. Open the live link, go to **Try it**, load **Hype launch** and read the findings.
2. Press **Fix all**, then approve the clean draft as **Rohan**.
3. Load **Hype launch** again, approve as **Ananya** with a written override, and check the **Approval trail**. Press **Verify trail**, then **Simulate tampering**, then **Verify trail** again.
4. Open the **Image creative** tab, load **Off-brand sample** and drag a box over the headline.
5. Open **Content Watch** and press **Jump to next expiry**.

## How it is built

- Next.js 16, TypeScript, Tailwind CSS, deployed on Vercel
- The rule, claim and visual engines are plain TypeScript and run **in the browser**. Drafts and images are never sent to a server
- The approval trail uses the Web Crypto API (SHA-256) and is stored in the browser

```
app/         page and layout
components/  Workbench, VisualCheck, ApprovalPanel, ContentWatch, Hero ...
lib/         engine.ts (rules and claims), formats.ts (email and ad rules),
             visual.ts (palette and contrast), audit.ts (hash-chained trail)
data/        brand.ts (rules, Claim Ledger, palette)
```

## Run locally

```
npm install
npm run dev
```

Open http://localhost:3000.

## Honest limits

- Checks are deterministic rules and a Claim Ledger, not a language model. That keeps results explainable and repeatable
- Logo presence is not checked yet. Contrast is measured on the area the user selects
- The approval trail is stored per browser. A shared backend comes later

## Round 3 plan

1. **AI tone and messaging review** where every AI finding must quote real text and cite a real rule, or it is dropped
2. **Guideline upload and file review:** extract rules from a brand-guideline PDF (a person confirms them) and review PDF and DOCX drafts
3. **Governance dashboard, review API and evaluation report:** violation trends, a `/review` endpoint for AI writing tools, and measured precision and recall

*PayNest is a fictional brand used for the demo.*
