import { NextRequest } from 'next/server'
import { checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'

const ALLOWED_ICONS = [
  'Sparkles', 'Link', 'Star', 'Heart', 'Globe', 'Rocket',
  'BookOpen', 'Camera', 'Music', 'Gamepad2', 'Palette', 'GraduationCap',
  'Trophy', 'Gift', 'Coffee', 'Sun', 'Moon', 'Cloud',
]
const ALLOWED_COLORS = ['amber', 'rose', 'sky', 'teal', 'violet', 'emerald', 'orange']

// PUT /api/fun-links/[id]（管理员）：更新磁贴
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { title, url, description, icon, color, order, enabled } = body || {}

    const data: Record<string, unknown> = {}
    if (typeof title === 'string') data.title = title.trim().slice(0, 50)
    if (typeof url === 'string') {
      if (!/^https?:\/\//.test(url)) return json({ error: '网址必须 http:// 或 https:// 开头' }, 400)
      data.url = url.trim().slice(0, 500)
    }
    if (typeof description === 'string') data.description = description.trim().slice(0, 200) || null
    if (typeof icon === 'string') data.icon = ALLOWED_ICONS.includes(icon) ? icon : 'Sparkles'
    if (typeof color === 'string') data.color = ALLOWED_COLORS.includes(color) ? color : 'amber'
    if (typeof order === 'number') data.order = Math.max(0, Math.min(999, order))
    if (typeof enabled === 'boolean') data.enabled = enabled ? 1 : 0

    const item = await db.funLink.update({ where: { id }, data: data as any })
    return json(item)
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}

// DELETE /api/fun-links/[id]（管理员）：删除磁贴
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const { id } = await params
    await db.funLink.delete({ where: { id } })
    return json({ ok: true })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
