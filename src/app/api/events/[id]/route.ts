import { NextRequest } from 'next/server'
import { checkAccess, checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const { id } = await ctx.params
    const event = await db.event.findUnique({ where: { id } })
    if (!event) return json({ error: '事件不存在' }, 404)

    // viewCount +1（不阻塞返回）
    db.event.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

    return json({ ...event, viewCount: event.viewCount + 1 })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const { id } = await ctx.params
    const existing = await db.event.findUnique({ where: { id } })
    if (!existing) return json({ error: '事件不存在' }, 404)

    const body = await req.json().catch(() => ({}))
    const {
      title, summary, content, coverImage, category,
      priority, pinned, tags, publishedAt,
    } = body || {}

    const updated = await db.event.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: String(title) } : {}),
        ...(summary !== undefined ? { summary: String(summary) } : {}),
        ...(content !== undefined ? { content: String(content) } : {}),
        ...(coverImage !== undefined ? { coverImage: coverImage ? String(coverImage) : null } : {}),
        ...(category !== undefined ? { category: String(category) } : {}),
        ...(priority !== undefined ? { priority: String(priority) } : {}),
        ...(pinned !== undefined ? { pinned: Number(pinned) || 0 } : {}),
        ...(tags !== undefined ? { tags: String(tags) } : {}),
        ...(publishedAt !== undefined ? { publishedAt: new Date(publishedAt) } : {}),
      },
    })
    return json(updated)
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const { id } = await ctx.params
    const existing = await db.event.findUnique({ where: { id } })
    if (!existing) return json({ error: '事件不存在' }, 404)

    await db.event.delete({ where: { id } })
    return json({ ok: true })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
