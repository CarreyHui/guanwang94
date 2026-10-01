import { NextRequest } from 'next/server'
import { checkAccess, checkAdmin, json, hashIp } from '@/lib/auth'
import { db } from '@/lib/db'

const ALLOWED_ICONS = [
  'Sparkles', 'Link', 'Star', 'Heart', 'Globe', 'Rocket',
  'BookOpen', 'Camera', 'Music', 'Gamepad2', 'Palette', 'GraduationCap',
  'Trophy', 'Gift', 'Coffee', 'Sun', 'Moon', 'Cloud',
]
const ALLOWED_COLORS = ['amber', 'rose', 'sky', 'teal', 'violet', 'emerald', 'orange']

// GET /api/fun-links
// 公开（需 access）：返回所有启用的趣味跳转磁贴，按 order 排序
export async function GET(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const items = await db.funLink.findMany({
      where: { enabled: 1 },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })

    return json({ items })
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}

// POST /api/fun-links（管理员）：创建新磁贴
export async function POST(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const body = await req.json().catch(() => ({}))
    const { title, url, description, icon, color, order, enabled } = body || {}

    if (!title || typeof title !== 'string' || !title.trim()) {
      return json({ error: '标题不能为空' }, 400)
    }
    if (!url || typeof url !== 'string' || !/^https?:\/\//.test(url)) {
      return json({ error: '网址必须 http:// 或 https:// 开头' }, 400)
    }

    const data: Record<string, unknown> = {
      title: title.trim().slice(0, 50),
      url: url.trim().slice(0, 500),
      description: typeof description === 'string' ? description.trim().slice(0, 200) : null,
      icon: ALLOWED_ICONS.includes(icon) ? icon : 'Sparkles',
      color: ALLOWED_COLORS.includes(color) ? color : 'amber',
      order: typeof order === 'number' ? Math.max(0, Math.min(999, order)) : 0,
      enabled: enabled === false ? 0 : 1,
    }

    const item = await db.funLink.create({ data: data as any })
    return json(item, 201)
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
