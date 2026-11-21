"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuditEntry, TRAIL_KEY } from "@/lib/audit";
import { buildDemoHistory } from "@/lib/demo";
import { FACTS } from "@/data/brand";
import type { Fact } from "@/lib/types";
import { QueueItem, demoQueue, loadQueue, saveQueue } from "@/lib/queue";
import ContentWatch from "./ContentWatch";
import Workbench from "./Workbench";
import ReviewQueue from "./app/ReviewQueue";

export default function LiveSections() {
  const today = useMemo(() => new Date("2026-11-17T12:00:00"), []);
  const [facts, setFacts] = useState<Fact[]>(FACTS);
  const [trail, setTrail] = useState<AuditEntry[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser stores, read after hydration
    setTrail((() => { try { const raw = localStorage.getItem(TRAIL_KEY); return raw ? JSON.parse(raw) as AuditEntry[] : []; } catch { return []; } })());
    const q = loadQueue();
    if (q.length) {
      setQueue(q);
    } else {
      // Seed the demo queue so the Decide section is alive on first visit; items are labelled as demo data.
      const d = demoQueue(today);
      saveQueue(d);
      setQueue(d);
    }
  }, [today]);

  const persistTrail = useCallback((t: AuditEntry[]) => {
    setTrail(t);
    try { localStorage.setItem(TRAIL_KEY, JSON.stringify(t)); } catch {}
  }, []);

  const seedDemo = useCallback(async () => {
    setSeeding(true);
    try {
      persistTrail(await buildDemoHistory(today));
      setQueue((prev) => {
        const next = prev.length ? prev : demoQueue(today);
        saveQueue(next);
        return next;
      });
    } finally {
      setSeeding(false);
    }
  }, [persistTrail, today]);

  return (
    <>
      <div className="text-ink">
        <Workbench trail={trail} setTrail={persistTrail} facts={facts} today={today} />
      </div>

      <ContentWatch trail={trail} facts={facts} setFacts={setFacts} today={today} />

      <section id="queue" className="scroll-mt-20 border-t border-white/5 bg-night-2 text-cream">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-mint">Decide · human judgment</div>
              <h2 className="mt-3 font-display text-5xl md:text-6xl">People decide, on the record</h2>
              <p className="mt-3 max-w-2xl text-cream/60">
                Nothing auto-publishes. Open a submission, re-check it live, and approve, request changes or reject —
                every call seals a named, hash-chained entry.
              </p>
            </div>
            <p className="max-w-xs text-sm leading-6 text-cream/50">
              Deciding as <b className="text-mint">Reviewer</b> here. Switch roles and see the rest of the trail in the
              workspace.
            </p>
          </div>
          <div className="mt-10">
            <ReviewQueue
              queue={queue}
              setQueue={(q) => { setQueue(q); saveQueue(q); }}
              trail={trail}
              setTrail={persistTrail}
              facts={facts}
              today={today}
              role="Reviewer"
              onStep={() => {}}
              onSeedDemo={seedDemo}
              seeding={seeding}
            />
          </div>
        </div>
      </section>
    </>
  );
}
