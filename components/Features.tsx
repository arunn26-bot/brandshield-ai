import { FACTS } from "@/data/brand";
import { runChecks } from "@/lib/engine";
import Icon from "./Icon";
import Pic from "./Pic";
import Scene from "./Scene";

function Banner({ n, kind }: { n: number; kind: "doc" | "swap" | "ledger" | "chain" }) {
  return (
    <div className="mb-4 h-44 overflow-hidden rounded-3xl border border-line">
      <Pic src={`/images/feature-${n}.png`} alt="" className="h-full w-full object-cover" fallback={<Scene kind={kind} />} />
    </div>
  );
}

const DAY = new Date("2026-11-13T12:00:00");
const f = runChecks("Get ₹500 cashback on your first UPI payment.", DAY)[0];

function Points({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-3 text-lg text-muted">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-3">
          <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
          {t}
        </li>
      ))}
    </ul>
  );
}

function Head({ icon, title }: { icon: string; title: string }) {
  return (
    <>
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand/10 text-brand">
        <Icon name={icon} className="h-11 w-11" />
      </div>
      <h3 className="mt-6 font-display text-4xl">{title}</h3>
    </>
  );
}

export default function Features() {
  return (
    <section id="depth" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
      <h2 className="max-w-3xl font-display text-5xl md:text-7xl">More than a style checker</h2>

      <div className="mt-16 space-y-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Head icon="doc" title="Cited findings" />
            <Points items={[
              "Shows the exact words that break a rule",
              "Names the rule and where it comes from",
              "No vague warnings, no black-box scores",
            ]} />
          </div>
          <div>
            <Banner n={1} kind="doc" />
          <div className="rounded-3xl border border-line bg-white p-6">
            <div className="flex items-center gap-2">
              <span className="font-medium">{f.title}</span>
              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-700">{f.severity}</span>
            </div>
            <div className="mt-3 rounded-lg bg-paper px-3 py-2">&ldquo;{f.quote}&rdquo;</div>
            <p className="mt-3 text-sm text-muted">{f.why}</p>
            <p className="mt-3 text-xs text-muted">{f.ruleId} · {f.source}</p>
          </div>
          </div>
        </div>

        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <Banner n={2} kind="swap" />
          <div className="rounded-3xl border border-line bg-white p-6">
            <div className="text-sm text-muted">Suggested minimal edit</div>
            <p className="mt-3 text-xl leading-9">
              Get <del className="rounded bg-red-50 px-1 text-red-700">{f.quote}</del>{" "}
              <ins className="rounded bg-emerald-50 px-1 text-emerald-800 no-underline">{f.fix}</ins>{" "}
              on your first UPI payment.
            </p>
          </div>
          </div>
          <div className="order-1 md:order-2">
            <Head icon="swap" title="Fixes that keep the message" />
            <Points items={[
              "Replaces only the offending words",
              "Uses approved wording from the Claim Ledger",
              "You choose which fixes to apply",
            ]} />
          </div>
        </div>

        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Head icon="ledger" title="A Claim Ledger with expiry" />
            <Points items={[
              "Every approved fact has an owner and a valid-to date",
              "Expired offers are flagged in new drafts",
              "Wrong numbers are compared against the approved value",
            ]} />
          </div>
          <div>
            <Banner n={3} kind="ledger" />
          <div className="rounded-3xl border border-line bg-white p-2">
            {FACTS.map((x) => {
              const expired = new Date(x.validTo + "T23:59:59") < DAY;
              return (
                <div key={x.id} className="flex items-center justify-between gap-4 rounded-2xl p-4">
                  <div>
                    <div className="font-medium">{x.id} · {x.topic}</div>
                    <div className="text-sm text-muted">Owner {x.owner} · valid to {x.validTo}</div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-xs ${expired ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                    {expired ? "Expired" : "Valid"}
                  </span>
                </div>
              );
            })}
          </div>
          </div>
        </div>

        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <Banner n={4} kind="chain" />
          <div className="rounded-3xl bg-night p-6 text-cream">
            <div className="text-sm text-cream/60">Approval trail · example</div>
            {["#2 Approved with override · Ananya", "#1 Changes requested · Rohan"].map((l, i) => (
              <div key={l} className="mt-4 rounded-2xl bg-night-2 p-4">
                <div className="text-sm">{l}</div>
                <div className="mt-1 font-mono text-xs text-mint/80">
                  {i === 0 ? "7c1e9a…  ←  prev 3b84d0…" : "3b84d0…  ←  GENESIS"}
                </div>
              </div>
            ))}
          </div>
          </div>
          <div className="order-1 md:order-2">
            <Head icon="chain" title="A trail nobody can quietly edit" />
            <Points items={[
              "Each decision stores the draft's SHA-256",
              "Entries are chained to the one before",
              "Edit an old entry and verification fails",
            ]} />
          </div>
        </div>
      </div>
    </section>
  );
}
