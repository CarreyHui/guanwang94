import type { Metadata, Viewport } from "next";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://guanwang94.saozi.cc.cd";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "九四班官网 · Guanwang94",
    template: "%s · 九四班官网",
  },
  description:
    "九四班官方网站 - 志存高远 · 脚踏实地 · 团结奋进。班级重要事件、风采、表白墙、留言、归档、关于我们。",
  keywords: [
    "九四班",
    "Guanwang94",
    "班级官网",
    "Class of 94",
    "班级风采",
    "九四班官网",
    "班级活动",
  ],
  authors: [{ name: "九四班" }],
  creator: "九四班",
  publisher: "九四班",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/favicon.svg" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "九四班官网 · Guanwang94",
    description: "志存高远 · 脚踏实地 · 团结奋进 · 记录九四班每一次重要时刻",
    siteName: "九四班官网",
    type: "website",
    locale: "zh_CN",
    images: [
      {
        url: "https://picsum.photos/seed/gw94og/1200/630",
        width: 1200,
        height: 630,
        alt: "九四班官网 Guanwang94",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "九四班官网 · Guanwang94",
    description: "志存高远 · 脚踏实地 · 团结奋进",
    images: ["https://picsum.photos/seed/gw94og/1200/630"],
  },
  appleWebApp: {
    title: "九四班官网",
    statusBarStyle: "black-translucent",
    capable: true,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: "九四班官网 RSS" }],
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#064e3b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// JSON-LD 结构化数据
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "九四班",
      alternateName: "Guanwang94",
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.svg`,
      slogan: "志存高远 · 脚踏实地 · 团结奋进",
      description:
        "九四班官方网站，记录班级重要事件、风采、表白墙、留言等",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "九四班官网",
      inLanguage: "zh-CN",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: "九四班官网",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "zh-CN",
      description: "九四班官方网站 - 志存高远 · 脚踏实地 · 团结奋进",
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
