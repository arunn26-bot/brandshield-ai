"use client";

import { useEffect, useRef, useState } from "react";
import { PALETTE } from "@/data/brand";
import { Finding } from "@/lib/types";
import { sha256 } from "@/lib/audit";
import { Contrast, PaletteColor, Swatch, dominantColors, regionContrast, visualFindings } from "@/lib/visual";

type Region = { x: number; y: number; w: number; h: number };
const MAX_W = 640;

export default function VisualCheck({
  onResult, palette = PALETTE,
}: {
  onResult: (r: { label: string; findings: Finding[] } | null) => void;
  palette?: PaletteColor[];
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState("");
  const [version, setVersion] = useState(0);
  const [region, setRegion] = useState<Region | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [swatches, setSwatches] = useState<Swatch[]>([]);
  const [contrast, setContrast] = useState<Contrast | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  function pos(e: React.PointerEvent) {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return {
      x: Math.min(c.width, Math.max(0, ((e.clientX - r.left) * c.width) / r.width)),
      y: Math.min(c.height, Math.max(0, ((e.clientY - r.top) * c.height) / r.height)),
    };
  }

  function sized(w: number, h: number) {
    const c = ref.current!;
    c.width = w; c.height = h;
    setSize({ w, h });
    return c.getContext("2d")!;
  }

  function loadFile(file: File) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = Math.min(MAX_W, img.width);
      const h = Math.round((img.height * w) / img.width);
      sized(w, h).drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      setName(file.name);
      setRegion(null);
      setVersion((v) => v + 1);
    };
    img.src = url;
  }

  function sample(kind: "bad" | "good") {
    const ctx = sized(640, 360);
    const bg = kind === "bad" ? "#FF5FA2" : "#0B1816";
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 640, 360);
    ctx.fillStyle = kind === "bad" ? "#F3EFE4" : "#0F766E";
    ctx.beginPath(); ctx.roundRect(370, 130, 220, 170, 28); ctx.fill();
    ctx.fillStyle = kind === "bad" ? "#FFFFFF" : "#E6C364";
    ctx.beginPath(); ctx.arc(480, 215, 30, 0, Math.PI * 2); ctx.fill();
    ctx.font = "bold 44px sans-serif";
    ctx.fillStyle = kind === "bad" ? "#FFFFFF" : "#5EEAD4";
    const text = "Pay smarter. Save more.";
    ctx.fillText(text, 40, 90);
    const tw = ctx.measureText(text).width;
    setName(kind === "bad" ? "paynest-diwali-offer.png" : "paynest-launch.png");
    setRegion({ x: 28, y: 44, w: tw + 24, h: 66 });
    setVersion((v) => v + 1);
  }

  // Analyse whenever the image or the selected area changes.
  useEffect(() => {
    const c = ref.current;
    if (!c || !version) return;
    const ctx = c.getContext("2d")!;
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const sw = dominantColors(data, palette);
    const ct = region && region.w > 8 && region.h > 8 ? regionContrast(data, c.width, c.height, region) : null;
    setSwatches(sw);
    setContrast(ct);
    const fingerprint = Array.from(data).filter((_, i) => i % 97 === 0).join(",");
    sha256(fingerprint).then((h) =>
      onResult({
        label: `Image creative: ${name} (${c.width}×${c.height}) · ${h.slice(0, 12)}`,
        findings: visualFindings(sw, ct, palette),
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, region, palette]);

  const hasImage = version > 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <label className="cursor-pointer rounded-full bg-ink px-4 py-1.5 font-medium text-white hover:bg-brand">
          Upload image
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
        </label>
        <span className="text-muted">or try:</span>
        <button onClick={() => sample("bad")} className="rounded-full bg-paper px-3 py-1 hover:bg-line">Off-brand sample</button>
        <button onClick={() => sample("good")} className="rounded-full bg-paper px-3 py-1 hover:bg-line">On-brand sample</button>
      </div>

      <div className={`relative ${hasImage ? "" : "hidden"}`}>
        <canvas
          ref={ref}
          className="w-full cursor-crosshair touch-none rounded-2xl border border-line"
          onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); const p = pos(e); setDrag(p); setRegion({ x: p.x, y: p.y, w: 0, h: 0 }); }}
          onPointerMove={(e) => {
            if (!drag) return;
            const p = pos(e);
            setRegion({ x: Math.min(drag.x, p.x), y: Math.min(drag.y, p.y), w: Math.abs(p.x - drag.x), h: Math.abs(p.y - drag.y) });
          }}
          onPointerUp={() => setDrag(null)}
        />
        {region && region.w > 4 && size.w > 0 && (
          <div
            className="pointer-events-none absolute border-2 border-dashed border-white mix-blend-difference"
            style={{ left: `${(region.x / size.w) * 100}%`, top: `${(region.y / size.h) * 100}%`, width: `${(region.w / size.w) * 100}%`, height: `${(region.h / size.h) * 100}%` }}
          />
        )}
      </div>

      {!hasImage && (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-line bg-paper text-center text-sm text-muted">
          Upload a creative, or load a sample.<br />The image never leaves your browser.
        </div>
      )}

      {hasImage && (
        <div className="mt-4 space-y-4 rounded-2xl bg-paper p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted">
              {contrast
                ? `Headline contrast: ${contrast.ratio.toFixed(1)}:1 (${contrast.fg} on ${contrast.bg})`
                : region && region.w > 8
                  ? "No text found in the selected area"
                  : "Drag over the headline to check its contrast"}
            </span>
            {region && <button onClick={() => setRegion(null)} className="shrink-0 text-xs underline">Clear area</button>}
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Colours found</div>
            <ul className="space-y-1.5">
              {swatches.slice(0, 5).map((s) => (
                <li key={s.hex} className="flex items-center gap-3">
                  <span className="h-5 w-5 shrink-0 rounded border border-line" style={{ background: s.hex }} />
                  <span className="w-20 font-mono text-xs">{s.hex}</span>
                  <span className="w-10 text-xs text-muted">{s.pct.toFixed(0)}%</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${s.de <= 18 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {s.de <= 18 ? `on palette · ${s.nearest.name}` : `ΔE ${s.de.toFixed(0)} off · ${s.nearest.name}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Approved palette</div>
            <div className="flex flex-wrap gap-2">
              {palette.map((p) => (
                <span key={p.hex} className="flex items-center gap-1.5 rounded-full border border-line bg-white py-0.5 pl-1 pr-2 text-xs">
                  <span className="h-4 w-4 rounded-full border border-line" style={{ background: p.hex }} />
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
