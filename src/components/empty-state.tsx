// 九四班官网 - 通用空状态 + 骨架屏组件
// 用于 events / confessions / messages / gallery 列表的 loading 和 empty 状态

'use client'

import * as React from 'react'
import { Inbox, ImageOff, MessageSquareOff, HeartCrack, SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------- 空状态 ----------
export interface EmptyStateProps {
  icon?: 'inbox' | 'image' | 'message' | 'heart' | 'search'
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

const ICON_MAP = {
  inbox: Inbox,
  image: ImageOff,
  message: MessageSquareOff,
  heart: HeartCrack,
  search: SearchX,
}

export function EmptyState({
  icon = 'inbox',
  title = '暂无内容',
  description,
  action,
  className,
}: EmptyStateProps) {
  const Icon = ICON_MAP[icon]
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-16 text-center',
        className,
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-full bg-emerald-500/10 blur-2xl" />
        <Icon className="size-12 text-emerald-600/40 dark:text-emerald-400/40" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ---------- 骨架屏卡片 ----------
export interface EventCardSkeletonProps {
  className?: string
}

export function EventCardSkeleton({ className }: EventCardSkeletonProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card p-3',
        className,
      )}
    >
      {/* 封面占位 */}
      <div className="shimmer aspect-[16/9] w-full rounded-lg" />
      {/* 标题占位 */}
      <div className="shimmer h-4 w-3/4 rounded" />
      <div className="shimmer h-4 w-1/2 rounded" />
      {/* 摘要占位 */}
      <div className="space-y-1.5">
        <div className="shimmer h-3 w-full rounded" />
        <div className="shimmer h-3 w-5/6 rounded" />
      </div>
      {/* footer 占位 */}
      <div className="mt-auto flex items-center gap-2 pt-2">
        <div className="shimmer h-3 w-16 rounded" />
        <div className="shimmer h-3 w-12 rounded" />
      </div>
    </div>
  )
}

// ---------- 置顶横幅骨架 ----------
export function PinnedBannerSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden rounded-xl border border-emerald-600/20 bg-emerald-600/5 p-4">
      <div className="shimmer aspect-[16/9] w-40 shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="shimmer h-3 w-20 rounded" />
        <div className="shimmer h-5 w-3/4 rounded" />
        <div className="shimmer h-3 w-full rounded" />
        <div className="shimmer h-3 w-2/3 rounded" />
      </div>
    </div>
  )
}

// ---------- 简单行骨架（用于列表项） ----------
export function RowSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="shimmer h-3 rounded" style={{ width: `${100 - i * 15}%` }} />
      ))}
    </div>
  )
}

// ---------- 表白墙/留言卡片骨架 ----------
export function CardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <div className="flex gap-3 rounded-lg border border-border bg-card p-3">
        <div className="shimmer size-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="shimmer h-3 w-1/3 rounded" />
          <div className="shimmer h-3 w-full rounded" />
          <div className="shimmer h-3 w-5/6 rounded" />
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className="shimmer size-8 rounded-full" />
        <div className="shimmer h-3 w-24 rounded" />
      </div>
      <div className="space-y-1.5">
        <div className="shimmer h-3 w-full rounded" />
        <div className="shimmer h-3 w-5/6 rounded" />
      </div>
      <div className="shimmer h-3 w-16 rounded" />
    </div>
  )
}
