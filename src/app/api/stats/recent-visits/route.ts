import { NextRequest } from 'next/server'
import { checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const limit = Math.max(1, Math.min(200, parseInt(req.nextUrl.searchParams.get('limit') || '20', 10) || 20))

    const items = await db.visit.findMany({
      orderBy: { visitedAt: 'desc' },
      take: limit,
    })

    return json(items)
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
