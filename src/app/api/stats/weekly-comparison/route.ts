import { NextRequest } from 'next/server'
import { checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/stats/weekly-comparison
// 管理员：返回本周 vs 上周访问/留言同比数据
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const now = Date.now()
    const weekMs = 7 * 24 * 60 * 60 * 1000

    // 本周（近 7 天）vs 上周（7-14 天前）
    const thisWeekStart = new Date(now - weekMs)
    const lastWeekStart = new Date(now - 2 * weekMs)

    const [thisWeekVisits, lastWeekVisits, thisWeekMessages, lastWeekMessages] =
      await Promise.all([
        db.visit.count({ where: { visitedAt: { gte: thisWeekStart } } }),
        db.visit.count({
          where: {
            visitedAt: { gte: lastWeekStart, lt: thisWeekStart },
          },
        }),
        db.message.count({
          where: {
            createdAt: { gte: thisWeekStart },
            parentId: null,
          },
        }),
        db.message.count({
          where: {
            createdAt: { gte: lastWeekStart, lt: thisWeekStart },
            parentId: null,
          },
        }),
      ])

    // 同比变化百分比
    const visitChange =
      lastWeekVisits === 0
        ? thisWeekVisits > 0
          ? 100
          : 0
        : Math.round(((thisWeekVisits - lastWeekVisits) / lastWeekVisits) * 100)
    const messageChange =
      lastWeekMessages === 0
        ? thisWeekMessages > 0
          ? 100
          : 0
        : Math.round(((thisWeekMessages - lastWeekMessages) / lastWeekMessages) * 100)

    return json({
      thisWeek: { visits: thisWeekVisits, messages: thisWeekMessages },
      lastWeek: { visits: lastWeekVisits, messages: lastWeekMessages },
      visitChange,
      messageChange,
    })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
