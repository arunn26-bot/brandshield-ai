import Image from "next/image";
import Icon from "./Icon";
import Reveal from "./Reveal";

const STEPS = [
  { n: "01", i: "scan", t: "Scan", d: "Paste or load a draft. Rules, terms and tone are checked as you type." },
  { n: "02", i: "explain", t: "Explain", d: "Each issue quotes the draft and cites the rule or approved fact behind it." },
  { n: "03", i: "fix", t: "Fix", d: "A minimal correction replaces only the offending words. You choose what to apply." },
  { n: "04", i: "decide", t: "Decide", d: "A reviewer approves, requests changes or rejects. Every decision is recorded." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-0 bg-night-2 text-cream">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-mint">Process · four steps</div>
            <h2 className="mt-3 font-display text-5xl md:text-7xl">From draft to decision in four steps</h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-cream/50">
            Every step is visible. Nothing is auto-published, and no finding appears without a rule behind it.
          </p>
        </div>

        <Reveal className="relative mt-10 overflow-hidden rounded-3xl border border-white/10">
          <Image
            src="/images/how-it-works.png"
            alt="Illustration of the BrandShield pipeline: a draft moves through scan, cited findings, a minimal fix, and a recorded human decision"
            width={1536}
            height={1024}
            className="w-full object-cover"
            priority={false}
          />
        </Reveal>
        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-cream/10 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120} className="bg-night p-8 transition hover:bg-night-2">
              <div className="flex items-start justify-between">
                <div className="font-display text-6xl text-mint">{s.n}</div>
                <Icon name={s.i} className="h-12 w-12 text-cream/70" />
              </div>
              <div className="mt-6 text-2xl font-medium">{s.t}</div>
              <p className="mt-3 leading-7 text-cream/70">{s.d}</p>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-cream/10 pt-6 text-[11px] uppercase tracking-[0.14em] text-cream/40">
          <span>No auto-publish</span>
          <span>Named reviewers</span>
          <span>Tamper-evident trail</span>
          <span className="ml-auto normal-case tracking-normal text-cream/35">Rulebook v1.1 · fixed demo date 17 Nov 2026</span>
        </div>
      </div>
    </section>
  );
}
