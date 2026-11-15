import { Finding } from "./types";

export interface PaletteColor { name: string; hex: string }
export interface Swatch { hex: string; pct: number; nearest: PaletteColor; de: number }
export interface Contrast { ratio: number; fg: string; bg: string }

type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function toHex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function lin(c: number) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
export function luminance([r, g, b]: RGB) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
export function contrastRatio(a: RGB, b: RGB) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function lab([r, g, b]: RGB): RGB {
  const R = lin(r), G = lin(g), B = lin(b);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
/** CIE76 colour distance. Around 2 is barely visible, above ~18 is clearly a different colour. */
export function deltaE(a: RGB, b: RGB) {
  const A = lab(a), B = lab(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
}

/** Dominant colours by coverage, with nearby shades merged. */
export function dominantColors(data: ArrayLike<number>, palette: PaletteColor[], minPct = 3): Swatch[] {
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++; e.r += r; e.g += g; e.b += b;
    buckets.set(key, e);
    total++;
  }
  if (!total) return [];
  const list = Array.from(buckets.values())
    .map((v) => ({ n: v.n, rgb: [v.r / v.n, v.g / v.n, v.b / v.n] as RGB }))
    .sort((a, b) => b.n - a.n);
  const merged: { n: number; rgb: RGB }[] = [];
  for (const it of list) {
    const hit = merged.find((m) => deltaE(m.rgb, it.rgb) < 10);
    if (hit) {
      const n = hit.n + it.n;
      hit.rgb = hit.rgb.map((v, i) => (v * hit.n + it.rgb[i] * it.n) / n) as RGB;
      hit.n = n;
    } else merged.push({ ...it });
  }
  return merged
    .sort((a, b) => b.n - a.n)
    .map((m) => {
      let best = palette[0], bd = Infinity;
      for (const p of palette) {
        const d = deltaE(m.rgb, hexToRgb(p.hex));
        if (d < bd) { bd = d; best = p; }
      }
      return { hex: toHex(m.rgb), pct: (m.n / total) * 100, nearest: best, de: bd };
    })
    .filter((s) => s.pct >= minPct);
}

/** Text vs background colour inside a user-selected area (two-colour clustering). */
export function regionContrast(
  data: ArrayLike<number>, width: number, height: number,
  r: { x: number; y: number; w: number; h: number }
): Contrast | null {
  const px: RGB[] = [];
  const x0 = Math.max(0, Math.floor(r.x)), y0 = Math.max(0, Math.floor(r.y));
  const x1 = Math.min(width, Math.ceil(r.x + r.w)), y1 = Math.min(height, Math.ceil(r.y + r.h));
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] >= 128) px.push([data[i], data[i + 1], data[i + 2]]);
    }
  if (px.length < 30) return null;
  let lo = px[0], hi = px[0];
  for (const p of px) { if (luminance(p) < luminance(lo)) lo = p; if (luminance(p) > luminance(hi)) hi = p; }
  let c: RGB[] = [lo, hi];
  let count = [0, 0];
  for (let it = 0; it < 6; it++) {
    const sum = [[0, 0, 0], [0, 0, 0]]; count = [0, 0];
    for (const p of px) {
      const d0 = (p[0] - c[0][0]) ** 2 + (p[1] - c[0][1]) ** 2 + (p[2] - c[0][2]) ** 2;
      const d1 = (p[0] - c[1][0]) ** 2 + (p[1] - c[1][1]) ** 2 + (p[2] - c[1][2]) ** 2;
      const k = d0 <= d1 ? 0 : 1;
      count[k]++; sum[k][0] += p[0]; sum[k][1] += p[1]; sum[k][2] += p[2];
    }
    c = c.map((old, k) => (count[k] ? (sum[k].map((v) => v / count[k]) as RGB) : old));
  }
  const small = count[0] <= count[1] ? 0 : 1;
  if (count[small] / px.length < 0.02) return null; // looks like a flat colour, no text found
  const fg = c[small], bg = c[1 - small];
  return { ratio: contrastRatio(fg, bg), fg: toHex(fg), bg: toHex(bg) };
}

function bestText(bg: RGB, palette: PaletteColor[]) {
  const score = (list: PaletteColor[]) =>
    list
      .map((p) => ({ ...p, r: contrastRatio(hexToRgb(p.hex), bg) }))
      .filter((p) => p.r >= 4.5)
      .sort((a, b) => b.r - a.r)[0];
  // Prefer a brand colour; fall back to black only if no brand colour passes.
  return score(palette) ?? score([{ name: "Black", hex: "#000000" }]);
}

export function visualFindings(swatches: Swatch[], contrast: Contrast | null, palette: PaletteColor[]): Finding[] {
  const out: Omit<Finding, "id">[] = [];
  for (const s of swatches) {
    if (s.pct < 8 || s.de <= 18) continue;
    out.push({
      ruleId: "VIS-01", category: "Visual", severity: s.pct >= 20 ? "high" : "medium",
      title: "Off-palette colour",
      why: `${s.hex} covers ${s.pct.toFixed(0)}% of the creative and is ΔE ${s.de.toFixed(0)} from the nearest approved colour (${s.nearest.name} ${s.nearest.hex}).`,
      start: 0, end: 0, quote: `${s.hex} · ${s.pct.toFixed(0)}% of the creative`,
      fix: `Use ${s.nearest.name} ${s.nearest.hex}`, source: "Brand Book p.20 §7.1 · Colour palette", manual: true,
    });
  }
  if (contrast && contrast.ratio < 4.5) {
    const alt = bestText(hexToRgb(contrast.bg), palette);
    out.push({
      ruleId: "VIS-02", category: "Visual", severity: contrast.ratio < 3 ? "high" : "medium",
      title: "Low headline contrast",
      why: `Text ${contrast.fg} on ${contrast.bg} has a contrast of ${contrast.ratio.toFixed(1)}:1. WCAG AA needs at least 4.5:1.`,
      start: 0, end: 0, quote: `${contrast.fg} on ${contrast.bg} · ${contrast.ratio.toFixed(1)}:1`,
      fix: alt ? `Use ${alt.name} ${alt.hex} text (${alt.r.toFixed(1)}:1)` : "Change the text or background colour",
      source: "Brand Book p.21 §7.4 · WCAG 2.1 AA", manual: true,
    });
  }
  const order = { high: 0, medium: 1, low: 2 } as const;
  out.sort((a, b) => order[a.severity] - order[b.severity]);
  return out.map((f, i) => ({ ...f, id: String(i + 1) }));
}
