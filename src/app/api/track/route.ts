import { NextRequest } from 'next/server'
import { checkAccess, hashIp, json } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const body = await req.json().catch(() => ({}))
    const { path, referrer } = body || {}

    const ua = req.headers.get('user-agent') || null
    const visit = await db.visit.create({
      data: {
        path: path ? String(path).slice(0, 255) : null,
        referrer: referrer ? String(referrer).slice(0, 255) : null,
        ipHash: hashIp(req),
        ua: ua ? ua.slice(0, 255) : null,
      },
    })
    return json({ ok: true, id: visit.id }, 201)
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
