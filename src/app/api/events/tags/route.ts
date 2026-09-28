import { NextRequest } from 'next/server'
import { checkAccess, json } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const events = await db.event.findMany({
      select: { tags: true },
      where: { tags: { not: '' } },
    })

    const counter = new Map<string, number>()
    for (const ev of events) {
      const parts = (ev.tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      for (const t of parts) {
        counter.set(t, (counter.get(t) || 0) + 1)
      }
    }

    const list = Array.from(counter.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, 15)

    return json(list)
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
