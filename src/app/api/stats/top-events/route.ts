import { NextRequest } from 'next/server'
import { checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const limit = Math.max(1, Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') || '10', 10) || 10))

    const items = await db.event.findMany({
      orderBy: { viewCount: 'desc' },
      take: limit,
      select: { id: true, title: true, viewCount: true },
    })

    return json(items)
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
