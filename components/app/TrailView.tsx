"use client";

import { useRef, useState } from "react";
import { AuditEntry, Decision, TRAIL_KEY, verifyTrail } from "@/lib/audit";
import { exportBundle, verifyBundle, type BundleVerification } from "@/lib/bundle";
import { BRAND } from "@/data/brand";
import Icon from "@/components/Icon";

const LABEL: Record<Decision, string> = {
  approved: "Approved",
  approved_override: "Override",
  changes_requested: "Changes",
  rejected: "Rejected",
};

const BADGE: Record<Decision, string> = {
  approved: "border-emerald-300/30 bg-emerald-400/10 text-emerald-300",
  approved_override: "border-amber-300/30 bg-amber-400/10 text-amber-300",
  changes_requested: "border-sky-300/30 bg-sky-400/10 text-sky-300",
  rejected: "border-red-300/30 bg-red-400/10 text-red-300",
};

export default function TrailView({
  trail, setTrail, onStep, onSeedDemo, seeding,
}: {
  trail: AuditEntry[];
  setTrail: (t: AuditEntry[]) => void;
  onStep: (id: string) => void;
  onSeedDemo: () => void;
  seeding: boolean;
}) {
  const [verdict, setVerdict] = useState("");
  const [importMsg, setImportMsg] = useState<BundleVerification | null>(null);
  const file = useRef<HTMLInputElement>(null);

  function save(next: AuditEntry[]) {
    setTrail(next);
    try { localStorage.setItem(TRAIL_KEY, JSON.stringify(next)); } catch {}
  }

  async function verify() {
    const bad = await verifyTrail(trail);
    setVerdict(
      bad === -1
        ? `Verified: all ${trail.length} entries are intact and chained, root ${trail[trail.length - 1]?.hash.slice(0, 12)}…`
        : `Entry #${trail[bad].n} does not match its hash. The trail was altered after it was written.`
    );
    onStep("trail");
  }

  function tamper() {
    if (!trail.length) return;
    const copy = trail.map((e, i) => (i === 0 ? { ...e, comment: e.comment + " (quietly edited)" } : e));
    save(copy);
    setVerdict("Entry #1 was edited after sealing. Press Verify chain to catch it.");
  }

  function download() {
    const bundle = exportBundle(trail, BRAND.rulebookVersion);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brandshield-audit.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImport(f: File) {
    try {
      const bundle = JSON.parse(await f.text());
      const result = await verifyBundle(bundle);
      setImportMsg(result);
    } catch {
      setImportMsg({ ok: false, brokenAt: -1, rootHashOk: false, message: "That file is not valid JSON." });
    }
  }

  const root = trail[trail.length - 1]?.hash;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-night-2 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-mint/10 text-mint">
                <Icon name="chain" className="h-4 w-4" />
              </span>
              Approval trail · hash-chained, verifiable offline
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-cream/55">
              Each decision stores the draft&apos;s SHA-256, the rulebook version and the open findings, and is chained
              to the entry before it. Edit history and every verifier fails.
            </p>
            {root && (
              <p className="mt-2 font-mono text-[11px] text-cream/45">
                {trail.length} entries · root {root.slice(0, 20)}… · rulebook {BRAND.rulebookVersion}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={verify}
              disabled={!trail.length}
              className="flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-xs font-medium text-night transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-40"
            >
              <Icon name="shield" className="h-3.5 w-3.5" />
              Verify chain
            </button>
            <button
              onClick={tamper}
              disabled={!trail.length}
              className="rounded-full border border-white/20 px-4 py-2 text-xs text-cream/80 transition hover:bg-white/10 disabled:opacity-40"
            >
              Simulate tampering
            </button>
            <button
              onClick={download}
              disabled={!trail.length}
              className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs text-cream/80 transition hover:bg-white/10 disabled:opacity-40"
            >
              <Icon name="download" className="h-3.5 w-3.5" />
              Export bundle
            </button>
            <button
              onClick={() => file.current?.click()}
              className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs text-cream/80 transition hover:bg-white/10"
            >
              <Icon name="upload" className="h-3.5 w-3.5" />
              Import & verify
            </button>
            <input
              ref={file}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImport(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => save([])}
              disabled={!trail.length}
              className="rounded-full border border-white/20 px-4 py-2 text-xs text-cream/80 transition hover:bg-white/10 disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>

        {verdict && (
          <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${verdict.startsWith("Verified") ? "border-mint/30 bg-mint/[0.07] text-mint" : "border-amber-300/30 bg-amber-400/10 text-amber-200"}`}>
            {verdict}
          </p>
        )}
        {importMsg && (
          <p className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${importMsg.ok ? "border-mint/30 bg-mint/[0.07] text-mint" : "border-red-300/30 bg-red-400/10 text-red-300"}`}>
            {importMsg.message}
          </p>
        )}
      </section>

      {trail.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center">
          <Icon name="chain" className="mx-auto h-10 w-10 text-cream/25" />
          <p className="mt-4 font-display text-2xl">No decisions on this trail yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-cream/55">
            Decide something in the review queue, or load a month of the PayNest team&apos;s decisions — built live,
            hash by hash, and labelled demo.
          </p>
          <button
            onClick={onSeedDemo}
            disabled={seeding}
            className="mt-4 rounded-full bg-mint px-4 py-2 text-xs font-medium text-night transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-40"
          >
            {seeding ? "Building…" : "Load demo history"}
          </button>
        </div>
      ) : (
        <ol className="space-y-3">
          {[...trail].reverse().map((e, idx) => (
            <li key={e.n} className="rounded-3xl border border-white/10 bg-night-2 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-cream/50">#{e.n}</span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${BADGE[e.decision]}`}>
                  {LABEL[e.decision]}
                </span>
                <span className="text-xs text-cream/60">
                  {e.reviewer} · {e.role} · {new Date(e.at).toLocaleString()}
                </span>
                {idx === 0 && (
                  <span className="rounded-full bg-mint/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-mint">latest</span>
                )}
              </div>
              {e.comment && <p className="mt-2 text-sm text-cream/80">&ldquo;{e.comment}&rdquo;</p>}
              <p className="mt-1.5 text-xs text-cream/50">
                {e.format} · rulebook {e.rulebook} · open: {e.openFindings.length ? e.openFindings.join(", ") : "none"}
              </p>
              <p className="mt-1 line-clamp-1 text-xs text-cream/40">{e.contentPreview}</p>
              <p className="mt-2 font-mono text-[10.5px] leading-4 text-cream/35">
                content {e.contentHash.slice(0, 16)}… · entry {e.hash.slice(0, 16)}… · prev{" "}
                {e.prevHash === "GENESIS" ? "GENESIS" : `${e.prevHash.slice(0, 12)}…`}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
