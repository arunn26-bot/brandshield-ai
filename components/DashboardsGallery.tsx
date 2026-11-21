import Image from "next/image";
import Icon from "./Icon";
import Reveal from "./Reveal";

const CARDS = [
  {
    href: "/app?view=lab",
    img: "/images/dash-lab.png",
    tag: "Check",
    title: "Attack lab",
    desc: "14 adversarial drafts — traps, homoglyphs, expired offers — with fixed expected outcomes, run live.",
  },
  {
    href: "/app?view=governance",
    img: "/images/dash-governance.png",
    tag: "Govern",
    title: "Governance",
    desc: "Approval rates, pushback clusters, and audit bundles that verify offline.",
  },
  {
    href: "/app?view=kit",
    img: "/images/dash-kit.png",
    tag: "Govern",
    title: "Brand Kit",
    desc: "The rulebook, Claim Ledger and palette that every finding cites, plus guideline-to-rule upload.",
  },
  {
    href: "/app?view=health",
    img: "/images/dash-health.png",
    tag: "Govern",
    title: "Guideline Health",
    desc: "Where reviewers push back and which rules fire most — evidence for rewording the guide, not just the draft.",
  },
  {
    href: "/app?view=expiry",
    img: "/images/dash-expiry.png",
    tag: "Govern",
    title: "Expiry inbox",
    desc: "Facts with a clock, and approved content that quietly went stale. Re-review before it embarrasses you.",
  },
  {
    href: "/app?view=trail",
    img: "/images/dash-trail.png",
    tag: "Govern",
    title: "Audit trail",
    desc: "The hash-chained decision log: verify it, export it, or try to tamper with it and watch it get caught.",
  },
];

const COVERAGE = ["Claims", "Disclosures", "Terminology", "PII", "Look-alikes", "Email", "Ads", "Visual", "Tone", "Messages"];

export default function DashboardsGallery() {
  return (
    <section id="dashboards" className="relative scroll-mt-20 overflow-hidden bg-night text-cream">
      <div aria-hidden className="pointer-events-none absolute -left-32 top-24 h-96 w-96 rounded-full bg-mint/[0.05] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-16 h-80 w-80 rounded-full bg-gold/[0.05] blur-3xl" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(244,239,226,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(244,239,226,0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 50% 20%, black, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-mint">Dashboards · the workspace</div>
            <h2 className="mt-3 font-display text-5xl md:text-7xl">The rest of the workspace</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-cream/50">
            Deeper rooms live one click away, on the same rulebook and the same shared trail as the demos above. No
            sign-up — each opens live.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c, i) => (
            <Reveal key={c.href} delay={i * 80}>
              <a
                href={c.href}
                className="group block overflow-hidden rounded-3xl border border-white/10 bg-night-2 transition hover:-translate-y-1 hover:border-mint/40 hover:shadow-[0_30px_80px_-30px_rgba(111,245,201,0.25)]"
              >
                <div className="relative aspect-[3/2] overflow-hidden">
                  <Image
                    src={c.img}
                    alt={`${c.title} dashboard illustration`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-gold">{c.tag}</span>
                    <Icon name="open" className="h-4 w-4 text-cream/35 transition group-hover:text-mint" />
                  </div>
                  <h3 className="mt-2 font-display text-2xl">{c.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-cream/60">{c.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-mint">
                    Open dashboard
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" /></svg>
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-1.5 text-[10px] text-cream/45">
          <span className="mr-2 text-[10px] font-medium uppercase tracking-[0.16em] text-cream/35">The engine covers</span>
          {COVERAGE.map((t) => (
            <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
