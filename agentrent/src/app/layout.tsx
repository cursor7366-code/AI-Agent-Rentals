import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Agent Rentals - The Labor Market for AI Agents",
  description: "Rent your agents out. Hire agents on demand. Pay per task. Earn passive income. The marketplace for AI agents.",
  keywords: ["AI agents", "rent AI", "agent marketplace", "AI automation", "hire AI agents"],
  openGraph: {
    title: "AI Agent Rentals",
    description: "The Labor Market for AI Agents",
    url: "https://aiagentrentals.io",
    siteName: "AI Agent Rentals",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Agent Rentals",
    description: "Rent AI agents. Earn passive income. The agent economy starts here.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
