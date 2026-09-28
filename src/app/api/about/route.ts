import { NextRequest } from 'next/server'
import { checkAccess, checkAdmin, json } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const access = await checkAccess(req)
    if (!access.ok) return json({ error: access.message }, access.status)

    const about = await db.aboutConfig.findUnique({ where: { id: 'default' } })
    if (!about) return json({ error: '关于我们未配置' }, 404)
    return json(about)
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin.ok) return json({ error: admin.message }, admin.status)

    const body = await req.json().catch(() => ({}))
    const {
      className, slogan, intro, headTeacher,
      headTeacherQuote, classCommittee, contact,
    } = body || {}

    const updated = await db.aboutConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        className: className ? String(className) : '九四班',
        slogan: slogan ? String(slogan) : '',
        intro: intro ? String(intro) : null,
        headTeacher: headTeacher ? String(headTeacher) : null,
        headTeacherQuote: headTeacherQuote ? String(headTeacherQuote) : null,
        classCommittee: classCommittee ? String(classCommittee) : null,
        contact: contact ? String(contact) : null,
      },
      update: {
        ...(className !== undefined ? { className: String(className) } : {}),
        ...(slogan !== undefined ? { slogan: String(slogan) } : {}),
        ...(intro !== undefined ? { intro: intro ? String(intro) : null } : {}),
        ...(headTeacher !== undefined ? { headTeacher: headTeacher ? String(headTeacher) : null } : {}),
        ...(headTeacherQuote !== undefined ? { headTeacherQuote: headTeacherQuote ? String(headTeacherQuote) : null } : {}),
        ...(classCommittee !== undefined ? { classCommittee: classCommittee ? String(classCommittee) : null } : {}),
        ...(contact !== undefined ? { contact: contact ? String(contact) : null } : {}),
      },
    })
    return json(updated)
  } catch (e: any) {
    return json({ error: e?.message || '服务器错误' }, 500)
  }
}
