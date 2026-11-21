import type { Metadata } from "next";
import AppShell from "@/components/app/AppShell";

export const metadata: Metadata = {
  title: "Workspace · BrandShield",
  description:
    "The BrandShield workbench: draft with an intent card, submit to the review queue, and keep a hash-chained audit trail. PayNest demo workspace.",
};

export default function Page() {
  return <AppShell />;
}
