import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cross-Border Data Policy Multi-Agent Analyst",
  description:
    "A hackathon-ready multi-agent dashboard for analyzing cross-border data policy scenarios using UN ESCAP-aligned mock data."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
