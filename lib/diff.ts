export type DiffPart = { kind: "same" | "add" | "del"; text: string };

function tokenize(s: string): string[] {
  return s.match(/\s+|\S+/g) ?? [];
}

/** Token-level diff that keeps whitespace, so the result reads like the draft. */
export function diffWords(before: string, after: string): DiffPart[] {
  if (before === after) return before ? [{ kind: "same", text: before }] : [];
  const a = tokenize(before);
  const b = tokenize(after);
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffPart[] = [];
  const push = (kind: DiffPart["kind"], text: string) => {
    const prev = out[out.length - 1];
    if (prev && prev.kind === kind) prev.text += text;
    else out.push({ kind, text });
  };

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push("same", a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push("del", a[i]);
      i++;
    } else {
      push("add", b[j]);
      j++;
    }
  }
  while (i < n) push("del", a[i++]);
  while (j < m) push("add", b[j++]);
  return out;
}

export function wordCount(parts: DiffPart[], kind: DiffPart["kind"]): number {
  return parts
    .filter((p) => p.kind === kind)
    .reduce((n, p) => n + p.text.trim().split(/\s+/).filter(Boolean).length, 0);
}
