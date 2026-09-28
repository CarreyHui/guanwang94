import { NextRequest } from 'next/server'
import { checkAccess, json } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/access/theme-color
// 公开（需 access）返回当前主题色，前端首屏用
export async function GET(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const config = await db.siteConfig.findUnique({ where: { id: 'default' } })
    return json({
      themeColor: config?.themeColor || 'emerald',
      customPrimaryColor: config?.customPrimaryColor || '',
    })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
