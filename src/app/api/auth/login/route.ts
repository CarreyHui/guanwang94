import { NextRequest } from 'next/server'
import { tryAdminLogin, json } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { username, password } = body || {}
    if (!username || !password) {
      return json({ error: '用户名和密码不能为空' }, 400)
    }
    const adminToken = tryAdminLogin(String(username), String(password))
    if (!adminToken) {
      return json({ error: '用户名或密码错误' }, 401)
    }
    return json({ adminToken, username })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
