// 九四班官网 - 前端类型定义（与 Prisma 模型对应）

// ===== 枚举/联合类型 =====
export type ConfessionType =
  | 'confession'
  | 'thanks'
  | 'bless'
  | 'complain'
  | 'wish'

export type EventCategory =
  | '全部'
  | '班级活动'
  | '学习通知'
  | '重要公告'
  | '校园新闻'

export type ConfessionColor =
  | 'rose'
  | 'amber'
  | 'emerald'
  | 'orange'
  | 'sky'

export type ReplyRole = 'user' | 'admin'

export type Theme = 'light' | 'dark' | 'system'

// ===== 与 Prisma 模型对应 =====
export interface Event {
  id: string
  title: string
  summary: string
  content: string
  coverImage: string | null
  category: string
  priority: string
  pinned: number
  tags: string
  publishedAt: string
  viewCount: number
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  nickname: string
  content: string
  contact: string | null
  ipHash: string | null
  likes: number
  parentId: string | null
  replyRole: ReplyRole
  createdAt: string
  replies?: Message[]
}

export interface Confession {
  id: string
  nickname: string
  content: string
  type: ConfessionType
  color: ConfessionColor
  likes: number
  ipHash: string | null
  createdAt: string
  reactionCounts?: Record<string, number>
  myReactions?: string[]
}

export interface Visit {
  id: string
  path: string | null
  ipHash: string | null
  ua: string | null
  referrer: string | null
  visitedAt: string
}

export interface AboutConfig {
  id: string
  className: string
  slogan: string
  intro: string | null
  headTeacher: string | null
  headTeacherQuote: string | null
  classCommittee: string | null
  contact: string | null
  updatedAt: string
}

export interface SiteConfig {
  id: string
  accessToken: string
  updatedAt: string
}

// ===== 通用响应 =====
export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiErrorBody {
  error: string
}

export interface OkResponse {
  ok: true
}

// ===== 各 API 具体响应 =====
export type EventListResponse = Paginated<Event>

export type MessageListResponse = Paginated<Message>

export type ConfessionListResponse = Paginated<Confession>

export interface TagCount {
  tag: string
  count: number
}

export interface AccessVerifyResponse {
  signed: string
}

export interface AccessTokenResponse {
  accessToken: string
}

export interface AccessTokenUpdateResponse {
  ok: true
  accessToken: string
}

export interface AuthLoginResponse {
  adminToken: string
  username: string
}

export interface AuthSessionResponse {
  isAdmin: boolean
  username: string | null
  hasAccess: boolean
}

export interface LikeResponse {
  ok: true
  likes: number
}

export interface PinResponse {
  ok: true
  pinned: number
}

export interface TrackPayload {
  path?: string
  referrer?: string
}

export interface TrackResponse {
  ok: true
  id: string
}

// ===== 统计 =====
export interface PublicStats {
  eventCount: number
  messageCount: number
  visitCount: number
}

export interface OverviewStats {
  totalEvents: number
  totalVisits: number
  totalMessages: number
  todayVisits: number
}

export interface TrendPoint {
  date: string
  visits: number
  messages: number
}

export interface TopEvent {
  id: string
  title: string
  viewCount: number
}
