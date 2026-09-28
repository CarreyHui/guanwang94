import { db } from '@/lib/db'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  'https://guanwang94.saozi.cc.cd'

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  try {
    const events = await db.event.findMany({
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      take: 20,
      select: {
        id: true,
        title: true,
        summary: true,
        publishedAt: true,
        category: true,
      },
    })

    const base = SITE_URL.replace(/\/$/, '')
    const items = events
      .map(
        (e) => `    <item>
      <title>${xmlEscape(e.title)}</title>
      <link>${base}/?event=${encodeURIComponent(e.id)}</link>
      <guid isPermaLink="false">${e.id}</guid>
      <description>${xmlEscape(e.summary || '')}</description>
      <category>${xmlEscape(e.category || '')}</category>
      <pubDate>${new Date(e.publishedAt).toUTCString()}</pubDate>
    </item>`
      )
      .join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>九四班官网 - 重要事件</title>
    <link>${base}</link>
    <description>九四班官方网站 · 班级动态 RSS</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=600',
      },
    })
  } catch (e: any) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><link>/</link><description>${e?.message || 'error'}</description></channel></rss>`,
      { status: 500, headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } }
    )
  }
}
