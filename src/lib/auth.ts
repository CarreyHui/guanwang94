import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { db } from './db'

// ---------- 配置 ----------
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'CarreyHui'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'syh20120509'
const JWT_SECRET = process.env.JWT_SECRET || 'gw94_default_secret_change_me_in_production_32b'

// TTL
const ACCESS_TTL = 30 * 24 * 60 * 60 * 1000 // 30 天
const ADMIN_TTL = 7 * 24 * 60 * 60 * 1000 // 7 天

// ---------- 工具 ----------
function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url')
}

function sign(payload: object): string {
  const body = b64url(JSON.stringify(payload))
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

function verify<T = any>(token: string): T | null {
  if (!token || typeof token !== 'string') return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url')
  if (sig !== expected) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'))
    if (payload.exp && Date.now() > payload.exp) return null
    return payload as T
  } catch {
    return null
  }
}

// ---------- 访问令牌（access token，门控用） ----------
export function signAccessToken(token: string): string {
  return sign({ token, exp: Date.now() + ACCESS_TTL })
}

export function verifyAccessToken(signed: string): string | null {
  const p = verify<{ token: string; exp: number }>(signed)
  return p?.token || null
}

// ---------- 管理员 token ----------
export function signAdminToken(username: string): string {
  return sign({ username, exp: Date.now() + ADMIN_TTL, role: 'admin' })
}

export function verifyAdminToken(token: string): { username: string } | null {
  const p = verify<{ username: string; role: string; exp: number }>(token)
  if (!p || p.role !== 'admin') return null
  return { username: p.username }
}

// ---------- HTTP 请求中提取 token ----------
export function getBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()
  return null
}

export function getAdminToken(req: NextRequest): string | null {
  return req.headers.get('x-admin-session') || req.headers.get('X-Admin-Session')
}

// ---------- 校验访问令牌是否匹配当前站点配置 ----------
export async function checkAccess(req: NextRequest): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const bearer = getBearerToken(req)
  const cookieToken = req.cookies.get('access_token')?.value
  const signed = bearer || cookieToken
  if (!signed) {
    return { ok: false, status: 401, message: '需要访问令牌' }
  }
  const token = verifyAccessToken(signed)
  if (!token) {
    return { ok: false, status: 401, message: '访问令牌已过期' }
  }
  const config = await db.siteConfig.findUnique({ where: { id: 'default' } })
  if (!config || config.accessToken !== token) {
    return { ok: false, status: 403, message: '访问令牌已失效，请重新输入' }
  }
  return { ok: true }
}

// ---------- 校验管理员 ----------
export async function checkAdmin(req: NextRequest): Promise<{ ok: true; username: string } | { ok: false; status: number; message: string }> {
  const token = getAdminToken(req)
  if (!token) {
    return { ok: false, status: 401, message: '未登录' }
  }
  const payload = verifyAdminToken(token)
  if (!payload) {
    return { ok: false, status: 401, message: '管理员登录已过期' }
  }
  return { ok: true, username: payload.username }
}

// ---------- 管理员登录 ----------
export function tryAdminLogin(username: string, password: string): string | null {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return signAdminToken(username)
  }
  return null
}

// ---------- IP Hash ----------
export function hashIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for') || ''
  const ip = xff.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
  return crypto.createHash('sha256').update(ip + JWT_SECRET).digest('hex').slice(0, 16)
}

// ---------- 响应工具 ----------
export function json(data: any, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  })
}

export const ADMIN_CREDENTIALS = { username: ADMIN_USERNAME, password: ADMIN_PASSWORD }
