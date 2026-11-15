import type { Metadata } from "next";
import { Fraunces, Great_Vibes, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const signature = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-sig" });

export const metadata: Metadata = {
  title: "BrandShield AI: check brand content before it ships",
  description:
    "Checks captions, emails and ads against a brand's approved rules and facts. Every issue shows the rule it breaks and a fix. A human approves.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${signature.variable}`}>
      <body>{children}</body>
    </html>
  );
}
