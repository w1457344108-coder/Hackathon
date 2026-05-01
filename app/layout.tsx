import type { Metadata } from "next";
import { Fustat, Inter, Noto_Sans, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-schibsted"
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter"
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto"
});

const fustat = Fustat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fustat"
});

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
    <html
      lang="en"
      className={`${schibsted.variable} ${inter.variable} ${notoSans.variable} ${fustat.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
