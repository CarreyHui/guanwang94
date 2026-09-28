import { NextRequest } from 'next/server'
import { checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const { id } = await ctx.params
    const existing = await db.event.findUnique({ where: { id } })
    if (!existing) return json({ error: '事件不存在' }, 404)

    const updated = await db.event.update({
      where: { id },
      data: { pinned: existing.pinned ? 0 : 1 },
    })
    return json({ ok: true, pinned: updated.pinned })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
