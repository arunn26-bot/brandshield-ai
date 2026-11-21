# BrandShield — deterministic engine evaluation

Generated 2026-11-17 · 94 labelled cases · fixed demo date 2026-11-17

## Headline

| Engine | Precision | Recall | F1 | False positives | Missed rules |
|---|---:|---:|---:|---:|---:|
| Round 2 engine | 58.8% | 75.0% | 65.9% | 40 | 19 |
| Round 3 hardened engine | 100.0% | 100.0% | 100.0% | 0 | 0 |

Across 43 clean or "trap" drafts (negations, competitor quotes, idioms, historical offers):

- Round 2 engine false positives: **25**
- Round 3 engine false positives: **0**

## Per-rule results (Round 3)

| Rule | TP | FP | FN | Precision | Recall |
|---|---:|---:|---:|---:|---:|
| AD-01 | 1 | 0 | 0 | 100.0% | 100.0% |
| AD-02 | 1 | 0 | 0 | 100.0% | 100.0% |
| AD-03 | 1 | 0 | 0 | 100.0% | 100.0% |
| CLAIM-01 | 11 | 0 | 0 | 100.0% | 100.0% |
| CLAIM-02 | 11 | 0 | 0 | 100.0% | 100.0% |
| CLAIM-03 | 9 | 0 | 0 | 100.0% | 100.0% |
| CLAIM-04 | 2 | 0 | 0 | 100.0% | 100.0% |
| CLAIM-05 | 7 | 0 | 0 | 100.0% | 100.0% |
| DISC-01 | 8 | 0 | 0 | 100.0% | 100.0% |
| EMAIL-00 | 1 | 0 | 0 | 100.0% | 100.0% |
| EMAIL-01 | 1 | 0 | 0 | 100.0% | 100.0% |
| EMAIL-02 | 2 | 0 | 0 | 100.0% | 100.0% |
| EMAIL-03 | 1 | 0 | 0 | 100.0% | 100.0% |
| EMAIL-04 | 1 | 0 | 0 | 100.0% | 100.0% |
| HOMO-01 | 1 | 0 | 0 | 100.0% | 100.0% |
| HOMO-02 | 1 | 0 | 0 | 100.0% | 100.0% |
| PII-01 | 1 | 0 | 0 | 100.0% | 100.0% |
| PII-02 | 1 | 0 | 0 | 100.0% | 100.0% |
| PII-03 | 1 | 0 | 0 | 100.0% | 100.0% |
| PII-04 | 1 | 0 | 0 | 100.0% | 100.0% |
| PII-05 | 1 | 0 | 0 | 100.0% | 100.0% |
| TERM-01 | 5 | 0 | 0 | 100.0% | 100.0% |
| TERM-02 | 3 | 0 | 0 | 100.0% | 100.0% |
| VOICE-01 | 4 | 0 | 0 | 100.0% | 100.0% |

## Remaining mismatches (Round 3)

None.

## How to reproduce

```bash
cd round3
node scripts/eval.ts
```

The suite is a development set: it was written from the Round 2 sample drafts plus adversarial variants. A held-out set should be labelled before publishing these numbers.
