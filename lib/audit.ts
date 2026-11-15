export const TRAIL_KEY = "brandshield.trail.v2";

export type Decision = "approved" | "approved_override" | "changes_requested" | "rejected";

export interface AuditEntry {
  n: number;
  at: string;
  reviewer: string;
  role: string;
  decision: Decision;
  comment: string;
  format: string;
  contentHash: string;
  contentPreview: string;
  content: string;
  openFindings: string[];
  rulebook: string;
  prevHash: string;
  hash: string;
}

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Fixed field order so the same entry always hashes the same way. */
function payload(e: Omit<AuditEntry, "hash">): string {
  return JSON.stringify([
    e.n, e.at, e.reviewer, e.role, e.decision, e.comment, e.format,
    e.contentHash, e.contentPreview, e.content, e.openFindings, e.rulebook, e.prevHash,
  ]);
}

export async function createEntry(
  prev: AuditEntry | undefined,
  data: Omit<AuditEntry, "n" | "at" | "prevHash" | "hash">,
  now: Date
): Promise<AuditEntry> {
  const base = {
    n: (prev?.n ?? 0) + 1,
    at: now.toISOString(),
    ...data,
    prevHash: prev?.hash ?? "GENESIS",
  };
  return { ...base, hash: await sha256(payload(base)) };
}

/** Returns the index of the first broken entry, or -1 if the whole trail is intact. */
export async function verifyTrail(entries: AuditEntry[]): Promise<number> {
  let prev = "GENESIS";
  for (let i = 0; i < entries.length; i++) {
    const { hash, ...rest } = entries[i];
    if (rest.prevHash !== prev) return i;
    if ((await sha256(payload(rest))) !== hash) return i;
    prev = hash;
  }
  return -1;
}
