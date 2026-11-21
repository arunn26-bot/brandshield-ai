"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AuditEntry, TRAIL_KEY } from "@/lib/audit";
import { buildDemoHistory } from "@/lib/demo";
import { FACTS } from "@/data/brand";
import type { Fact, Rule } from "@/lib/types";
import type { PaletteColor } from "@/lib/visual";
import { QueueItem, demoQueue, loadQueue, saveQueue } from "@/lib/queue";
import { PALETTE } from "@/data/brand";
import Icon from "@/components/Icon";
import Workbench from "@/components/Workbench";
import AttackLab from "@/components/AttackLab";
import ContentWatch from "@/components/ContentWatch";
import Governance from "@/components/Governance";
import NewDraft from "./NewDraft";
import ReviewQueue from "./ReviewQueue";
import BrandKit from "./BrandKit";
import Health from "./Health";
import Expiry from "./Expiry";
import TrailView from "./TrailView";
import AboutTrust from "./AboutTrust";
import JudgePath, { JUDGE_STEPS, type JudgeStep } from "./JudgePath";

export type Role = "Creator" | "Reviewer" | "Compliance" | "Admin";

const ROLES: { id: Role; blurb: string }[] = [
  { id: "Creator", blurb: "Drafts and submits. Cannot decide." },
  { id: "Reviewer", blurb: "Approves, requests changes or rejects." },
  { id: "Compliance", blurb: "Decides, plus written overrides on high-severity findings." },
  { id: "Admin", blurb: "Everything, including the ledger." },
];

type View = "new" | "queue" | "playground" | "lab" | "kit" | "health" | "watch" | "expiry" | "governance" | "trail" | "about";

interface ViewMeta { id: View; label: string; icon: string; sub: string }
const GROUPS: { label: string; views: ViewMeta[] }[] = [
  {
    label: "Create",
    views: [
      { id: "new", label: "New draft", icon: "compose", sub: "Intent card, samples, upload, live checks" },
      { id: "queue", label: "Review queue", icon: "inbox", sub: "Decide as a reviewer — nothing auto-publishes" },
    ],
  },
  {
    label: "Check",
    views: [
      { id: "playground", label: "Workbench", icon: "fix", sub: "Four formats, fixes, AI review, rulebook upload" },
      { id: "lab", label: "Attack lab", icon: "scan", sub: "14 adversarial cases with fixed expected outcomes" },
    ],
  },
  {
    label: "Govern",
    views: [
      { id: "kit", label: "Brand Kit", icon: "kit", sub: "Rulebook, Claim Ledger, palette, guideline upload" },
      { id: "health", label: "Guideline Health", icon: "pulse", sub: "Where drafts get pushed back, and why" },
      { id: "watch", label: "Content Watch", icon: "hourglass", sub: "Drag time forward; watch approvals go stale" },
      { id: "expiry", label: "Expiry inbox", icon: "inbox", sub: "Facts with a clock, and content gone stale" },
      { id: "governance", label: "Governance", icon: "ledger", sub: "Decisions, pushback and exportable audit bundles" },
      { id: "trail", label: "Audit trail", icon: "chain", sub: "Hash-chained decisions, verifiable offline" },
    ],
  },
  {
    label: "Meta",
    views: [{ id: "about", label: "About & trust", icon: "info", sub: "What it measures, what it does not" }],
  },
];
const VIEWS = GROUPS.flatMap((g) => g.views);

const ROLE_KEY = "brandshield.role";
const JUDGE_KEY = "brandshield.judgepath.v1";
const JUDGE_CLOSED = "brandshield.judgepath.closed";
const DAY = 86400000;

