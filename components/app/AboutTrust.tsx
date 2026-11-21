import Icon from "@/components/Icon";

const STACK: [string, string, string][] = [
  ["Next.js", "16.4.6", "MIT"],
  ["React", "19.3.0", "MIT"],
  ["Tailwind CSS", "4.3.3", "MIT"],
  ["TypeScript", "~5", "Apache-2.0"],
  ["pdfjs-dist", "6.5", "Apache-2.0"],
  ["mammoth", "1.13", "BSD-2-Clause"],
];

const SECTIONS: { title: string; icon: string; body: string[] }[] = [
  {
    title: "What BrandShield does",
    icon: "shield",
    body: [
      "Checks every draft against a written rulebook and a Claim Ledger of approved facts — claims, disclosures, terminology, PII, look-alike characters, email footers, ad limits, palette, contrast and tone.",
      "Every finding cites the exact words, the rule, and the page it comes from. No scores without reasons.",
      "People decide. Approval records who, when, and the draft's hash — chained so history cannot be quietly edited.",
    ],
  },
  {
    title: "How AI is used (and how it is limited)",
    icon: "spark",
    body: [
      "AI is optional and only ever proposes tone and terminology findings. Severity and wording always come from the rulebook, never from the model.",
      "The model may only quote words that already exist in the draft. A grounding gate drops proposals that invent quotes, cite unknown rules, duplicate deterministic findings, or add numbers.",
      "The API key stays on the server. Drafts are redacted before the request and restored locally after the reply. Nothing is logged.",
      "Without a key, the demo runs a scripted response that deliberately includes bad proposals, labelled as such, so the gate can be watched working.",
    ],
  },
  {
    title: "Where your data is kept",
    icon: "ledger",
    body: [
      "Drafts, ledger edits, decisions and the trail live in this browser's localStorage. There is no account and no database behind this demo.",
      "The only network requests are the rulebook upload (processed in memory, not stored) and the optional, redacted AI review.",
      "Export the audit bundle as JSON and verify it offline — no server, no trust required.",
    ],
  },
];

export default function AboutTrust() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-3xl border border-white/10 bg-night-2 p-6">
        <h2 className="font-display text-3xl">About & trust</h2>
        <p className="mt-2 text-sm leading-6 text-cream/60">
          BrandShield is a brand-governance workbench for the fictional payments brand PayNest, built for CodeNova
          India 2026. This page states what it measures, what it does not, and where a person still has to decide.
        </p>
      </div>

      {SECTIONS.map((s) => (
        <section key={s.title} className="rounded-3xl border border-white/10 bg-night-2 p-6">
          <h3 className="flex items-center gap-2 font-display text-xl">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-mint/10 text-mint">
              <Icon name={s.icon} className="h-4 w-4" />
            </span>
            {s.title}
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-cream/70">
            {s.body.map((b) => <li key={b}>• {b}</li>)}
          </ul>
        </section>
      ))}

      <section className="rounded-3xl border border-white/10 bg-night-2 p-6">
        <h3 className="flex items-center gap-2 font-display text-xl">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-mint/10 text-mint">
            <Icon name="info" className="h-4 w-4" />
          </span>
          Known limits, stated plainly
        </h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-cream/70">
          <li>• No OCR or logo detection. Image checks cover palette and contrast, not a logo in the pixels.</li>
          <li>• Guideline extraction is heuristic; a person confirms every proposal before it becomes a rule.</li>
          <li>• The 94-case evaluation is a development set, not a held-out benchmark. The site says so rather than dressing the number up.</li>
          <li>• LocalStorage is per-browser. A production deployment would move the trail to a shared, append-only store with the same hash chain.</li>
        </ul>
      </section>

      <section className="rounded-3xl border border-white/10 bg-night-2 p-6">
        <h3 className="font-display text-xl">Built with</h3>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.14em] text-cream/40">
              <th className="py-2 pr-3 font-medium">Library</th>
              <th className="py-2 pr-3 font-medium">Version</th>
              <th className="py-2 font-medium">Licence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {STACK.map(([name, version, licence]) => (
              <tr key={name} className="text-cream/75">
                <td className="py-2.5 pr-3">{name}</td>
                <td className="py-2.5 pr-3 font-mono text-xs text-cream/50">{version}</td>
                <td className="py-2.5 text-xs text-cream/50">{licence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-night-2 p-6 text-sm text-cream/60">
        <span>Built by Arun Sharma · CodeNova India 2026 · team sharmaarun24089</span>
        <a
          href="https://github.com/arunn26-bot/brandshield-ai"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 underline decoration-cream/30 underline-offset-4 hover:text-cream"
        >
          <Icon name="open" className="h-3.5 w-3.5" />
          Source on GitHub
        </a>
      </div>
    </div>
  );
}
