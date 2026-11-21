"use client";

import { PALETTE, RULE_META } from "@/data/brand";
import type { Fact, Rule } from "@/lib/types";
import type { PaletteColor } from "@/lib/visual";
import RulebookPanel from "@/components/RulebookPanel";
import Icon from "@/components/Icon";

const DAY = 86400000;
const SEV: Record<string, string> = { high: "text-red-300", medium: "text-amber-300", low: "text-emerald-300" };
const SEV_DOT: Record<string, string> = { high: "bg-red-400", medium: "bg-amber-400", low: "bg-emerald-400" };

export default function BrandKit({
  facts, today, onRules, onPalette,
}: {
  facts: Fact[];
  today: Date;
  onRules: (rules: Rule[]) => void;
  onPalette: (colors: PaletteColor[]) => void;
}) {
  const rules = Object.entries(RULE_META).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      {/* Rulebook */}
      <section className="rounded-3xl border border-white/10 bg-night-2 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-xl">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-mint/10 text-mint">
              <Icon name="kit" className="h-4 w-4" />
            </span>
            Rulebook · every rule cites its page
          </h2>
          <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-cream/60">{rules.length} rules</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.14em] text-cream/40">
                <th className="py-2 pr-3 font-medium">Rule</th>
                <th className="py-2 pr-3 font-medium">What it checks</th>
                <th className="py-2 pr-3 font-medium">Category</th>
                <th className="py-2 pr-3 font-medium">Severity</th>
                <th className="py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rules.map(([id, meta]) => (
                <tr key={id} className="text-cream/80">
                  <td className="py-2.5 pr-3 font-mono text-xs text-mint">{id}</td>
                  <td className="py-2.5 pr-3">{meta.title}</td>
                  <td className="py-2.5 pr-3 text-xs text-cream/55">{meta.category}</td>
                  <td className={`py-2.5 pr-3 text-xs font-medium ${SEV[meta.severity]}`}>
                    <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${SEV_DOT[meta.severity]}`} />
                    {meta.severity}
                  </td>
                  <td className="py-2.5 text-xs text-cream/55">{meta.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-cream/40">
          TONE-02 and MSG-01 are open to the AI reviewer only; every other rule runs deterministically in this browser.
        </p>
      </section>

      {/* Claim ledger + palette */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-night-2 p-5">
          <h2 className="flex items-center gap-2 font-display text-xl">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-mint/10 text-mint">
              <Icon name="ledger" className="h-4 w-4" />
            </span>
            Claim Ledger · the only approved numbers
          </h2>
          <ul className="mt-4 space-y-2.5">
            {facts.map((f) => {
              const days = Math.ceil((new Date(f.validTo + "T23:59:59").getTime() - today.getTime()) / DAY);
              const expired = days < 0;
              return (
                <li key={f.id} className="rounded-2xl bg-night p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs text-mint">{f.id}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-medium ${expired ? "bg-red-400/10 text-red-300" : days <= 30 ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}>
                      {expired ? "expired" : `${days} days left`}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-cream">{f.topic}</div>
                  <div className="mt-1 text-xs text-cream/55">
                    Approved wording: “{f.approved}”{f.value !== null && ` · value ${f.value}${f.unit ?? ""}`} · owner {f.owner} · valid to {f.validTo}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-night-2 p-5">
          <h2 className="flex items-center gap-2 font-display text-xl">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-mint/10 text-mint">
              <Icon name="kit" className="h-4 w-4" />
            </span>
            Palette · checked against creatives
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {PALETTE.map((c) => (
              <div key={c.hex} className="flex items-center gap-3 rounded-2xl bg-night p-3">
                <span className="h-9 w-9 shrink-0 rounded-xl ring-1 ring-white/15" style={{ backgroundColor: c.hex }} />
                <div className="min-w-0">
                  <div className="truncate text-sm text-cream">{c.name}</div>
                  <div className="font-mono text-[11px] text-cream/50">{c.hex}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-4 text-cream/40">
            Off-palette colours and low headline contrast are flagged on image creatives in the New draft tab.
          </p>
        </section>
      </div>

      {/* Guideline upload */}
      <div className="rounded-3xl bg-cream text-ink">
        <RulebookPanel onRules={onRules} onPalette={onPalette} />
      </div>
    </div>
  );
}
