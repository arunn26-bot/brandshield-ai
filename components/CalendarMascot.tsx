export type Mood = "happy" | "alert" | "expired";

const HEAD: Record<Mood, string> = { happy: "#2dd4bf", alert: "#f5b342", expired: "#ef6a63" };

/* A friendly calendar whose mood follows the preview date. */
export default function CalendarMascot({
  mood, day, month,
}: { mood: Mood; day: number; month: string }) {
  return (
    <svg viewBox="0 0 180 190" className="h-44 w-44 md:h-52 md:w-52" role="img" aria-label={`Calendar mascot, ${mood}`}>
      <ellipse cx="90" cy="178" rx="52" ry="6" fill="#000" opacity="0.25" />
      <g>
        <rect x="22" y="24" width="136" height="142" rx="24" fill="#f4efe2" />
        <path d="M22 48a24 24 0 0 1 24-24h88a24 24 0 0 1 24 24v14H22Z" fill={HEAD[mood]} style={{ transition: "fill .4s" }} />
        <rect x="52" y="12" width="9" height="26" rx="4.500" fill="#0e1a15" />
        <rect x="119" y="12" width="9" height="26" rx="4.500" fill="#0e1a15" />
        <text x="90" y="53" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff" letterSpacing="2">
          {month.toUpperCase()}
        </text>

        <text key={day} x="90" y="96" textAnchor="middle" fontSize="26" fontWeight="800" fill="#0e1a15" className="animate-pop" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          {day}
        </text>

        {/* face */}
        <ellipse cx="64" cy="122" rx="6" ry="8" fill="#0e1a15" className="animate-blink" />
        <ellipse cx="116" cy="122" rx="6" ry="8" fill="#0e1a15" className="animate-blink" />
        <circle cx="48" cy="137" r="7" fill="#f4a5a5" opacity="0.7" />
        <circle cx="132" cy="137" r="7" fill="#f4a5a5" opacity="0.7" />
        {mood === "happy" && <path d="M76 137q14 14 28 0" stroke="#0e1a15" strokeWidth="4" fill="none" strokeLinecap="round" />}
        {mood === "alert" && <path d="M78 142h24" stroke="#0e1a15" strokeWidth="4" fill="none" strokeLinecap="round" />}
        {mood === "expired" && <path d="M76 146q14 -13 28 0" stroke="#0e1a15" strokeWidth="4" fill="none" strokeLinecap="round" />}
        {mood !== "happy" && (
          <path d="M142 100c-5 7-8 11-8 15a8 8 0 0 0 16 0c0-4-3-8-8-15Z" fill="#7dd3fc" className="animate-drip" />
        )}
        {mood === "expired" && (
          <g transform="rotate(-14 90 92)">
            <rect x="44" y="72" width="92" height="30" rx="6" fill="none" stroke="#c0392b" strokeWidth="3.500" />
            <text x="90" y="94" textAnchor="middle" fontSize="17" fontWeight="800" fill="#c0392b" letterSpacing="2">EXPIRED</text>
          </g>
        )}
      </g>
      <g className="animate-twinkle" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <path d="M166 36l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#e8c56a" />
      </g>
      <g className="animate-twinkle" style={{ animationDelay: "1.2s", transformBox: "fill-box", transformOrigin: "center" }}>
        <path d="M12 70l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#6ff5c9" />
      </g>
    </svg>
  );
}
