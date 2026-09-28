import { NextRequest } from 'next/server'
import { checkAccess, json } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/confessions/top?days=7&limit=10&type=confession&sort=score
// 返回近 N 天按指定维度排序的 Top N 表白墙
// days=0 表示全部历史；type 为空表示所有类型
// sort: score=likes+reactions 总分（默认），likes=仅点赞数，reactions=仅反应数
export async function GET(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const url = req.nextUrl
    const daysRaw = parseInt(url.searchParams.get('days') || '7', 10) || 7
    const days = Math.min(90, Math.max(0, daysRaw))
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10) || 10))
    const type = url.searchParams.get('type') || ''
    const ALLOWED_TYPES = ['confession', 'thanks', 'bless', 'complain', 'wish']
    const typeFilter = ALLOWED_TYPES.includes(type) ? type : ''
    const sortRaw = url.searchParams.get('sort') || 'score'
    const sort = ['score', 'likes', 'reactions'].includes(sortRaw) ? sortRaw : 'score'

    // 计算截止时间（days=0 时不限制）
    const since = days > 0 ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined

    // 构造 where
    const where: Record<string, unknown> = {}
    if (since) where.createdAt = { gte: since }
    if (typeFilter) where.type = typeFilter

    // 查表白墙 + 反应计数
    const items = await db.confession.findMany({
      where,
      include: {
        reactions: {
          select: { emoji: true },
        },
      },
      orderBy: [{ likes: 'desc' }, { createdAt: 'desc' }],
      take: limit * 3,
    })

    // 计算「热度分」= likes + reactions 总数
    const scored = items.map((c) => {
      const reactionCount = c.reactions.length
      const score = c.likes + reactionCount
      const { reactions: _omit, ...rest } = c
      return { ...rest, reactionCount, score }
    })

    // 按指定维度排序
    scored.sort((a, b) => {
      if (sort === 'likes') {
        return b.likes - a.likes || b.createdAt.getTime() - a.createdAt.getTime()
      }
      if (sort === 'reactions') {
        return b.reactionCount - a.reactionCount || b.createdAt.getTime() - a.createdAt.getTime()
      }
      // score
      return b.score - a.score || b.createdAt.getTime() - a.createdAt.getTime()
    })

    return json({
      items: scored.slice(0, limit),
      days,
      type: typeFilter,
      sort,
      generatedAt: new Date().toISOString(),
    })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
