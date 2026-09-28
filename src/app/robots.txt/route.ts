const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  'https://guanwang94.saozi.cc.cd'

export async function GET() {
  const base = SITE_URL.replace(/\/$/, '')
  const body = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${base}/sitemap.xml
`
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
