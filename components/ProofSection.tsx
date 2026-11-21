import Image from "next/image";
import Reveal from "./Reveal";

export default function ProofSection() {
  return (
    <section id="proof" className="scroll-mt-20 bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-start gap-10 md:grid-cols-[1.15fr_1fr]">
          <Reveal>
            <div className="overflow-hidden rounded-3xl border border-line">
              <Image
                src="/images/proof-desk.png"
                alt="Illustration of a brand review desk: a marked-up draft, a desk lamp and a seal stamp pressing a decision onto the record"
                width={1536}
                height={1024}
                className="w-full object-cover"
              />
            </div>
            <p className="mt-3 text-xs text-muted">
              Every decision starts from quoted evidence — the draft, the rule, the fact.
            </p>
          </Reveal>

          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand">Why it holds up</div>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">Checked in the open, sealed on the record</h2>
            <p className="mt-5 leading-7 text-muted">
              An assay office weighs metal in full view before any mark is struck. BrandShield works the same way.
              Every finding quotes the draft and cites the rule or ledger fact behind it — no finding appears without
              evidence. A named reviewer makes the call, and that decision is sealed into a hash-chained trail that
              anyone can verify, offline, without trusting us.
            </p>
            <Reveal delay={150}>
              <div className="mt-8 overflow-hidden rounded-3xl border border-line">
                <Image
                  src="/images/proof-trail.png"
                  alt="Illustration of a chain of sealed record cards linked together, the hash-chained approval trail"
                  width={1024}
                  height={768}
                  className="w-full object-cover"
                />
              </div>
              <p className="mt-3 text-xs text-muted">
                The approval trail is a chain of sealed entries — tamper with one and verification fails.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
