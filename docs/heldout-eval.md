# Held-out evaluation

34 new labelled drafts, written after the development set and **not used to tune the engine**.

| Measure | Result |
|---|---:|
| Cases | 34 |
| Drafts with exactly the expected rules | 31 of 34 |
| Precision | 96.8% |
| Recall | 93.8% |
| F1 | 95.2% |
| Clean or trap drafts with a false alarm | 1 of 8 |

For comparison, the 94-case development set scores 100% / 100%. That figure was optimistic: the engine was tuned on it. The held-out figure is the honest one.

## How the labels were made

Each draft was written to exercise one rule, or to be a trap that must stay clean (negations, competitor quotes, historical offers, numbers that are not claims). The expected rules were written from the rulebook definitions **before** the engine was run, and were not changed afterwards. The drafts and labels were written by an AI assistant (Claude) working with the project team, not by the engine's original author, and they are not a substitute for a larger independent set.

## Mismatches (left unfixed on purpose)

| Draft | Result | Why |
|---|---|---|
| h05 "RBI approved: PayNest is the safest way to pay." | Missed CLAIM-03 | "safest" is not in the superlative list. Regulator claim (CLAIM-04) was caught |
| h22 ad "PayNest: payments made simple / Pay anyone from one app." | Missed AD-03 | The engine treats "Pay anyone" as a call to action. The label is arguable: it is an imperative, not an explicit prompt such as "Download" or "Get" |
| h27 "Saving 20% of your salary is a good habit." | False positive DISC-01 | A percentage next to the word "saving" is read as a rate claim, so a disclaimer is demanded |

These are the next fixes. They were not patched in this round so the numbers stay honest.

## Reproduce

The cases are in `docs/heldout-cases.jsonl` (one JSON object per line: `format`, text fields, optional `today`, and `expect`, the list of rule ids). Run each draft through `runChecks` in `lib/engine.ts` (plus `formatChecks` in `lib/formats.ts` for email and ad) with the date 2026-11-21 and compare the set of rule ids with `expect`.

## The 34 cases

| Id | Draft | Expected rules | Result |
|---|---|---|---|
| h01 | Join thousands who say PayNest is the number one UPI app. | CLAIM-03 | ok |
| h02 | Your savings are 100% safe with PayNest. | CLAIM-02 | ok |
| h03 | Nest Save pays you 8% interest every year. | CLAIM-01, DISC-01 | ok |
| h04 | Get ₹250 cashback when you make your first UPI payment. | CLAIM-01 | ok |
| h05 | RBI approved: PayNest is the safest way to pay. | CLAIM-04, CLAIM-03 | missed CLAIM-03 |
| h06 | Open your PayNest bank account in two minutes. | TERM-02 | ok |
| h07 | Download Paynest and start saving today!!! | TERM-01, VOICE-01 | ok |
| h08 | WOW!!! Amazing news, you NEED this app right now!!! | VOICE-01 | ok |
| h09 | Celebrate with Diwali double cashback, ends soon. | CLAIM-05 | ok |
| h10 | Write to us at neha.verma@example.com for help. | PII-01 | ok |
| h11 | Call us on 9123456780 to claim your reward. | PII-02 | ok |
| h12 | Verify with Aadhaar 2345 6789 0123 before you start. | PII-03 | ok |
| h13 | Keep your PAN FGHIJ5678K ready. | PII-04 | ok |
| h14 | We charged card 5500 0000 0000 0004 by mistake. | PII-05 | ok |
| h15 | Why PayNest is easy: PаyNest keeps payments simple. | HOMO-01 | ok |
| h16 | Say hello to Pay‍Nest today. | HOMO-02 | ok |
| h17 | [email] subject: 'SPECIAL OFFER JUST FOR YOU TODAY ONLY' / body: 'Get up to ₹100 cashback on yo | EMAIL-03, EMAIL-04, EMAIL-02 | ok |
| h18 | [email] subject: 'Your monthly PayNest summary' / body: 'Hi Priya,\n\nHere is your summary for  | none | ok |
| h19 | [email] subject: '' / body: 'Hi Sam,\n\nThanks for joining.\n\nTo stop receiving these emails,  | EMAIL-00 | ok |
| h20 | [email] subject: 'A lot of good things are waiting for you inside your PayNest app today' / bod | EMAIL-01 | ok |
| h21 | [ad] PayNest turns every single UPI payment into something quick and calm / Pay friends, pay sh | AD-01 | ok |
| h22 | [ad] PayNest: payments made simple / Pay anyone from one app. | AD-03 | missed AD-03 |
| h23 | We do not promise guaranteed returns. | none | ok |
| h24 | A rival claims it is the fastest app. We make no such claim. | none | ok |
| h25 | Our partner banks are regulated by the RBI. | none | ok |
| h26 | Last year our Diwali cashback was a favourite with families. | none | ok |
| h27 | Saving 20% of your salary is a good habit. | none | false positive DISC-01 |
| h28 | Our helpline answers within 5 minutes. | none | ok |
| h29 | Add 2 members to your family plan. | none | ok |
| h30 | Over 10 lakh users trust PayNest. | CLAIM-06 | ok |
| h31 | PayNest checkout is 4x faster than cash. | CLAIM-06 | ok |
| h32 | Get 40% more rewards than other apps. | CLAIM-06 | ok |
| h33 | Sabse best app hai PayNest. | CLAIM-03 | ok |
| h34 | Paynest ka guaranteed return, 100% safe. | TERM-01, CLAIM-02 | ok |
