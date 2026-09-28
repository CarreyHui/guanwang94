import { NextRequest } from 'next/server'
import { checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/stats/visitor-types?days=7
// 管理员：返回近 N 天「新访客 vs 回访」统计
// 逻辑：ipHash 第一次出现（全历史范围）= 新访客；之前出现过 = 回访
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const url = req.nextUrl
    const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get('days') || '7', 10) || 7))

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // 拉近 N 天所有 visit（带 ipHash）
    const recentVisits = await db.visit.findMany({
      where: {
        visitedAt: { gte: since },
        ipHash: { not: null },
      },
      select: { ipHash: true, visitedAt: true },
      orderBy: { visitedAt: 'asc' },
    })

    // 对每个 ipHash，判断它在 recentVisits 中是首次出现还是已出现过
    // 但「新访客」定义应该是「全历史首次」，所以需要查全历史
    const recentIpHashes = new Set(recentVisits.map((v) => v.ipHash!).filter(Boolean))

    // 拉这些 ipHash 在 since 之前的访问记录（判断是否历史回访）
    const beforeSince = new Date(since.getTime() - 365 * 24 * 60 * 60 * 1000) // 1 年内
    const historicalVisits = await db.visit.findMany({
      where: {
        visitedAt: { gte: beforeSince, lt: since },
        ipHash: { in: Array.from(recentIpHashes) },
      },
      select: { ipHash: true },
      distinct: ['ipHash'],
    })
    const historicalIpHashes = new Set(historicalVisits.map((v) => v.ipHash).filter(Boolean))

    // 统计近 N 天新访客 vs 回访
    const recentIpSet = new Set<string>()
    let newCount = 0
    let returningCount = 0
    for (const v of recentVisits) {
      const ip = v.ipHash
      if (!ip) continue
      // 历史出现过 OR 本次窗口内已出现过 = 回访
      if (historicalIpHashes.has(ip) || recentIpSet.has(ip)) {
        returningCount++
      } else {
        newCount++
      }
      recentIpSet.add(ip)
    }

    const total = newCount + returningCount
    const newPct = total > 0 ? Math.round((newCount / total) * 100) : 0
    const returningPct = total > 0 ? 100 - newPct : 0

    return json({
      newCount,
      returningCount,
      total,
      newPct,
      returningPct,
      uniqueVisitors: recentIpSet.size,
      days,
    })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
