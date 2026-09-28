import { NextRequest } from 'next/server'
import { checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const days = Math.max(1, Math.min(90, parseInt(req.nextUrl.searchParams.get('days') || '7', 10) || 7))

    const now = new Date()
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - (days - 1))

    const visitWhere: Prisma.VisitWhereInput = { visitedAt: { gte: start, lte: now } }
    const messageWhere: Prisma.MessageWhereInput = { createdAt: { gte: start, lte: now } }

    const [visits, messages] = await Promise.all([
      db.visit.findMany({
        where: visitWhere,
        select: { visitedAt: true },
      }),
      db.message.findMany({
        where: messageWhere,
        select: { createdAt: true },
      }),
    ])

    // 按日期分桶
    const buckets = new Map<string, { date: string; visits: number; messages: number }>()
    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      buckets.set(key, { date: key, visits: 0, messages: 0 })
    }
    for (const v of visits) {
      const key = v.visitedAt.toISOString().slice(0, 10)
      const b = buckets.get(key)
      if (b) b.visits++
    }
    for (const m of messages) {
      const key = m.createdAt.toISOString().slice(0, 10)
      const b = buckets.get(key)
      if (b) b.messages++
    }

    return json(Array.from(buckets.values()))
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
