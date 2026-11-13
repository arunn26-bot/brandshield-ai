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
