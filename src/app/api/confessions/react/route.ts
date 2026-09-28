import { NextRequest } from 'next/server'
import { checkAccess, hashIp, json } from '@/lib/auth'
import { db } from '@/lib/db'

// PATCH /api/confessions/react
// body: { confessionId, emoji }
// 切换 emoji 反应：已存在则删除，不存在则创建
// 返回更新后的该 confession 的所有 reactions 统计

const ALLOWED_EMOJIS = ['👍', '❤️', '🎉', '🚀', '😢', '😮']

export async function PATCH(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const body = await req.json().catch(() => ({}))
    const { confessionId, emoji } = body || {}
    if (!confessionId || typeof confessionId !== 'string') {
      return json({ error: 'confessionId 不能为空' }, 400)
    }
    if (!emoji || typeof emoji !== 'string' || !ALLOWED_EMOJIS.includes(emoji)) {
      return json({ error: 'emoji 不合法，支持：' + ALLOWED_EMOJIS.join(' ') }, 400)
    }

    const ipHash = hashIp(req)

    // 查现有反应
    const existing = await db.confessionReaction.findUnique({
      where: {
        confessionId_ipHash_emoji: { confessionId, ipHash, emoji },
      },
    })

    if (existing) {
      // 取消反应
      await db.confessionReaction.delete({ where: { id: existing.id } })
    } else {
      // 创建反应
      await db.confessionReaction.create({
        data: { confessionId, emoji, ipHash },
      })
    }

    // 统计该 confession 各 emoji 的计数
    const all = await db.confessionReaction.findMany({
      where: { confessionId },
      select: { emoji: true },
    })
    const counts: Record<string, number> = {}
    for (const r of all) {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1
    }

    // 当前用户已反应的 emoji 列表
    const myReactions = await db.confessionReaction.findMany({
      where: { confessionId, ipHash },
      select: { emoji: true },
    })

    return json({
      ok: true,
      counts,
      myReactions: myReactions.map((r) => r.emoji),
      toggled: !existing, // true=刚反应，false=刚取消
    })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}

// GET /api/confessions/react?confessionId=xxx
// 返回该 confession 的所有 emoji 反应统计 + 当前用户的反应
export async function GET(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const confessionId = req.nextUrl.searchParams.get('confessionId') || ''
    if (!confessionId) {
      return json({ error: 'confessionId 不能为空' }, 400)
    }

    const ipHash = hashIp(req)

    const [all, myReactions] = await Promise.all([
      db.confessionReaction.findMany({
        where: { confessionId },
        select: { emoji: true },
      }),
      db.confessionReaction.findMany({
        where: { confessionId, ipHash },
        select: { emoji: true },
      }),
    ])

    const counts: Record<string, number> = {}
    for (const r of all) {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1
    }

    return json({
      counts,
      myReactions: myReactions.map((r) => r.emoji),
    })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
