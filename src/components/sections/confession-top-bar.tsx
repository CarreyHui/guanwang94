// 九四班官网 - 表白墙热榜组件
// 调 /api/confessions/top 拿近 7 天 Top 5 表白，按热度分（likes + reactions）排序
// 显示在表白墙 section 顶部，鼓励互动

'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Flame, Crown, Medal, Award } from 'lucide-react'

import { getConfessionTop, type ConfessionTopItem } from '@/lib/api'
import { useAppStore } from '@/store/use-app-store'
import { cn } from '@/lib/utils'

const TYPE_LABEL: Record<string, string> = {
  confession: '表白',
  thanks: '感谢',
  bless: '祝福',
  complain: '吐槽',
  wish: '心愿',
}

const TYPE_EMOJI: Record<string, string> = {
  confession: '💗',
  thanks: '🙏',
  bless: '🌈',
  complain: '😤',
  wish: '⭐',
}

const RANK_ICONS = [
  { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/15' }, // 🥇
  { icon: Medal, color: 'text-slate-400', bg: 'bg-slate-400/15' }, // 🥈
  { icon: Award, color: 'text-orange-700', bg: 'bg-orange-700/15' }, // 🥉
]

const DAYS_OPTIONS: { value: number; label: string }[] = [
  { value: 7, label: '近 7 天' },
  { value: 30, label: '近 30 天' },
  { value: 0, label: '全部' },
]

const TYPE_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: '', label: '全部', emoji: '🌈' },
  { value: 'confession', label: '表白', emoji: '💗' },
  { value: 'thanks', label: '感谢', emoji: '🙏' },
  { value: 'bless', label: '祝福', emoji: '🌈' },
  { value: 'complain', label: '吐槽', emoji: '😤' },
  { value: 'wish', label: '心愿', emoji: '⭐' },
]

const SORT_OPTIONS: { value: 'score' | 'likes' | 'reactions'; label: string; icon: typeof Flame }[] = [
  { value: 'score', label: '热度', icon: Flame },
  { value: 'likes', label: '点赞', icon: Crown },
  { value: 'reactions', label: '反应', icon: Award },
]

export function ConfessionTopBar() {
  const accessPassed = useAppStore((s) => s.accessPassed)
  const [days, setDays] = React.useState(7)
  const [type, setType] = React.useState('')
  const [sort, setSort] = React.useState<'score' | 'likes' | 'reactions'>('score')

  const topQuery = useQuery({
    queryKey: ['confessions-top', days, 5, type, sort],
    queryFn: () => getConfessionTop(days, 5, type || undefined, sort),
    enabled: accessPassed,
    staleTime: 5 * 60 * 1000,
  })

  const items = topQuery.data?.items ?? []
  const currentLabel = DAYS_OPTIONS.find((d) => d.value === days)?.label || '近 7 天'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 shadow-sm dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20 sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
          <Flame className="size-3.5" />
          {currentLabel}热榜
        </span>
        {/* 排序切换 */}
        <div className="flex items-center gap-0.5 rounded-full bg-card/60 p-0.5 backdrop-blur-sm">
          {SORT_OPTIONS.map((opt) => {
            const active = sort === opt.value
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSort(opt.value)}
                aria-pressed={active}
                title={`按${opt.label}排序`}
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
                  active
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-amber-700 dark:hover:text-amber-300',
                )}
              >
                <Icon className="size-3" />
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            )
          })}
        </div>
        {/* 类型筛选 */}
        <div className="ml-auto flex items-center gap-0.5 rounded-full bg-card/60 p-0.5 backdrop-blur-sm">
          {TYPE_OPTIONS.map((opt) => {
            const active = type === opt.value
            return (
              <button
                key={opt.value || 'all'}
                type="button"
                onClick={() => setType(opt.value)}
                aria-pressed={active}
                title={`${opt.emoji} ${opt.label}`}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
                  active
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-amber-700 dark:hover:text-amber-300',
                )}
              >
                <span className="mr-0.5">{opt.emoji}</span>
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 时间维度切换 */}
      <div className="mb-3 flex items-center gap-0.5 rounded-full bg-card/60 p-0.5 backdrop-blur-sm sm:hidden">
        {DAYS_OPTIONS.map((opt) => {
          const active = days === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDays(opt.value)}
              aria-pressed={active}
              className={cn(
                'flex-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
                active
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-amber-700 dark:hover:text-amber-300',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      <div className="mb-3 hidden items-center gap-0.5 rounded-full bg-card/60 p-0.5 backdrop-blur-sm sm:flex sm:w-auto sm:ml-auto">
        {DAYS_OPTIONS.map((opt) => {
          const active = days === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDays(opt.value)}
              aria-pressed={active}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                active
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-amber-700 dark:hover:text-amber-300',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {topQuery.isLoading ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="shimmer h-32 rounded-lg border border-amber-500/20 bg-card/40"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <Flame className="size-6 opacity-40" />
          <p>{currentLabel}还没有该类型表白，快来第一个发布吧</p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((item, i) => (
            <TopCard key={item.id} item={item} rank={i} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

function TopCard({ item, rank }: { item: ConfessionTopItem; rank: number }) {
  const rankIcon = RANK_ICONS[rank]
  const isTop3 = rank < 3
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: rank * 0.05 }}
      whileHover={{ y: -2 }}
      className={cn(
        'relative flex flex-col gap-1.5 rounded-lg border bg-card/80 p-3 backdrop-blur-sm transition-all',
        isTop3
          ? 'border-amber-500/40 shadow-sm'
          : 'border-border',
      )}
    >
      {/* 排名 */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'inline-flex size-6 items-center justify-center rounded-full text-xs font-bold',
            rankIcon ? rankIcon.bg : 'bg-muted',
            rankIcon ? rankIcon.color : 'text-muted-foreground',
          )}
        >
          {rankIcon ? <rankIcon.icon className="size-3.5" /> : `#${rank + 1}`}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground">
          {TYPE_EMOJI[item.type]} {TYPE_LABEL[item.type] || item.type}
        </span>
      </div>

      {/* 内容 */}
      <p className="line-clamp-3 text-xs leading-relaxed text-foreground/90">
        {item.content}
      </p>

      {/* 底部：昵称 + 热度 */}
      <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-1.5">
        <span className="max-w-[60%] truncate text-[10px] text-muted-foreground">
          {item.nickname}
        </span>
        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          <Flame className="size-3" />
          {item.score}
        </span>
      </div>
    </motion.div>
  )
}
