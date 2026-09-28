import { NextRequest } from 'next/server'
import { checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/stats/top-referrers?days=7&limit=10
// 管理员：返回近 N 天访问来源 Top N
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const url = req.nextUrl
    const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get('days') || '7', 10) || 7))
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10) || 10))

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const visits = await db.visit.findMany({
      where: {
        visitedAt: { gte: since },
        AND: [
          { referrer: { not: null } },
          { referrer: { not: '' } },
        ],
      },
      select: { referrer: true },
    })

    // 简单解析 referrer：提取 host
    const counts = new Map<string, number>()
    for (const v of visits) {
      const r = v.referrer || ''
      if (!r || r === '-') continue
      let host = r
      try {
        const u = new URL(r)
        host = u.host
      } catch {
        // 不是合法 URL，原样用
        host = r.slice(0, 80)
      }
      counts.set(host, (counts.get(host) || 0) + 1)
    }

    const items = Array.from(counts.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    return json({
      items,
      days,
      total: visits.length,
      uniqueReferrers: counts.size,
    })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
