import { Fact, Rule } from "@/lib/types";

export const BRAND = {
  name: "PayNest",
  tagline: "UPI payments and savings for India (fictional brand for demo)",
  rulebookVersion: "v1.0",
  audience: "Salaried and student users, 20-35, India",
};

export const FACTS: Fact[] = [
  {
    id: "F-101",
    topic: "First-payment cashback",
    topicPattern: /cash\s?back|कैशबैक/i,
    valuePattern: /(?:₹|rs\.?\s?|rupees\s?)(\d[\d,]*)|(\d[\d,]*)\s?(?:₹|rs\b|rupees)/i,
    value: 100,
    approved: "up to ₹100 cashback",
    validTo: "2026-12-31",
    owner: "Growth",
  },
  {
    id: "F-102",
    topic: "Nest Save interest rate",
    topicPattern: /interest|returns?|ब्याज|savings? rate/i,
    valuePattern: /(\d+(?:\.\d+)?)\s?%/,
    value: 6.5,
    approved: "6.5% p.a. interest*",
    validTo: "2026-12-31",
    owner: "Treasury",
    disclaimer: "*Rate as of Nov 2026. Terms apply.",
  },
  {
    id: "F-104",
    topic: "Diwali double cashback offer",
    topicPattern: /(?:diwali|दिवाली|दीवाली)(?:\s+(?:double|extra|bonus))?(?:\s+(?:cashback|offer|कैशबैक))?/i,
    valuePattern: /$^/,
    value: null,
    approved: "our latest offers",
    validTo: "2026-11-10",
    owner: "Growth",
  },
];

export const RULES: Rule[] = [
  {
    id: "CLAIM-02", category: "Claim", severity: "high",
    pattern: /guaranteed returns?|risk[- ]free|100\s?% safe|assured returns?|गारंटीड रिटर्न/gi,
    title: "Prohibited financial promise",
    why: "PayNest never promises guaranteed or risk-free returns. Savings rates can change.",
    fix: "6.5% p.a. interest*",
    source: "Brand Book p.14 §5.1",
  },
  {
    id: "CLAIM-03", category: "Claim", severity: "high",
    pattern: /\b(?:the )?(?:best|number one)\b(?: [a-z]+){0,3}? in india|\b(?:the )?(?:best|number one)\b(?: [a-z]+)?|#1|सबसे\s?(?:बेहतर|अच्छा)|sabse best/gi,
    title: "Unsupported superlative",
    why: "Superlatives need an approved fact behind them. None exists for PayNest.",
    fix: "built for simple, fast payments",
    source: "Brand Book p.15 §5.3",
  },
  {
    id: "CLAIM-04", category: "Claim", severity: "high",
    pattern: /rbi[- ](?:approved|certified)/gi,
    title: "Regulator endorsement claim",
    why: "PayNest may not imply regulator approval. Use the approved partner-bank line instead.",
    fix: "built with RBI-regulated partner banks",
    source: "Brand Book p.15 §5.4",
  },
  {
    id: "VOICE-01", category: "Tone", severity: "medium",
    pattern: /\bOMG\b|\bomg\b|!{2,}|\bhurry\b|\blast chance\b|\bmust[- ]have\b/g,
    title: "Hype in the tone",
    why: "PayNest speaks calmly and clearly. Avoid shouting, stacked exclamations and pressure.",
    fix: null,
    source: "Brand Book p.6 §2.2",
  },
  {
    id: "TERM-01", category: "Terminology", severity: "low",
    pattern: /\bPay Nest\b|\bPay nest\b|\bpay nest\b|\bPaynest\b|\bpaynest\b|\bPAYNEST\b/g,
    title: "Use the product name",
    why: "The name is always written PayNest, one word, capital P and N.",
    fix: "PayNest",
    source: "Brand Book p.9 §4.1",
  },
  {
    id: "TERM-02", category: "Terminology", severity: "low",
    pattern: /\bsavings account\b|\bbank account\b/gi,
    title: "Say Nest Save",
    why: "PayNest does not offer a bank account. Call the product Nest Save.",
    fix: "Nest Save",
    source: "Brand Book p.10 §4.2",
  },
];
