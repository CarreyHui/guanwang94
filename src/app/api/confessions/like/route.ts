import { NextRequest } from 'next/server'
import { checkAccess, json } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const body = await req.json().catch(() => ({}))
    const { id } = body || {}
    if (!id) return json({ error: 'id 不能为空' }, 400)

    const existing = await db.confession.findUnique({ where: { id: String(id) } })
    if (!existing) return json({ error: '表白不存在' }, 404)

    const updated = await db.confession.update({
      where: { id: String(id) },
      data: { likes: { increment: 1 } },
    })
    return json({ ok: true, likes: updated.likes })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
