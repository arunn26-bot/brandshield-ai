# AI grounding gate — evaluation

Date: 2026-11-17
Draft: "Paynest is a simple app for everyday life. Get up to ₹100 cashback on your first UPI payment."

## Result

- Deterministic findings on this draft: 1 (TERM-01)
- Model proposals: 9
- Accepted and shown: **2**
- Dropped with a reason: **7**
- Every proposal classified as expected: **yes**

| # | Quote | Rule | Expected | Actual | OK |
|---:|---|---|---|---|---|
| 1 | a simple app for everyday life | MSG-01 | accepted | accepted | yes |
| 2 | Get up to ₹100 cashback on your first UPI paymen | TONE-02 | accepted | accepted | yes |
| 3 | everyday life | MSG-01 | duplicate | duplicate | yes |
| 4 | Paynest | TERM-01 | duplicate | duplicate | yes |
| 5 | ₹100 cashback | CLAIM-01 | disallowed_category | disallowed_category | yes |
| 6 | the best payments app in India | TONE-02 | quote_not_found | quote_not_found | yes |
| 7 | Get up to ₹100 cashback | MSG-01 | invented_number | invented_number | yes |
| 8 | a simple app | TONE-NOT-IN-RULEBOOK | unknown_rule | unknown_rule | yes |
| 9 | 123 | MSG-01 | bad_shape | bad_shape | yes |

## Privacy round-trip

- Original PII: priya.sharma@example.com, 9876543210, 4111 1111 1111 1111
- Redaction summary: 1 card, 1 email, 1 phone (3 items)
- Model-visible text: `Contact {{EMAIL_2}} or call {{PHONE_3}} about your card {{CARD_1}}.`
- Token quoted by model restored in the browser: yes

## Simulated model (no key configured)

- Proposals returned: 4
- Accepted after grounding: 1
- Dropped: disallowed_category, quote_not_found, unknown_rule

## Model client

- Canned OpenAI-compatible response parsed: yes

## Claim for the report

> No model output reaches the interface without a verbatim quote from the draft and a rule id that exists in the rulebook. Unsupported claims, prices, rates, dates and PII are outside the model's remit entirely.
