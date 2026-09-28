// 九四班官网 - 客户端 API 封装
// 自动带 Authorization: Bearer <access> 与 x-admin-session: <admin> header
// 401/403：清 access token 并派发 'gw94:access-lost' 事件让 UI 弹出门控

import type {
  AboutConfig,
  AccessTokenResponse,
  AccessTokenUpdateResponse,
  AccessVerifyResponse,
  AuthLoginResponse,
  AuthSessionResponse,
  Confession,
  ConfessionListResponse,
  ConfessionType,
  Event,
  EventListResponse,
  LikeResponse,
  Message,
  MessageListResponse,
  OkResponse,
  PinResponse,
  PublicStats,
  OverviewStats,
  TagCount,
  TopEvent,
  TrackPayload,
  TrackResponse,
  TrendPoint,
  Visit,
} from './types'

const ACCESS_KEY = 'gw94_access_token'
const ADMIN_KEY = 'gw94_admin_token'
const ADMIN_USERNAME_KEY = 'gw94_admin_username'

export const ACCESS_LOST_EVENT = 'gw94:access-lost'

// ===== localStorage 工具 =====
function getAccess(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(ACCESS_KEY)
  } catch {
    return null
  }
}

function getAdmin(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(ADMIN_KEY)
  } catch {
    return null
  }
}

export function setAccessToken(signed: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ACCESS_KEY, signed)
  } catch {
    // ignore
  }
}

export function clearAccessToken(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(ACCESS_KEY)
  } catch {
    // ignore
  }
  // 通知 UI 弹出门控
  window.dispatchEvent(new CustomEvent(ACCESS_LOST_EVENT))
}

export function setAdminToken(token: string, username: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ADMIN_KEY, token)
    window.localStorage.setItem(ADMIN_USERNAME_KEY, username)
  } catch {
    // ignore
  }
}

export function clearAdminToken(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(ADMIN_KEY)
    window.localStorage.removeItem(ADMIN_USERNAME_KEY)
  } catch {
    // ignore
  }
}

export function getAdminUsername(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(ADMIN_USERNAME_KEY)
  } catch {
    return null
  }
}

// ===== 错误 =====
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// ===== 通用请求 =====
type QueryValue = string | number | boolean | undefined | null

function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return ''
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  )
  if (entries.length === 0) return ''
  const usp = new URLSearchParams()
  for (const [k, v] of entries) usp.set(k, String(v))
  return `?${usp.toString()}`
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string> | undefined) || {}),
  }

  const access = getAccess()
  if (access) headers['Authorization'] = `Bearer ${access}`

  const admin = getAdmin()
  if (admin) headers['x-admin-session'] = admin

  let res: Response
  try {
    res = await fetch(path, { ...options, headers })
  } catch (e) {
    throw new ApiError(
      e instanceof Error ? `网络错误：${e.message}` : '网络错误',
      0,
    )
  }

  if (res.status === 401 || res.status === 403) {
    let message = '鉴权失败'
    try {
      const data = (await res.clone().json()) as { error?: string }
      if (data?.error) message = data.error
    } catch {
      // ignore
    }
    // 清掉 access token，触发门控 UI
    clearAccessToken()
    throw new ApiError(message, res.status)
  }

  if (!res.ok) {
    let message = `请求失败 (${res.status})`
    try {
      const data = (await res.clone().json()) as { error?: string }
      if (data?.error) message = data.error
    } catch {
      // ignore
    }
    throw new ApiError(message, res.status)
  }

  // 部分接口（DELETE）返回 { ok: true }，统一走 JSON
  return (await res.json()) as T
}

