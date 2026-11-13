import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Workbench from "@/components/Workbench";
import Features from "@/components/Features";

const TRUST = [
  ["Checks run in your browser", "Rules, terms, facts and expiry are checked in code. Your draft is never sent to a server."],
  ["People decide", "Nothing is applied or published automatically. A named reviewer records every decision."],
  ["Evidence first", "A finding without a rule or an approved fact behind it is not shown."],
  ["Tamper-evident", "The approval trail is hash-chained, so edits to history are detectable."],
];

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <HowItWorks />
      <div className="bg-cream">
        <Workbench />
      </div>
      <Features />

      <section id="trust" className="bg-night text-cream">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="font-display text-5xl md:text-7xl">Built to be trusted</h2>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {TRUST.map(([t, d]) => (
              <div key={t} className="rounded-3xl bg-night-2 p-8">
                <div className="text-xl font-medium text-mint">{t}</div>
                <p className="mt-3 leading-7 text-cream/75">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-20 flex flex-wrap items-center justify-between gap-6 border-t border-cream/10 pt-8 text-sm text-cream/60">
            <span>BrandShield · built by Arun Sharma · CodeNova India 2026 · team sharmaarun24089</span>
            <span>PayNest is a fictional brand used for the demo.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
