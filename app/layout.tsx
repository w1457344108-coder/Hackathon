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
      <body>
        <header className="nav-header">
          <nav className="nav-container">
            <a href="/" className="nav-brand">
              <span className="nav-logo">CBDA</span>
              <span className="nav-divider" />
              <span className="nav-subtitle">Cross-Border Data Analyst</span>
            </a>
            <div className="nav-links">
              <a href="/" className="nav-link active">Dashboard</a>
              <a href="#evidence" className="nav-link">Evidence</a>
              <a href="#export" className="nav-link">Export</a>
            </div>
          </nav>
        </header>
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
