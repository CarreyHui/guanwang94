import { NextRequest } from 'next/server'
import { checkAccess, json } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/access/fun-link
// 公开（需 access）：返回有趣功能链接配置
export async function GET(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const config = await db.siteConfig.findUnique({ where: { id: 'default' } })
    return json({
      enabled: (config?.funEnabled ?? 0) > 0,
      url: config?.funUrl || '',
      title: config?.funTitle || '有趣功能',
    })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
