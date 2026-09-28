// 九四班官网 - 事件归档时间线
// 拉所有事件（不分页），按月分组 YYYY-MM
// 时间线左侧轴（垂直线 + 月份圆点）
// 月份卡片可点击展开/折叠，默认展开最近一个月
// 展开后显示该月所有事件（日期 + 标题 + 摘要 + 分类 + 浏览数）
// 点击事件触发 EventDetailModal（通过 useEventModal 全局 store 共享）

'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  Eye,
  Loader2,
  Calendar,
  Archive,
  Pin,
  CalendarPlus,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useEventModal } from '@/store/use-event-modal'
import { useAppStore } from '@/store/use-app-store'
import { listEvents } from '@/lib/api'
import type { Event } from '@/lib/types'
import { formatDate, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

const CATEGORY_COLOR: Record<string, string> = {
  班级活动: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300',
  学习通知: 'bg-teal-600/15 text-teal-700 dark:text-teal-300',
  重要公告: 'bg-amber-600/15 text-amber-700 dark:text-amber-300',
  校园新闻: 'bg-sky-600/15 text-sky-700 dark:text-sky-300',
}

// 拉取所有事件（顺序分页，最多 500 条上限保护）
async function fetchAllEvents(): Promise<Event[]> {
  const all: Event[] = []
  let page = 1
  // 安全上限 20 页（每页 50 条 = 1000 条）
  for (let i = 0; i < 20; i++) {
    const res = await listEvents({ page, pageSize: 50 })
    all.push(...res.items)
    if (res.page * res.pageSize >= res.total) break
    page++
  }
  return all
}

function monthKey(iso: string): string {
  // YYYY-MM
  return iso.slice(0, 7)
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  return `${y} 年 ${Number(m)} 月`
}

export function ArchiveSection() {
  const accessPassed = useAppStore((s) => s.accessPassed)
  const hydrateFromTokens = useAppStore((s) => s.hydrateFromTokens)
  const openEvent = useEventModal((s) => s.openEvent)

  React.useEffect(() => {
    hydrateFromTokens()
  }, [hydrateFromTokens])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['events-archive-all'],
    queryFn: fetchAllEvents,
    enabled: accessPassed,
    staleTime: 60 * 1000,
  })

  // 按月分组（降序）
  const groups = React.useMemo(() => {
    const map = new Map<string, Event[]>()
    for (const ev of data ?? []) {
      const k = monthKey(ev.publishedAt)
      const arr = map.get(k) ?? []
      arr.push(ev)
      map.set(k, arr)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [data])

  // 默认展开最近一个月
  const [openMonths, setOpenMonths] = React.useState<Set<string>>(
    () => new Set(),
  )
  React.useEffect(() => {
    if (groups.length > 0) {
      setOpenMonths((prev) => {
        if (prev.size > 0) return prev
        return new Set([groups[0][0]])
      })
    }
  }, [groups])

  function toggleMonth(key: string) {
    setOpenMonths((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleDownloadICS() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('gw94_access_token') || '' : ''
    fetch('/api/events/ical', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error('下载失败')
        return res.blob()
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'guanwang94-events.ics'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('已下载日历文件，可导入 Google/Apple/Outlook Calendar')
      })
      .catch(() => toast.error('下载失败，请稍后重试'))
  }

  return (
    <section
      id="archive"
      className="mx-auto w-full max-w-4xl scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      {/* 标题 */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <Archive className="size-3.5" />
            Archive · 事件归档
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            事件归档时间线
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            按月份回溯班级的每一个重要时刻
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownloadICS}
          className="h-10 shrink-0 gap-1.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-600/10 dark:text-emerald-300"
        >
          <CalendarPlus className="size-4" />
          <span className="hidden sm:inline">订阅日历</span>
          <span className="sm:hidden">日历</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <span className="ml-2 text-sm">加载中…</span>
        </div>
      ) : isError ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
          <p className="text-sm">加载失败</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="h-9 rounded-md border bg-background px-3 text-sm hover:bg-accent"
          >
            重试
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Calendar className="size-8 opacity-60" />
          <p className="text-sm">暂无归档</p>
        </div>
      ) : (
        <div className="relative pl-6">
          {/* 左侧时间线 */}
          <div
            aria-hidden
            className="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-emerald-500/60 via-emerald-500/40 to-transparent"
          />

          <div className="space-y-3">
            {groups.map(([key, items]) => {
              const open = openMonths.has(key)
              return (
                <Collapsible
                  key={key}
                  open={open}
                  onOpenChange={() => toggleMonth(key)}
                  className="group"
                >
                  {/* 月份卡片头部 */}
                  <div className="relative">
                    {/* 圆点 */}
                    <span
                      aria-hidden
                      className={cn(
                        'absolute -left-6 top-3.5 size-3.5 rounded-full border-2 border-background transition-colors',
                        open ? 'bg-emerald-600' : 'bg-muted-foreground/60',
                      )}
                    />

                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3 text-left shadow-sm transition-colors',
                          'hover:border-emerald-500/40 hover:bg-emerald-600/5',
                          open && 'border-emerald-500/40 bg-emerald-600/5',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-emerald-600" />
                          <span className="text-sm font-semibold">
                            {monthLabel(key)}
                          </span>
                          <Badge
                            variant="secondary"
                            className="ml-1 text-xs"
                          >
                            {items.length} 条
                          </Badge>
                        </div>
                        <ChevronDown
                          className={cn(
                            'size-4 text-muted-foreground transition-transform',
                            open && 'rotate-180',
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>
                  </div>

                  {/* 展开内容 */}
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 space-y-2 pl-1">
                          {items.map((ev) => (
                            <button
                              key={ev.id}
                              type="button"
                              onClick={() => openEvent(ev.id)}
                              className={cn(
                                'group/event flex w-full items-start gap-3 rounded-lg border bg-card px-3 py-2.5 text-left shadow-sm transition-all',
                                'hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md',
                                'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
                              )}
                            >
                              {/* 日期 */}
                              <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-md bg-emerald-600/10 px-1 py-1 text-center">
                                <span className="text-base font-bold leading-none text-emerald-700 dark:text-emerald-300">
                                  {new Date(ev.publishedAt).getDate()}
                                </span>
                                <span className="mt-0.5 text-[10px] uppercase text-emerald-700/70 dark:text-emerald-300/70">
                                  {Number(monthKey(ev.publishedAt).slice(5, 7))}月
                                </span>
                              </div>

                              {/* 内容 */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <Badge
                                    className={cn(
                                      'border-transparent text-[11px]',
                                      CATEGORY_COLOR[ev.category] ||
                                        'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300',
                                    )}
                                  >
                                    {ev.category}
                                  </Badge>
                                  {ev.pinned > 0 && (
                                    <Badge className="border-transparent bg-emerald-600 text-[11px] text-white">
                                      <Pin className="size-3" />
                                      置顶
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="mt-1 line-clamp-1 text-sm font-semibold">
                                  {ev.title}
                                </h4>
                                {ev.summary && (
                                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                    {ev.summary}
                                  </p>
                                )}
                              </div>

                              {/* 右侧：日期 + 浏览数 */}
                              <div className="flex shrink-0 flex-col items-end justify-between gap-1 text-[11px] text-muted-foreground">
                                <span>{formatDate(ev.publishedAt)}</span>
                                <span className="inline-flex items-center gap-0.5">
                                  <Eye className="size-3" />
                                  {formatNumber(ev.viewCount)}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Collapsible>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
