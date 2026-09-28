import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { db } from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://guanwang94.saozi.cc.cd";

// 动态 metadata：从 DB 读 siteConfig（站点标题/描述/Logo/OG）
// revalidate 1 小时，平衡性能与实时性
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  // 默认值
  let siteTitle = "九四班官网 · Guanwang94";
  let siteDescription =
    "九四班官方网站 - 志存高远 · 脚踏实地 · 团结奋进。班级重要事件、风采、表白墙、留言等。";
  let logoUrl = "/favicon.svg";
  let ogImageUrl = "https://picsum.photos/seed/gw94og/1200/630";

  try {
    const config = await db.siteConfig.findUnique({ where: { id: "default" } });
    if (config) {
      if (config.siteTitle) siteTitle = config.siteTitle;
      if (config.siteDescription) siteDescription = config.siteDescription;
      if (config.logoUrl) logoUrl = config.logoUrl;
      if (config.ogImageUrl) ogImageUrl = config.ogImageUrl;
    }
  } catch {
    // DB 未就绪时用默认值
  }

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: siteTitle,
      template: `%s · 九四班官网`,
    },
    description: siteDescription,
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
        { url: logoUrl, type: logoUrl.endsWith(".svg") ? "image/svg+xml" : "image/png" },
      ],
      apple: [{ url: logoUrl }],
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      siteName: "九四班官网",
      type: "website",
      locale: "zh_CN",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: siteTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      images: [ogImageUrl],
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
}

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
        <ServiceWorkerRegister />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
