const PATHS: Record<string, React.ReactNode> = {
  doc: (<>
    <rect x="10" y="8" width="32" height="42" rx="4" />
    <path d="M17 20h18M17 28h18M17 36h10" />
    <circle cx="44" cy="42" r="9" />
    <path d="m51 49 7 7" />
  </>),
  swap: (<>
    <rect x="6" y="12" width="24" height="16" rx="3" />
    <path d="M11 20h14" />
    <rect x="34" y="36" width="24" height="16" rx="3" />
    <path d="m40 44 4 4 8-8" />
    <path d="M30 20h10a6 6 0 0 1 6 6v6" />
    <path d="m42 28 4 4 4-4" />
  </>),
  ledger: (<>
    <rect x="8" y="12" width="48" height="44" rx="5" />
    <path d="M8 24h48M20 6v10M44 6v10M16 34h18M16 44h12" />
    <circle cx="46" cy="44" r="7" />
    <path d="M46 40v4l3 2" />
  </>),
  chain: (<>
    <rect x="6" y="20" width="32" height="22" rx="11" />
    <rect x="26" y="20" width="32" height="22" rx="11" />
    <path d="M14 52h14M36 52h14" />
  </>),
  scan: (<>
    <path d="M10 20v-8a2 2 0 0 1 2-2h8M44 10h8a2 2 0 0 1 2 2v8M54 44v8a2 2 0 0 1-2 2h-8M20 54h-8a2 2 0 0 1-2-2v-8M16 32h32" />
  </>),
  explain: (<>
    <path d="M10 12h44v30H30L20 52V42H10z" />
    <path d="M24 27h.01M32 27h.01M40 27h.01" strokeWidth="4" />
  </>),
  fix: (<>
    <path d="m14 50 4-14L46 8l10 10-28 28-14 4Z" />
    <path d="m40 14 10 10" />
  </>),
  decide: (<>
    <circle cx="32" cy="32" r="22" />
    <path d="m21 33 8 8 14-16" />
  </>),
  shield: (<>
    <path d="M32 6 52 13v16c0 13-8.500 23-20 28C20.500 52 12 42 12 29V13L32 6Z" />
    <path d="m23 31 6 6 12-13" />
  </>),
  compose: (<>
    <path d="M14 46l4-12L44 8l10 10-26 26-14 4Z" />
    <path d="m38 14 10 10" />
  </>),
  inbox: (<>
    <path d="M10 12h44v32l-10 8H20l-10-8V12Z" />
    <path d="M10 36h14l4 6h12l4-6h14" />
  </>),
  kit: (<>
    <rect x="8" y="8" width="48" height="48" rx="6" />
    <circle cx="21" cy="21" r="5" />
    <path d="M8 42 24 28l10 8 14-14 8 8" />
  </>),
  pulse: (<>
    <path d="M6 32h12l6-16 10 32 8-24 6 8h10" />
  </>),
  hourglass: (<>
    <path d="M18 8h28M18 56h28" />
    <path d="M22 8c0 12 8 16 10 24-2 8-10 12-10 24M42 8c0 12-8 16-10 24 2 8 10 12 10 24" />
  </>),
  info: (<>
    <circle cx="32" cy="32" r="24" />
    <path d="M32 28v14" />
    <path d="M32 19h.01" strokeWidth="4" />
  </>),
  judge: (<>
    <path d="m16 18 5 5 9-9M16 34l5 5 9-9M16 50l5 5 9-9" />
    <path d="M38 21h12M38 37h12M38 53h12" />
  </>),
  download: (<>
    <path d="M32 10v28M20 28l12 12 12-12" />
    <path d="M14 50h36" />
  </>),
  upload: (<>
    <path d="M32 38V10M20 22l12-12 12 12" />
    <path d="M14 50h36" />
  </>),
  back: (<>
    <path d="M36 14 18 32l18 18" />
    <path d="M20 32h28" />
  </>),
  users: (<>
    <circle cx="24" cy="24" r="8" />
    <path d="M10 52c2-10 8-14 14-14s12 4 14 14" />
    <circle cx="43" cy="22" r="6" />
    <path d="M44 38c5 1 9 5 10 12" />
  </>),
  open: (<>
    <path d="M22 14h28v28" />
    <path d="M50 14 30 34" />
    <path d="M40 42v12H12V26h12" />
  </>),
  ban: (<>
    <circle cx="32" cy="32" r="24" />
    <path d="m15 15 34 34" />
  </>),
  spark: (<>
    <path d="M32 6l5 16 16 5-16 5-5 16-5-16-16-5 16-5 5-16Z" />
    <path d="M48 40l2.5 7 7 2.5-7 2.5-2.5 7-2.5-7-7-2.5 7-2.5 2.5-7Z" strokeWidth="2" />
  </>),
};

export default function Icon({
  name, className = "h-14 w-14",
}: { name: keyof typeof PATHS | string; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {PATHS[name]}
    </svg>
  );
}
