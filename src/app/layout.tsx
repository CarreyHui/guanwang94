import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "九四班官网 · Guanwang94",
  description: "九四班官方网站 - 志存高远 · 脚踏实地 · 团结奋进。班级重要事件、风采、表白墙、留言等。",
  keywords: ["九四班", "Guanwang94", "班级官网", "Class of 94", "班级风采"],
  authors: [{ name: "九四班" }],
  icons: {
    icon: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "九四班官网 · Guanwang94",
    description: "志存高远 · 脚踏实地 · 团结奋进",
    siteName: "九四班官网",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "九四班官网 · Guanwang94",
    description: "志存高远 · 脚踏实地 · 团结奋进",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
