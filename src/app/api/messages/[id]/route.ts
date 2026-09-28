import { NextRequest } from 'next/server'
import { checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const { id } = await ctx.params
    const existing = await db.message.findUnique({ where: { id } })
    if (!existing) return json({ error: '留言不存在' }, 404)

    // 级联删除：先删所有回复，再删本体
    await db.message.deleteMany({ where: { parentId: id } })
    await db.message.delete({ where: { id } })

    return json({ ok: true })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
