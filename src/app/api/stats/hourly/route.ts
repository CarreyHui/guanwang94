import { NextRequest } from 'next/server'
import { checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/stats/hourly
// 管理员：返回近 7 天访问按小时聚合
// - hourly: 24 个数字（0-23 点的访问总数）
// - heatmap: 7 天 × 24 小时的二维数组（rows=7 周一到周日，cols=24 小时）
// - total: 总访问数
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    // 拉近 7 天所有访问
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const visits = await db.visit.findMany({
      where: { visitedAt: { gte: since } },
      select: { visitedAt: true },
    })

    // 24 小时分布
    const hourly: number[] = new Array(24).fill(0)
    // 7×24 热力图（row=dayOfWeek 0=周日..6=周六，col=hour 0-23）
    const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0))

    for (const v of visits) {
      const d = v.visitedAt
      const h = d.getHours()
      const dow = d.getDay() // 0=周日..6=周六
      hourly[h]++
      heatmap[dow][h]++
    }

    // 重新排序热力图为 周一..周日（更符合中文习惯）
    const heatmapMonFirst = [
      heatmap[1], // 周一
      heatmap[2],
      heatmap[3],
      heatmap[4],
      heatmap[5],
      heatmap[6], // 周六
      heatmap[0], // 周日
    ]

    // 找最大值用于热力图色深
    const maxCell = Math.max(1, ...heatmapMonFirst.flat())

    return json({
      hourly,
      heatmap: heatmapMonFirst,
      total: visits.length,
      maxCell,
      days: 7,
    })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
