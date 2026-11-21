import { verifyTrail } from "./audit";
import type { TrailEntry } from "./dashboard";

export interface AuditBundle {
  format: "brandshield.audit.bundle";
  version: 1;
  exportedAt: string;
  rulebook: string;
  entries: TrailEntry[];
  rootHash: string;
}

export function exportBundle(entries: TrailEntry[], rulebook: string): AuditBundle {
  return {
    format: "brandshield.audit.bundle",
    version: 1,
    exportedAt: new Date().toISOString(),
    rulebook,
    entries,
    rootHash: entries[entries.length - 1]?.hash ?? "GENESIS",
  };
}

export interface BundleVerification {
  ok: boolean;
  brokenAt: number;
  rootHashOk: boolean;
  message: string;
}

/** Recomputes every hash in the chain. No server, no database, no trust required. */
export async function verifyBundle(bundle: unknown): Promise<BundleVerification> {
  const b = bundle as Partial<AuditBundle>;
  if (
    !b ||
    b.format !== "brandshield.audit.bundle" ||
    !Array.isArray(b.entries)
  ) {
    return { ok: false, brokenAt: -1, rootHashOk: false, message: "Not a BrandShield audit bundle." };
  }
  const brokenAt = await verifyTrail(b.entries as TrailEntry[]);
  const rootHashOk = b.rootHash === (b.entries[b.entries.length - 1]?.hash ?? "GENESIS");
  const ok = brokenAt === -1 && rootHashOk;
  return {
    ok,
    brokenAt,
    rootHashOk,
    message: ok
      ? `Bundle verified: ${b.entries.length} entries, chain and root hash intact.`
      : brokenAt >= 0
        ? `Entry #${b.entries[brokenAt]?.n ?? brokenAt + 1} does not match its hash. The chain was altered.`
        : "The root hash does not match the last entry.",
  };
}