// ===== 基础动词 =====
export function apiGet<T>(
  path: string,
  params?: Record<string, QueryValue>,
): Promise<T> {
  return request<T>(`${path}${buildQuery(params)}`)
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function apiDelete<T>(path: string, params?: Record<string, QueryValue>): Promise<T> {
  return request<T>(`${path}${buildQuery(params)}`, { method: 'DELETE' })
}

// ===== 访问令牌 =====
export function verifyAccess(token: string): Promise<AccessVerifyResponse> {
  return apiPost<AccessVerifyResponse>('/api/access/verify', { token })
}

export function getAccessToken(): Promise<AccessTokenResponse> {
  return apiGet<AccessTokenResponse>('/api/access/token')
}

export function updateAccessToken(token: string): Promise<AccessTokenUpdateResponse> {
  return apiPut<AccessTokenUpdateResponse>('/api/access/token', { token })
}

// ===== 站点配置（标题/描述/Logo/OG image/主题色） =====
export interface SiteConfigResponse {
  accessToken: string
  siteTitle: string
  siteDescription: string
  logoUrl: string
  ogImageUrl: string
  themeColor: string
  customPrimaryColor: string
}

export interface SiteConfigUpdateInput {
  siteTitle?: string
  siteDescription?: string
  logoUrl?: string
  ogImageUrl?: string
  themeColor?: string
  customPrimaryColor?: string
}

export function getSiteConfig(): Promise<SiteConfigResponse> {
  return apiGet<SiteConfigResponse>('/api/access/site-config')
}

export function updateSiteConfig(
  payload: SiteConfigUpdateInput,
): Promise<SiteConfigResponse & { ok: true }> {
  return apiPut<SiteConfigResponse & { ok: true }>(
    '/api/access/site-config',
    payload,
  )
}

// ===== 鉴权 =====
export function adminLogin(
  username: string,
  password: string,
): Promise<AuthLoginResponse> {
  return apiPost<AuthLoginResponse>('/api/auth/login', { username, password })
}

export function adminLogout(): Promise<OkResponse> {
  return apiPost<OkResponse>('/api/auth/logout')
}

export function fetchSession(): Promise<AuthSessionResponse> {
  return apiGet<AuthSessionResponse>('/api/auth/session')
}

// ===== 事件 =====
export type EventListParams = {
  category?: string
  q?: string
  tag?: string
  priority?: string
  sort?: 'default' | 'latest' | 'oldest' | 'popular' | 'pinned'
  pinnedOnly?: boolean
  page?: number
  pageSize?: number
}

export function listEvents(
  params: EventListParams = {},
): Promise<EventListResponse> {
  const query: Record<string, QueryValue> = {}
  if (params.category) query.category = params.category
  if (params.q) query.q = params.q
  if (params.tag) query.tag = params.tag
  if (params.priority) query.priority = params.priority
  if (params.sort) query.sort = params.sort
  if (params.pinnedOnly) query.pinnedOnly = '1'
  if (params.page) query.page = params.page
  if (params.pageSize) query.pageSize = params.pageSize
  return apiGet<EventListResponse>('/api/events', query)
}

export function getEvent(id: string): Promise<Event> {
  return apiGet<Event>(`/api/events/${encodeURIComponent(id)}`)
}

export interface EventInput {
  title: string
  summary: string
  content: string
  coverImage?: string | null
  category?: string
  priority?: string
  pinned?: number
  tags?: string
  publishedAt?: string
}

export function createEvent(payload: EventInput): Promise<Event> {
  return apiPost<Event>('/api/events', payload)
}

export function updateEvent(id: string, payload: Partial<EventInput>): Promise<Event> {
  return apiPut<Event>(`/api/events/${encodeURIComponent(id)}`, payload)
}

export function deleteEvent(id: string): Promise<OkResponse> {
  return apiDelete<OkResponse>(`/api/events/${encodeURIComponent(id)}`)
}

export function toggleEventPin(id: string): Promise<PinResponse> {
  return apiPatch<PinResponse>(`/api/events/${encodeURIComponent(id)}/pin`)
}

export function listEventTags(): Promise<TagCount[]> {
  return apiGet<TagCount[]>('/api/events/tags')
}

// ===== 留言 =====
export type MessageListParams = {
  q?: string
  sort?: 'latest' | 'hot'
  page?: number
  pageSize?: number
}

export function listMessages(
  params: MessageListParams = {},
): Promise<MessageListResponse> {
  return apiGet<MessageListResponse>('/api/messages', params)
}

export interface MessageInput {
  nickname?: string
  content: string
  contact?: string
}

export function createMessage(payload: MessageInput): Promise<Message> {
  return apiPost<Message>('/api/messages', payload)
}

export function adminReplyMessage(
  parentId: string,
  content: string,
): Promise<Message> {
  return apiPut<Message>('/api/messages', { parentId, content })
}

export function deleteMessage(id: string): Promise<OkResponse> {
  return apiDelete<OkResponse>(`/api/messages/${encodeURIComponent(id)}`)
}

export function likeMessage(id: string): Promise<LikeResponse> {
  return apiPatch<LikeResponse>('/api/messages/like', { id })
}

// ===== 表白墙 =====
export type ConfessionListParams = {
  type?: ConfessionType | ''
  sort?: 'latest' | 'hot'
  page?: number
  pageSize?: number
}

export function listConfessions(
  params: ConfessionListParams = {},
): Promise<ConfessionListResponse> {
  return apiGet<ConfessionListResponse>('/api/confessions', params)
}

export interface ConfessionInput {
  nickname?: string
  content: string
  type: ConfessionType
}

export function createConfession(payload: ConfessionInput): Promise<Confession> {
  return apiPost<Confession>('/api/confessions', payload)
}

export function likeConfession(id: string): Promise<LikeResponse> {
  return apiPatch<LikeResponse>('/api/confessions/like', { id })
}

// ===== 表白墙 emoji 反应 =====
export type ReactionEmoji = '👍' | '❤️' | '🎉' | '🚀' | '😢' | '😮'

export interface ReactionToggleResponse {
  ok: true
  counts: Record<string, number>
  myReactions: string[]
  toggled: boolean
}

export function toggleConfessionReaction(
  confessionId: string,
  emoji: ReactionEmoji,
): Promise<ReactionToggleResponse> {
  return apiPatch<ReactionToggleResponse>('/api/confessions/react', { confessionId, emoji })
}

// ===== 表白墙热榜 =====
export interface ConfessionTopItem {
  id: string
  nickname: string
  content: string
  type: string
  color: string
  likes: number
  reactionCount: number
  score: number
  createdAt: string
}

export interface ConfessionTopResponse {
  items: ConfessionTopItem[]
  days: number
  type?: string
  sort?: string
  generatedAt: string
}

export function getConfessionTop(
  days = 7,
  limit = 10,
  type?: string,
  sort?: 'score' | 'likes' | 'reactions',
): Promise<ConfessionTopResponse> {
  const params: Record<string, QueryValue> = { days, limit }
  if (type) params.type = type
  if (sort) params.sort = sort
  return apiGet<ConfessionTopResponse>('/api/confessions/top', params)
}

export function deleteConfession(id: string): Promise<OkResponse> {
  return apiDelete<OkResponse>('/api/confessions/delete', { id })
}

// ===== 关于 =====
export function getAbout(): Promise<AboutConfig> {
  return apiGet<AboutConfig>('/api/about')
}

export interface AboutInput {
  className?: string
  slogan?: string
  intro?: string | null
  headTeacher?: string | null
  headTeacherQuote?: string | null
  classCommittee?: string | null
  contact?: string | null
}

export function updateAbout(payload: AboutInput): Promise<AboutConfig> {
  return apiPut<AboutConfig>('/api/about', payload)
}

// ===== 统计（公开） =====
export function getPublicStats(): Promise<PublicStats> {
  return apiGet<PublicStats>('/api/stats/public')
}

// ===== 统计（管理员） =====
export function getOverviewStats(): Promise<OverviewStats> {
  return apiGet<OverviewStats>('/api/stats/overview')
}

export function getTrend(days = 7): Promise<TrendPoint[]> {
  return apiGet<TrendPoint[]>('/api/stats/trend', { days })
}

export function getTopEvents(limit = 10): Promise<TopEvent[]> {
  return apiGet<TopEvent[]>('/api/stats/top-events', { limit })
}

export function getRecentVisits(limit = 20): Promise<Visit[]> {
  return apiGet<Visit[]>('/api/stats/recent-visits', { limit })
}

// 小时分布 + 热力图
export interface HourlyStats {
  hourly: number[]
  heatmap: number[][]
  total: number
  maxCell: number
  days: number
}

export function getHourlyStats(): Promise<HourlyStats> {
  return apiGet<HourlyStats>('/api/stats/hourly')
}

// 热门路径 Top N
export interface TopPathItem {
  path: string
  count: number
}
export interface TopPathsResponse {
  items: TopPathItem[]
  days: number
  total: number
  uniquePaths: number
}

export function getTopPaths(days = 7, limit = 10): Promise<TopPathsResponse> {
  return apiGet<TopPathsResponse>('/api/stats/top-paths', { days, limit })
}

// 热门 referrer Top N
export interface TopReferrerItem {
  referrer: string
  count: number
}
export interface TopReferrersResponse {
  items: TopReferrerItem[]
  days: number
  total: number
  uniqueReferrers: number
}

export function getTopReferrers(days = 7, limit = 10): Promise<TopReferrersResponse> {
  return apiGet<TopReferrersResponse>('/api/stats/top-referrers', { days, limit })
}

// 新访客 vs 回访
export interface VisitorTypesResponse {
  newCount: number
  returningCount: number
  total: number
  newPct: number
  returningPct: number
  uniqueVisitors: number
  days: number
}

export function getVisitorTypes(days = 7): Promise<VisitorTypesResponse> {
  return apiGet<VisitorTypesResponse>('/api/stats/visitor-types', { days })
}

// ===== 上报访问 =====
export function trackVisit(payload: TrackPayload): Promise<TrackResponse> {
  return apiPost<TrackResponse>('/api/track', payload)
}
