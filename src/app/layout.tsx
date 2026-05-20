import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Korean Lyrics Learn",
  description: "Learn Korean with music videos, lyrics search, and Chinese glosses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, "dark")}>
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
