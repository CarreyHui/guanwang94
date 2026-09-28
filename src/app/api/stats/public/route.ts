import { NextRequest } from 'next/server'
import { checkAccess, json } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const [eventCount, messageCount, visitCount] = await Promise.all([
      db.event.count(),
      db.message.count(),
      db.visit.count(),
    ])

    return json({ eventCount, messageCount, visitCount })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
