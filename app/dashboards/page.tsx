import type { Metadata } from "next";
import Nav from "@/components/Nav";
import DashboardsGallery from "@/components/DashboardsGallery";

export const metadata: Metadata = {
  title: "Dashboards · BrandShield",
  description: "All BrandShield dashboards in one place: Attack lab, Governance, Brand Kit, Guideline Health, Expiry inbox and Audit trail.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-night">
      <Nav />
      <div className="pt-10">
        <DashboardsGallery />
      </div>
    </main>
  );
}
