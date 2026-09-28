import { NextRequest } from 'next/server'
import { checkAccess, hashIp, json } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

const COLOR_MAP: Record<string, string> = {
  confession: 'rose',
  thanks: 'amber',
  bless: 'emerald',
  complain: 'orange',
  wish: 'sky',
}

const ALLOWED_TYPES = new Set(Object.keys(COLOR_MAP))

export async function GET(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const url = req.nextUrl
    const type = url.searchParams.get('type') || ''
    const sort = url.searchParams.get('sort') === 'hot' ? 'hot' : 'latest'
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
    const pageSize = Math.max(1, Math.min(50, parseInt(url.searchParams.get('pageSize') || '12', 10) || 12))

    const where: Prisma.ConfessionWhereInput = type ? { type } : {}
    const orderBy: Prisma.ConfessionOrderByWithRelationInput =
      sort === 'hot' ? { likes: 'desc' } : { createdAt: 'desc' }

    const [total, items] = await Promise.all([
      db.confession.count({ where }),
      db.confession.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return json({ items, total, page, pageSize })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const body = await req.json().catch(() => ({}))
    const { nickname, content, type } = body || {}
    if (!content) return json({ error: '内容不能为空' }, 400)

    const t = String(type || 'confession')
    if (!ALLOWED_TYPES.has(t)) {
      return json({ error: '不支持的表白类型' }, 400)
    }

    const confession = await db.confession.create({
      data: {
        nickname: (nickname || '匿名同学').toString().slice(0, 32),
        content: String(content).slice(0, 500),
        type: t,
        color: COLOR_MAP[t],
        ipHash: hashIp(req),
      },
    })
    return json(confession, 201)
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
