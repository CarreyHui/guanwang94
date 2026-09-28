import { NextRequest } from 'next/server'
import { json } from '@/lib/auth'

export async function POST(_req: NextRequest) {
  // 前端清 localStorage 即可；后端无状态 token，直接返回成功
  return json({ ok: true })
}
