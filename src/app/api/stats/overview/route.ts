import { NextRequest } from 'next/server'
import { checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const [totalEvents, totalVisits, totalMessages, todayVisits] = await Promise.all([
      db.event.count(),
      db.visit.count(),
      db.message.count(),
      db.visit.count({ where: { visitedAt: { gte: startOfDay } } }),
    ])

    return json({ totalEvents, totalVisits, totalMessages, todayVisits })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
