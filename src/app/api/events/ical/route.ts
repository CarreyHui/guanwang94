import { NextRequest } from 'next/server'
import { checkAccess, json } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateICal, eventToICal } from '@/lib/ical'

// GET /api/events/ical
// 返回 .ics 文件（iCal 日历），可导入 Google/Apple/Outlook Calendar
// 公开访问（无需 access token）也可，但这里仍要求 access token 保护
export async function GET(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const url = req.nextUrl
    const category = url.searchParams.get('category') || ''
    const tag = url.searchParams.get('tag') || ''
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '50', 10) || 50)

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (tag) where.tags = { contains: tag }

    const events = await db.event.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
    })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://guanwang94.saozi.cc.cd'
    const icalEvents = events.map((e) => eventToICal(e as any, siteUrl))
    const ics = generateICal(icalEvents, '九四班官网 - 重要事件')

    return new Response(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="guanwang94-events.ics"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
