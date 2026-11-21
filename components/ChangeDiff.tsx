import { diffWords, wordCount, type DiffPart } from "@/lib/diff";

export default function ChangeDiff({
  before, after, note, onDismiss,
}: {
  before: string; after: string; note?: string; onDismiss: () => void;
}) {
  const parts = diffWords(before, after);
  const added = wordCount(parts, "add");
  const removed = wordCount(parts, "del");

  return (
    <div className="mt-6 rounded-3xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Last applied change</div>
          <div className="mt-1 text-sm">
            {note ?? "Only the cited spans changed."}{" "}
            <span className="font-medium text-emerald-700">+{added}</span>{" "}
            <span className="text-muted">words,</span>{" "}
            <span className="font-medium text-red-600">−{removed}</span>{" "}
            <span className="text-muted">words</span>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:border-ink hover:text-ink"
        >
          Dismiss
        </button>
      </div>
      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">
        {parts.map((p: DiffPart, i) =>
          p.kind === "add" ? (
            <ins key={i} className="rounded bg-emerald-100 px-0.5 text-emerald-900 no-underline">
              {p.text}
            </ins>
          ) : p.kind === "del" ? (
            <del key={i} className="rounded bg-red-100 px-0.5 text-red-800">
              {p.text}
            </del>
          ) : (
            <span key={i}>{p.text}</span>
          )
        )}
      </p>
    </div>
  );
}
