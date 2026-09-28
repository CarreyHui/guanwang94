import { NextRequest } from 'next/server'
import { checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) {
      return json({ error: admin.message }, admin.status)
    }
    const config = await db.siteConfig.findUnique({ where: { id: 'default' } })
    return json({ accessToken: config?.accessToken || '' })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) {
      return json({ error: admin.message }, admin.status)
    }
    const body = await req.json().catch(() => ({}))
    const { token } = body || {}
    if (!token || typeof token !== 'string') {
      return json({ error: '令牌不能为空' }, 400)
    }
    const updated = await db.siteConfig.upsert({
      where: { id: 'default' },
      create: { id: 'default', accessToken: token },
      update: { accessToken: token },
    })
    return json({ ok: true, accessToken: updated.accessToken })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
