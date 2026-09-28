import { NextRequest } from 'next/server'
import { checkAccess, json } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/confessions/top?days=7&limit=10
// 返回近 N 天按 likes + reactions 总数排序的 Top N 表白墙
export async function GET(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const url = req.nextUrl
    const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get('days') || '7', 10) || 7))
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10) || 10))

    // 计算截止时间
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // 查近 N 天所有表白墙 + 反应计数
    const items = await db.confession.findMany({
      where: { createdAt: { gte: since } },
      include: {
        reactions: {
          select: { emoji: true },
        },
      },
      orderBy: [{ likes: 'desc' }, { createdAt: 'desc' }],
      take: limit * 3, // 多拉一些，然后客户端按「likes + reactions 总数」重新排
    })

    // 计算「热度分」= likes + reactions 总数
    const scored = items.map((c) => {
      const reactionCount = c.reactions.length
      const score = c.likes + reactionCount
      const { reactions: _omit, ...rest } = c
      return { ...rest, reactionCount, score }
    })

    scored.sort((a, b) => b.score - a.score || b.createdAt.getTime() - a.createdAt.getTime())

    return json({
      items: scored.slice(0, limit),
      days,
      generatedAt: new Date().toISOString(),
    })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
