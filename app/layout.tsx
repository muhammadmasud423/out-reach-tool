import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScaleSynq Outreach — Premium Email Outreach Platform",
  description: "Bulk cold email outreach at scale with automated warmup, smart sequences, and AI-powered personalization.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col" style={{ background: "#0f0f1a" }}>
        {children}
      </body>
    </html>
  );
}