export default function AppShell() {
  const [view, setView] = useState<View>("new");
  const [role, setRole] = useState<Role>("Creator");
  const [today] = useState(() => new Date("2026-11-17T12:00:00"));
  const [facts, setFacts] = useState<Fact[]>(FACTS);
  const [trail, setTrail] = useState<AuditEntry[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [customRules, setCustomRules] = useState<Rule[]>([]);
  const [palette, setPalette] = useState<PaletteColor[]>(PALETTE);
  const [seeding, setSeeding] = useState(false);
  const [judgeDone, setJudgeDone] = useState<Set<string>>(new Set());
  const [judgeOpen, setJudgeOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only stores, read after hydration
    setTrail((() => { try { const raw = localStorage.getItem(TRAIL_KEY); return raw ? JSON.parse(raw) as AuditEntry[] : []; } catch { return []; } })());
    setQueue(loadQueue());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the saved role is read after hydration
    setRole((localStorage.getItem(ROLE_KEY) as Role) || "Creator");
    setJudgeDone(new Set(JSON.parse(localStorage.getItem(JUDGE_KEY) ?? "[]") as string[]));
    setJudgeOpen(localStorage.getItem(JUDGE_CLOSED) !== "1");
  }, []);

  /** Deep links: /app?view=lab opens the attack lab directly. */
  const go = useCallback((v: View) => {
    setView(v);
    try { window.history.replaceState(null, "", `/app?view=${v}`); } catch {}
  }, []);

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("view") as View | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of the URL after hydration
    if (v && VIEWS.some((x) => x.id === v)) setView(v);
  }, []);

  const persistTrail = useCallback((t: AuditEntry[]) => {
    setTrail(t);
    try { localStorage.setItem(TRAIL_KEY, JSON.stringify(t)); } catch {}
  }, []);

  const seedDemo = useCallback(async () => {
    setSeeding(true);
    try {
      const history = await buildDemoHistory(new Date());
      persistTrail(history);
      setQueue((prev) => {
        const next = prev.length ? prev : demoQueue(new Date());
        saveQueue(next);
        return next;
      });
    } finally {
      setSeeding(false);
    }
  }, [persistTrail]);

  const stepDone = useCallback((id: string) => {
    setJudgeDone((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem(JUDGE_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const closeJudge = useCallback(() => {
    setJudgeOpen(false);
    try { localStorage.setItem(JUDGE_CLOSED, "1"); } catch {}
  }, []);

  const openJudge = useCallback(() => {
    setJudgeOpen(true);
    try { localStorage.setItem(JUDGE_CLOSED, "0"); } catch {}
  }, []);

  const goJudgeStep = useCallback((step: JudgeStep) => {
    stepDone(step.id);
    if (step.href) window.location.href = step.href;
    else go(step.view as View);
  }, [stepDone, go]);

  function changeRole(r: Role) {
    setRole(r);
    try { localStorage.setItem(ROLE_KEY, r); } catch {}
  }

  function submitItem(item: QueueItem) {
    const next = [item, ...queue];
    setQueue(next);
    saveQueue(next);
    go("queue");
  }

  const queueBadge = queue.filter((q) => q.status === "in_review").length;
  const expiryBadge = useMemo(
    () => facts.filter((f) => new Date(f.validTo + "T23:59:59").getTime() - today.getTime() <= 30 * DAY).length,
    [facts, today]
  );
  const staleBadge = useMemo(
    () => (trail.length ? trail.filter((e) => {
      if (e.decision !== "approved" && e.decision !== "approved_override") return false;
      return e.openFindings.some((id) => id === "CLAIM-05" || id === "CLAIM-01");
    }).length : 0),
    [trail]
  );

  const active = VIEWS.find((v) => v.id === view)!;

  return (
    <div className="min-h-screen bg-night text-cream">
      <div className="mx-auto flex max-w-[1440px]">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-night-2/50 px-3 py-5 md:flex">
          <Link href="/" className="flex items-center gap-2.5 rounded-2xl px-2 py-1.5 text-mint transition hover:bg-white/5">
            <Icon name="shield" className="h-6 w-6" />
            <span>
              <span className="block font-display text-lg leading-6 text-cream">BrandShield</span>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-cream/40">PayNest workspace</span>
            </span>
          </Link>

          <nav aria-label="Workspace" className="mt-5 flex-1 space-y-4 overflow-y-auto pr-1">
            {GROUPS.map((group) => (
              <div key={group.label}>
                <div className="px-3 pb-1 text-[9.5px] font-medium uppercase tracking-[0.18em] text-cream/30">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.views.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => go(v.id)}
                      aria-current={view === v.id ? "page" : undefined}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm transition ${
                        view === v.id ? "bg-mint/10 font-medium text-mint ring-1 ring-mint/25" : "text-cream/70 hover:bg-white/5 hover:text-cream"
                      }`}
                    >
                      <Icon name={v.icon} className="h-4.5 w-4.5 shrink-0" />
                      <span className="flex-1">{v.label}</span>
                      {v.id === "queue" && queueBadge > 0 && (
                        <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-semibold text-sky-300">{queueBadge}</span>
                      )}
                      {v.id === "expiry" && expiryBadge + staleBadge > 0 && (
                        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                          {expiryBadge + staleBadge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="space-y-2 border-t border-white/10 pt-4 text-[10.5px] leading-4 text-cream/40">
            <p>Deterministic checks run in this browser. The optional AI review sends a redacted draft only.</p>
            <Link href="/" className="flex items-center gap-1.5 text-cream/60 transition hover:text-mint">
              <Icon name="back" className="h-3.5 w-3.5" />
              Marketing site
            </Link>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-night/85 backdrop-blur">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-7">
              <select
                value={view}
                onChange={(e) => go(e.target.value as View)}
                aria-label="Section"
                className="rounded-full border border-white/15 bg-night-2 px-3 py-1.5 text-sm text-cream outline-none [color-scheme:dark] md:hidden"
              >
                {VIEWS.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
              <div className="hidden md:block">
                <h1 className="font-display text-xl leading-7">{active.label}</h1>
                <p className="text-[11px] text-cream/45">{active.sub}</p>
              </div>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 rounded-full border border-white/15 bg-night-2 px-3 py-1.5">
                  <Icon name="users" className="h-3.5 w-3.5 text-cream/50" />
                  <span className="hidden text-[10px] uppercase tracking-wide text-cream/40 sm:inline">Viewing as</span>
                  <select
                    value={role}
                    onChange={(e) => changeRole(e.target.value as Role)}
                    aria-label="Role"
                    title={ROLES.find((r) => r.id === role)?.blurb}
                    className="bg-transparent text-sm font-medium text-mint outline-none [color-scheme:dark]"
                  >
                    {ROLES.map((r) => <option key={r.id} value={r.id}>{r.id}</option>)}
                  </select>
                </label>
                <Link
                  href="/"
                  className="hidden items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm text-cream/70 transition hover:border-mint/50 hover:text-mint sm:flex"
                >
                  <Icon name="back" className="h-3.5 w-3.5" />
                  Site
                </Link>
              </div>
            </div>
            <div className="hidden border-t border-white/5 px-7 py-1.5 text-[10.5px] text-cream/35 md:block">
              {ROLES.find((r) => r.id === role)?.blurb}
            </div>
          </header>

          <main className="px-4 py-6 md:px-7 md:py-7">
            {view === "new" && (
              <NewDraft
                today={today}
                facts={facts}
                customRules={customRules}
                palette={palette}
                role={role}
                onStep={stepDone}
                onSubmit={submitItem}
              />
            )}
            {view === "playground" && (
              <div className="text-ink">
                <Workbench trail={trail} setTrail={persistTrail} facts={facts} today={today} />
              </div>
            )}
            {view === "lab" && <AttackLab />}
            {view === "watch" && (
              <ContentWatch trail={trail} facts={facts} setFacts={setFacts} today={today} />
            )}
            {view === "governance" && (
              <div className="text-ink">
                <Governance trail={trail} facts={facts} today={today} />
              </div>
            )}
            {view === "queue" && (
              <ReviewQueue
                queue={queue}
                setQueue={(q) => { setQueue(q); saveQueue(q); }}
                trail={trail}
                setTrail={persistTrail}
                facts={facts}
                today={today}
                role={role}
                onStep={stepDone}
                onSeedDemo={seedDemo}
                seeding={seeding}
              />
            )}
            {view === "kit" && (
              <BrandKit facts={facts} today={today} onRules={setCustomRules} onPalette={setPalette} />
            )}
            {view === "health" && (
              <Health trail={trail} facts={facts} today={today} onSeedDemo={seedDemo} seeding={seeding} />
            )}
            {view === "expiry" && (
              <Expiry trail={trail} facts={facts} today={today} onSeedDemo={seedDemo} seeding={seeding} />
            )}
            {view === "trail" && (
              <TrailView trail={trail} setTrail={persistTrail} onStep={stepDone} onSeedDemo={seedDemo} seeding={seeding} />
            )}
            {view === "about" && <AboutTrust />}
          </main>
        </div>
      </div>

      {judgeOpen ? (
        <JudgePath done={judgeDone} onGo={goJudgeStep} onClose={closeJudge} />
      ) : (
        <button
          onClick={openJudge}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-white/10 bg-night-2/95 px-4 py-2.5 text-xs font-medium text-cream shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)] ring-1 ring-white/10 backdrop-blur transition hover:border-mint/50 hover:text-mint"
        >
          <Icon name="judge" className="h-4 w-4 text-mint" />
          Judge path · {judgeDone.size}/{JUDGE_STEPS.length}
        </button>
      )}
    </div>
  );
}
