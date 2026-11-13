import { Finding } from "@/lib/types";

export default function Annotated({
  text, findings, size = "md", activeId, onSelect,
}: {
  text: string; findings: Finding[]; size?: "sm" | "md" | "lg";
  activeId?: string | null; onSelect?: (id: string) => void;
}) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  findings
    .filter((f) => f.end > f.start)
    .forEach((f) => {
      if (f.start > cursor) parts.push(text.slice(cursor, f.start));
      parts.push(
        <span
          key={f.id}
          onClick={onSelect ? () => onSelect(f.id) : undefined}
          className={`mark-${f.severity} rounded-sm px-0.5 ${onSelect ? "cursor-pointer" : ""} ${
            activeId === f.id ? "ring-2 ring-ink/70" : ""
          }`}
        >
          {text.slice(f.start, f.end)}
          <sup className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-white">
            {f.id}
          </sup>
        </span>
      );
      cursor = f.end;
    });
  parts.push(text.slice(cursor));
  return (
    <p className={`whitespace-pre-wrap ${size === "lg" ? "text-xl leading-9 md:text-2xl md:leading-10" : size === "sm" ? "text-[15px] leading-7" : "text-base leading-8"}`}>
      {parts}
    </p>
  );
}
