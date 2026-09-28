const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  'https://guanwang94.saozi.cc.cd'

export async function GET() {
  const base = SITE_URL.replace(/\/$/, '')
  const manifest = {
    name: '九四班官网',
    short_name: '九四班',
    description: '九四班官方网站 · 记录我们的青春',
    start_url: `${base}/`,
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#10b981',
    icons: [
      {
        src: `${base}/logo.svg`,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: '重要事件',
        short_name: '事件',
        description: '查看班级重要事件',
        url: `${base}/?tab=events`,
      },
      {
        name: '班级风采',
        short_name: '风采',
        description: '查看班级风采墙',
        url: `${base}/?tab=confessions`,
      },
      {
        name: '关于我们',
        short_name: '关于',
        description: '了解九四班',
        url: `${base}/?tab=about`,
      },
    ],
  }
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
