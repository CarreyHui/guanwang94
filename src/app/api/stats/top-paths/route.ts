import { NextRequest } from 'next/server'
import { checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/stats/top-paths?days=7&limit=10
// 管理员：返回近 N 天访问量 Top N 的路径
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const url = req.nextUrl
    const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get('days') || '7', 10) || 7))
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10) || 10))

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Prisma 不支持直接 groupBy + count 后排序（SQLite 限制），拉所有再聚合
    const visits = await db.visit.findMany({
      where: {
        visitedAt: { gte: since },
        path: { not: null },
      },
      select: { path: true },
    })

    // 按 path 聚合计数
    const counts = new Map<string, number>()
    for (const v of visits) {
      const p = v.path || '/'
      counts.set(p, (counts.get(p) || 0) + 1)
    }

    // 排序取 Top N
    const items = Array.from(counts.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    return json({
      items,
      days,
      total: visits.length,
      uniquePaths: counts.size,
    })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
