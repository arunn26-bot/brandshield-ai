export default function ScoreRing({
  score,
  size = 64,
  label = true,
}: {
  score: number;
  size?: number;
  label?: boolean;
}) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const color = clamped >= 85 ? "#0a7a5c" : clamped >= 60 ? "#c98a0b" : "#d64b3c";

  return (
    <div className="flex items-center gap-2.5" role="img" aria-label={`Brand score ${clamped} out of 100`}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="#e6e4d9" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped / 100)}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="font-display font-medium" style={{ fontSize: size * 0.3 }}>
            {clamped}
          </span>
          <span className="mt-0.5 text-[8px] text-muted">/100</span>
        </div>
      </div>
      {label && (
        <div className="text-xs leading-4 text-muted">
          Brand
          <br />
          score
        </div>
      )}
    </div>
  );
}
