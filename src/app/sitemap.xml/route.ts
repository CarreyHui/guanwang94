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
    const base = SITE_URL.replace(/\/$/, '')

    const events = await db.event.findMany({
      orderBy: [{ publishedAt: 'desc' }],
      take: 100,
      select: { id: true, updatedAt: true, publishedAt: true },
    })

    const today = new Date().toISOString()

    const urls = [
      `    <url>
      <loc>${base}/</loc>
      <lastmod>${today}</lastmod>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>`,
      ...events.map((e) => {
        const lm = new Date(e.updatedAt || e.publishedAt).toISOString()
        return `    <url>
      <loc>${base}/?event=${encodeURIComponent(e.id)}</loc>
      <lastmod>${lm}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`
      }),
    ]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=600',
      },
    })
  } catch (e: any) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { status: 500, headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
    )
  }
}
