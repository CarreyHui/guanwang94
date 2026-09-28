import { NextRequest } from 'next/server'
import { checkAdmin, getBearerToken, verifyAccessToken, json } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    const isAdmin = admin.ok
    const username = admin.ok ? admin.username : null

    // 顺便返回 access 是否仍然有效
    let hasAccess = false
    const signed = getBearerToken(req) || req.cookies.get('access_token')?.value
    if (signed) {
      const token = verifyAccessToken(signed)
      if (token) {
        const config = await db.siteConfig.findUnique({ where: { id: 'default' } })
        if (config && config.accessToken === token) hasAccess = true
      }
    }

    return json({ isAdmin, username, hasAccess })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
