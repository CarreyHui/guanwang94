import { NextRequest } from 'next/server'
import { checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'

// GET 取完整站点配置（管理员）
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) {
      return json({ error: admin.message }, admin.status)
    }
    const config = await db.siteConfig.findUnique({ where: { id: 'default' } })
    return json({
      accessToken: config?.accessToken || '',
      siteTitle: config?.siteTitle || '九四班官网 · Guanwang94',
      siteDescription:
        config?.siteDescription ||
        '志存高远 · 脚踏实地 · 团结奋进 · 记录九四班每一次重要时刻',
      logoUrl: config?.logoUrl || '',
      ogImageUrl: config?.ogImageUrl || '',
      themeColor: config?.themeColor || 'emerald',
    })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}

// PUT 更新站点标题/描述/Logo/OG image（管理员）
export async function PUT(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) {
      return json({ error: admin.message }, admin.status)
    }
    const body = await req.json().catch(() => ({}))
    const { siteTitle, siteDescription, logoUrl, ogImageUrl, themeColor } = body || {}

    const data: Record<string, string | null> = {}
    if (typeof siteTitle === 'string' && siteTitle.trim()) {
      data.siteTitle = siteTitle.trim().slice(0, 200)
    }
    if (typeof siteDescription === 'string') {
      data.siteDescription = siteDescription.slice(0, 500)
    }
    if (typeof logoUrl === 'string') {
      data.logoUrl = logoUrl.trim() || null
    }
    if (typeof ogImageUrl === 'string') {
      data.ogImageUrl = ogImageUrl.trim() || null
    }
    const ALLOWED_THEME_COLORS = ['emerald', 'teal', 'rose', 'amber', 'sky', 'violet']
    if (typeof themeColor === 'string' && ALLOWED_THEME_COLORS.includes(themeColor)) {
      data.themeColor = themeColor
    }

    const updated = await db.siteConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        accessToken: '1234',
        ...data,
      },
      update: data,
    })
    return json({
      ok: true,
      siteTitle: updated.siteTitle,
      siteDescription: updated.siteDescription,
      logoUrl: updated.logoUrl,
      ogImageUrl: updated.ogImageUrl,
      themeColor: updated.themeColor,
    })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
