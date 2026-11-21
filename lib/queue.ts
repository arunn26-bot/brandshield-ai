export interface Intent {
  goal: string;
  keyMessage: string;
  cta: string;
}

export type QueueStatus = "in_review" | "approved" | "changes_requested" | "rejected";

export interface QueueItem {
  id: string;
  title: string;
  format: string;
  channel: string;
  content: string;
  intent: Intent | null;
  submittedAt: string;
  submitter: string;
  status: QueueStatus;
  /** Rule ids that were open when the draft was submitted. */
  openFindings: string[];
  /** Seeded demo data, always labelled as such in the UI. */
  demo?: boolean;
}

export const QUEUE_KEY = "brandshield.queue.v1";

export const STATUS_LABEL: Record<QueueStatus, string> = {
  in_review: "In review",
  approved: "Approved",
  changes_requested: "Changes requested",
  rejected: "Rejected",
};

export const STATUS_BADGE: Record<QueueStatus, string> = {
  in_review: "border-sky-200 bg-sky-50 text-sky-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  changes_requested: "border-amber-200 bg-amber-50 text-amber-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

export function loadQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueueItem[]) : [];
  } catch {
    return [];
  }
}

export function saveQueue(items: QueueItem[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {}
}

/** Demo workspace drafts so a first-time visitor sees a realistic queue. Always labelled demo. */
export function demoQueue(now: Date): QueueItem[] {
  const at = (daysAgo: number, h: number) => {
    const d = new Date(now.getTime() - daysAgo * 86400000);
    d.setHours(h, 5, 0, 0);
    return d.toISOString();
  };
  return [
    {
      id: "q-demo-1",
      title: "Diwali cashback push",
      format: "Instagram caption",
      channel: "Instagram",
      content: "Get ₹500 cashback on your first UPI payment. Diwali double cashback is live!",
      intent: { goal: "Conversion", keyMessage: "first-payment cashback", cta: "download PayNest" },
      submittedAt: at(0, 9),
      submitter: "Creator · you",
      status: "in_review",
      openFindings: ["CLAIM-01", "CLAIM-05"],
      demo: true,
    },
    {
      id: "q-demo-2",
      title: "Savings rate email",
      format: "Email",
      channel: "Email",
      content: "Earn 6.5% interest on your savings account.\n\nTeam PayNest",
      intent: { goal: "Consideration", keyMessage: "Nest Save interest rate", cta: "open a Nest Save" },
      submittedAt: at(1, 14),
      submitter: "Creator · you",
      status: "in_review",
      openFindings: ["CLAIM-04", "DISC-01", "EMAIL-02", "EMAIL-04"],
      demo: true,
    },
    {
      id: "q-demo-3",
      title: "UPI ad variant B",
      format: "Ad copy",
      channel: "Search ads",
      content: "Get the best payments app in India today and win big!!\n\nGuaranteed returns on your savings account.",
      intent: { goal: "Awareness", keyMessage: "simple UPI payments", cta: "download" },
      submittedAt: at(2, 11),
      submitter: "Creator · you",
      status: "changes_requested",
      openFindings: ["CLAIM-03", "CLAIM-02"],
      demo: true,
    },
  ];
}
