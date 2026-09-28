import { NextRequest } from 'next/server'
import { checkAccess, checkAdmin, hashIp, json } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const url = req.nextUrl
    const q = url.searchParams.get('q') || ''
    const sort = url.searchParams.get('sort') === 'hot' ? 'hot' : 'latest'
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
    const pageSize = Math.max(1, Math.min(50, parseInt(url.searchParams.get('pageSize') || '10', 10) || 10))

    const where: Prisma.MessageWhereInput = {
      parentId: null,
      ...(q ? { content: { contains: q } } : {}),
    }

    const orderBy: Prisma.MessageOrderByWithRelationInput =
      sort === 'hot' ? { likes: 'desc' } : { createdAt: 'desc' }

    const [total, roots] = await Promise.all([
      db.message.count({ where }),
      db.message.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    const ids = roots.map((m) => m.id)
    const replies = ids.length
      ? await db.message.findMany({
          where: { parentId: { in: ids } },
          orderBy: { createdAt: 'asc' },
        })
      : []

    const replyMap = new Map<string, typeof replies>()
    for (const r of replies) {
      const arr = replyMap.get(r.parentId as string) || []
      arr.push(r)
      replyMap.set(r.parentId as string, arr)
    }

    const items = roots.map((m) => ({
      ...m,
      replies: replyMap.get(m.id) || [],
    }))

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
    const { nickname, content, contact } = body || {}
    if (!content) {
      return json({ error: '内容不能为空' }, 400)
    }
    const ipHash = hashIp(req)
    const message = await db.message.create({
      data: {
        nickname: (nickname || '匿名同学').toString().slice(0, 32),
        content: String(content).slice(0, 1000),
        contact: contact ? String(contact).slice(0, 100) : null,
        ipHash,
        replyRole: 'user',
      },
    })
    return json(message, 201)
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}

// 给 admin 提供回复能力
export async function PUT(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const body = await req.json().catch(() => ({}))
    const { parentId, content } = body || {}
    if (!parentId || !content) {
      return json({ error: 'parentId 和 content 不能为空' }, 400)
    }
    const parent = await db.message.findUnique({ where: { id: String(parentId) } })
    if (!parent) return json({ error: '父留言不存在' }, 404)

    const reply = await db.message.create({
      data: {
        nickname: admin.username,
        content: String(content).slice(0, 1000),
        contact: null,
        ipHash: hashIp(req),
        parentId: parent.id,
        replyRole: 'admin',
      },
    })
    return json(reply, 201)
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
