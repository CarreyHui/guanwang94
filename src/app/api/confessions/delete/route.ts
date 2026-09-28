import { NextRequest } from 'next/server'
import { checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return json({ error: '缺少 id 参数' }, 400)

    const existing = await db.confession.findUnique({ where: { id } })
    if (!existing) return json({ error: '表白不存在' }, 404)

    await db.confession.delete({ where: { id } })
    return json({ ok: true })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
