import { NextRequest } from 'next/server'
import { checkAccess, checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const url = req.nextUrl
    const category = url.searchParams.get('category') || ''
    const q = url.searchParams.get('q') || ''
    const tag = url.searchParams.get('tag') || ''
    const priority = url.searchParams.get('priority') || ''
    const sort = url.searchParams.get('sort') || 'default' // default | latest | oldest | popular | pinned
    const pinnedOnly = url.searchParams.get('pinnedOnly') === '1'
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
    const pageSize = Math.max(1, Math.min(50, parseInt(url.searchParams.get('pageSize') || '12', 10) || 12))

    const where: Prisma.EventWhereInput = {}
    if (category) where.category = category
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { summary: { contains: q } },
      ]
    }
    if (tag) {
      where.tags = { contains: tag }
    }
    if (priority) {
      where.priority = priority
    }
    if (pinnedOnly) {
      where.pinned = { gt: 0 }
    }

    // orderBy
    let orderBy: Prisma.EventOrderByWithRelationInput[] = []
    switch (sort) {
      case 'latest':
        orderBy = [{ publishedAt: 'desc' }]
        break
      case 'oldest':
        orderBy = [{ publishedAt: 'asc' }]
        break
      case 'popular':
        orderBy = [{ viewCount: 'desc' }, { publishedAt: 'desc' }]
        break
      case 'pinned':
        orderBy = [{ pinned: 'desc' }, { publishedAt: 'desc' }]
        break
      default:
        // default：pinned 优先 + 最新
        orderBy = [{ pinned: 'desc' }, { publishedAt: 'desc' }]
    }

    const [total, items] = await Promise.all([
      db.event.count({ where }),
      db.event.findMany({
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
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const body = await req.json().catch(() => ({}))
    const {
      title, summary, content, coverImage, category,
      priority, pinned, tags, publishedAt,
    } = body || {}

    if (!title || !summary || !content) {
      return json({ error: 'title / summary / content 不能为空' }, 400)
    }

    const event = await db.event.create({
      data: {
        title: String(title),
        summary: String(summary),
        content: String(content),
        coverImage: coverImage ? String(coverImage) : null,
        category: category ? String(category) : '班级活动',
        priority: priority ? String(priority) : 'normal',
        pinned: Number(pinned) || 0,
        tags: tags ? String(tags) : '',
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      },
    })
    return json(event, 201)
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
