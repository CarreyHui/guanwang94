import { NextRequest } from 'next/server'
import { signAccessToken, json } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { token } = body || {}
    if (!token) {
      return json({ error: '令牌不能为空' }, 400)
    }
    const config = await db.siteConfig.findUnique({ where: { id: 'default' } })
    if (!config || config.accessToken !== String(token)) {
      return json({ error: '访问令牌不正确' }, 401)
    }
    return json({ signed: signAccessToken(String(token)) })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
