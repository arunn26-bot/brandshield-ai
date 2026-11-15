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
        <h2 className="font-display text-5xl md:text-7xl">From draft to decision in four steps</h2>
        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl bg-cream/10 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120} className="bg-night p-8">
              <div className="flex items-start justify-between">
                <div className="font-display text-6xl text-mint">{s.n}</div>
                <Icon name={s.i} className="h-12 w-12 text-cream/70" />
              </div>
              <div className="mt-6 text-2xl font-medium">{s.t}</div>
              <p className="mt-3 leading-7 text-cream/70">{s.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
