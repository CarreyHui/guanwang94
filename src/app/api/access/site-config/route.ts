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
      customPrimaryColor: config?.customPrimaryColor || '',
      funUrl: config?.funUrl || '',
      funTitle: config?.funTitle || '有趣功能',
      funEnabled: (config?.funEnabled ?? 0) > 0,
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
    const { siteTitle, siteDescription, logoUrl, ogImageUrl, themeColor, customPrimaryColor, funUrl, funTitle, funEnabled } = body || {}

    const data: Record<string, string | number | null> = {}
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
    // customPrimaryColor: 合法 hex 颜色（#rgb 或 #rrggbb）或空字符串清除
    if (typeof customPrimaryColor === 'string') {
      const trimmed = customPrimaryColor.trim()
      if (/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(trimmed)) {
        data.customPrimaryColor = trimmed
      } else if (trimmed === '') {
        data.customPrimaryColor = null
      }
    }
    // 趣味跳转链接配置
    if (typeof funUrl === 'string') {
      const trimmed = funUrl.trim()
      if (trimmed === '') {
        data.funUrl = null
      } else if (/^https?:\/\//.test(trimmed)) {
        data.funUrl = trimmed.slice(0, 500)
      }
    }
    if (typeof funTitle === 'string') {
      data.funTitle = funTitle.trim().slice(0, 50) || '有趣功能'
    }
    if (typeof funEnabled === 'boolean') {
      data.funEnabled = funEnabled ? 1 : 0
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
      customPrimaryColor: updated.customPrimaryColor,
      funUrl: updated.funUrl,
      funTitle: updated.funTitle,
      funEnabled: (updated.funEnabled ?? 0) > 0,
    })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
