import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import ProofSection from "@/components/ProofSection";
import LiveSections from "@/components/LiveSections";

const TRUST = [
  ["Deterministic checks run in your browser", "Rules, terms, facts and expiry are checked in code. The optional AI tone review sends only a redacted draft, on request, and its findings are suggestions."],
  ["People decide", "Nothing is applied or published automatically. A named reviewer records every decision."],
  ["Tamper-evident", "The approval trail is hash-chained, so edits to history are detectable â€” and exportable for offline verification."],
];

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <HowItWorks />
      <ProofSection />
      <LiveSections />

      <section id="trust" className="relative overflow-hidden bg-night-2 text-cream">
        <div aria-hidden className="pointer-events-none absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-mint/[0.06] blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full bg-gold/[0.05] blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-mint">Trust Â· evidence and limits</div>
              <h2 className="mt-3 font-display text-5xl md:text-6xl">Built to be trusted</h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-cream/50">
              What the engine measures, what it does not, and where a person still has to decide.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["94", "labelled drafts"],
              ["43", "trap drafts"],
              ["0", "false alarms on traps"],
              ["100%", "recall on violations"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-cream/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-4">
                <div className="font-display text-4xl leading-none text-mint">{value}</div>
                <div className="mt-2 text-[11px] font-medium uppercase tracking-wide text-cream/50">{label}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-cream/45">
            Measured on a fixed 94-case development set on 2026-11-17. A held-out set has not been labelled yet, and
            the site says so rather than turning a development number into a promise.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {TRUST.map(([t, d]) => (
              <div key={t} className="rounded-3xl border border-white/[0.06] bg-night p-6">
                <div className="text-lg font-medium text-mint">{t}</div>
                <p className="mt-3 text-sm leading-6 text-cream/70">{d}</p>
              </div>
            ))}
          </div>
          <details className="group mt-6 rounded-3xl bg-night p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-cream">
              <span>Known limits, stated plainly</span>
              <span className="text-lg leading-none text-cream/40 transition group-open:rotate-45">+</span>
            </summary>
            <ul className="mt-4 grid gap-2 text-sm text-cream/70 md:grid-cols-2">
              <li>No OCR or logo detection. Image checks cover palette and contrast, not a logo in the pixels.</li>
              <li>Guideline extraction is heuristic and always needs a person to confirm each proposal.</li>
              <li>The 94-case evaluation is a development set, not a held-out benchmark.</li>
              <li>Tone review is optional. Without an API key the demo runs a fixed simulation, labelled as such.</li>
            </ul>
          </details>
          <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-cream/10 pt-8 text-sm text-cream/60">
            <span>BrandShield Â· built by Arun Sharma Â· CodeNova India 2026 Â· team sharmaarun24089</span>
            <span className="flex flex-wrap items-center gap-3">
              <span>PayNest is a fictional brand used for the demo.</span>
              <a
                href="https://github.com/arunn26-bot/brandshield-ai"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-cream/30 underline-offset-4 hover:text-cream"
              >
                Source on GitHub â†—
              </a>
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
