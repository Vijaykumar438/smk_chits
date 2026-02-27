import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SMK Chits — Chit Fund Management",
  description:
    "Complete chit fund management suite for Seethala Murali Krishna. Manage members, groups, auctions, collections, and reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SMK Chits" />
        <meta name="theme-color" content="#1B5E20" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-smk-cream`}
      >
        {children}
      </body>
    </html>
  );
}
