/* Original flat illustrations, one per feature. Used unless a real image is supplied. */
export default function Scene({ kind }: { kind: "doc" | "swap" | "ledger" | "chain" }) {
  return (
    <svg viewBox="0 0 400 200" className="h-full w-full" role="img" aria-label={kind}>
      <defs>
        <linearGradient id={`bg-${kind}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d5f3ec" />
          <stop offset="1" stopColor="#f3efe4" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#bg-${kind})`} />
      <circle cx="352" cy="30" r="46" fill="#0f766e" opacity="0.08" />
      <circle cx="40" cy="176" r="56" fill="#0f766e" opacity="0.08" />

      {kind === "doc" && (
        <g>
          <rect x="110" y="22" width="170" height="156" rx="12" fill="#fff" stroke="#e1e0d6" />
          <rect x="128" y="44" width="90" height="8" rx="4" fill="#d9d8cf" />
          <rect x="126" y="66" width="130" height="14" rx="3" fill="#fde8e6" />
          <rect x="126" y="78" width="130" height="2" fill="#c0392b" />
          <rect x="128" y="96" width="120" height="8" rx="4" fill="#d9d8cf" />
          <rect x="126" y="116" width="98" height="14" rx="3" fill="#fdf1d6" />
          <rect x="126" y="128" width="98" height="2" fill="#c98a0b" />
          <rect x="128" y="146" width="104" height="8" rx="4" fill="#d9d8cf" />
          <circle cx="262" cy="73" r="9" fill="#15211c" /><text x="262" y="77" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">1</text>
          <circle cx="236" cy="123" r="9" fill="#15211c" /><text x="236" y="127" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">2</text>
          <circle cx="292" cy="120" r="34" fill="#fff" fillOpacity="0.55" stroke="#0f766e" strokeWidth="7" />
          <path d="m316 146 28 28" stroke="#0f766e" strokeWidth="9" strokeLinecap="round" />
        </g>
      )}

      {kind === "swap" && (
        <g>
          <rect x="40" y="44" width="150" height="100" rx="14" fill="#fff" stroke="#e1e0d6" />
          <rect x="58" y="66" width="114" height="14" rx="3" fill="#fde8e6" />
          <path d="M60 73h110" stroke="#c0392b" strokeWidth="3" />
          <rect x="58" y="96" width="80" height="8" rx="4" fill="#d9d8cf" />
          <rect x="58" y="114" width="96" height="8" rx="4" fill="#d9d8cf" />
          <path d="M198 94h30m-10-10 10 10-10 10" stroke="#0f766e" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="236" y="44" width="130" height="100" rx="14" fill="#fff" stroke="#0f766e" strokeWidth="2" />
          <rect x="252" y="66" width="98" height="14" rx="3" fill="#d9f5e5" />
          <rect x="252" y="96" width="70" height="8" rx="4" fill="#d9d8cf" />
          <rect x="252" y="114" width="84" height="8" rx="4" fill="#d9d8cf" />
          <circle cx="352" cy="44" r="16" fill="#0f766e" />
          <path d="m344 44 6 6 10-11" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}

      {kind === "ledger" && (
        <g>
          <rect x="90" y="24" width="190" height="152" rx="14" fill="#fff" stroke="#e1e0d6" />
          <path d="M90 38a14 14 0 0 1 14-14h162a14 14 0 0 1 14 14v22H90Z" fill="#0f766e" />
          <rect x="108" y="38" width="60" height="9" rx="4" fill="#fff" opacity="0.9" />
          {[78, 104, 130, 156].map((y) => (
            <g key={y}>
              <rect x="108" y={y} width="86" height="8" rx="4" fill="#d9d8cf" />
              <rect x="214" y={y} width="48" height="8" rx="4" fill="#e6e5dc" />
            </g>
          ))}
          <g transform="rotate(-14 300 120)">
            <rect x="244" y="96" width="112" height="46" rx="8" fill="none" stroke="#c0392b" strokeWidth="4" />
            <text x="300" y="127" textAnchor="middle" fontSize="22" fontWeight="800" fill="#c0392b" letterSpacing="3">EXPIRED</text>
          </g>
        </g>
      )}

      {kind === "chain" && (
        <g>
          {[40, 150, 260].map((x, i) => (
            <g key={x}>
              <rect x={x} y="62" width="100" height="76" rx="12" fill={i === 2 ? "#0f766e" : "#fff"} stroke="#0f766e" strokeWidth="2" />
              <rect x={x + 14} y="80" width="52" height="8" rx="4" fill={i === 2 ? "#fff" : "#d9d8cf"} opacity="0.9" />
              <rect x={x + 14} y="98" width="72" height="6" rx="3" fill={i === 2 ? "#fff" : "#e6e5dc"} opacity="0.8" />
              <rect x={x + 14} y="114" width="40" height="6" rx="3" fill={i === 2 ? "#5eead4" : "#0f766e"} />
              {i < 2 && <path d={`M${x + 100} 100h10`} stroke="#0f766e" strokeWidth="6" strokeLinecap="round" />}
            </g>
          ))}
          <text x="200" y="168" textAnchor="middle" fontSize="12" fill="#5d6b64" fontFamily="monospace">hash ← hash ← hash</text>
        </g>
      )}
    </svg>
  );
}
