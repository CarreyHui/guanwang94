// 九四班官网 - 重要事件区
// 分类 Tabs（全部 / 班级活动 / 学习通知 / 重要公告 / 校园新闻）+ 搜索框 + 标签云 + 置顶横幅 + 卡片瀑布流 + 加载更多
// 数据调 /api/events、/api/events/tags；点击卡片打开 EventDetailModal（共享 useEventModal store）

'use client'

import * as React from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Search,
  Pin,
  Eye,
  Clock,
  Loader2,
  Sparkles,
  Tag as TagIcon,
  X,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Flame,
  Calendar,
  TrendingUp,
} from 'lucide-react'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LazyImage } from '@/components/lazy-image'
import { useEventModal } from '@/store/use-event-modal'
import { useAppStore } from '@/store/use-app-store'
import { listEvents, listEventTags } from '@/lib/api'
import type { Event, EventCategory } from '@/lib/types'
import { formatDate, formatNumber, relativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { EmptyState, EventCardSkeleton } from '@/components/empty-state'

// 分类标签
const CATEGORIES: EventCategory[] = [
  '全部',
  '班级活动',
  '学习通知',
  '重要公告',
  '校园新闻',
]

const CATEGORY_COLOR: Record<string, string> = {
  班级活动: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300',
  学习通知: 'bg-teal-600/15 text-teal-700 dark:text-teal-300',
  重要公告: 'bg-amber-600/15 text-amber-700 dark:text-amber-300',
  校园新闻: 'bg-sky-600/15 text-sky-700 dark:text-sky-300',
}

const PRIORITY_HIGH = 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
const PRIORITY_NORMAL = 'bg-slate-500/15 text-slate-600 dark:text-slate-300'

const PAGE_SIZE = 12

function parseTags(tags: string): string[] {
  if (!tags) return []
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

// ===== 置顶事件横幅 =====
function PinnedBanner({
  events,
  onOpen,
}: {
  events: Event[]
  onOpen: (id: string) => void
}) {
  if (events.length === 0) return null
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((ev, i) => (
        <motion.button
          key={ev.id}
          type="button"
          onClick={() => onOpen(ev.id)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
          className={cn(
            'group relative flex h-full flex-col justify-between overflow-hidden rounded-xl p-4 text-left',
            'bg-gradient-to-br from-emerald-600 via-emerald-600/95 to-teal-600 text-white shadow-md',
            'ring-1 ring-emerald-600/40 transition-transform hover:-translate-y-0.5',
          )}
        >
          {/* 背景大 Pin */}
          <Pin className="absolute -right-2 -top-2 size-20 text-white/10" />

          <div className="relative z-10 flex items-start gap-2">
            <Badge className="border-transparent bg-white/20 text-white">
              <Pin className="size-3" />
              置顶
            </Badge>
            <Badge className="border-transparent bg-white/15 text-white/90">
              {ev.category}
            </Badge>
          </div>

          <div className="relative z-10 mt-3">
            <h3 className="line-clamp-2 text-base font-bold leading-snug">
              {ev.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs text-white/80">
              {ev.summary}
            </p>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-white/70">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" />
                {formatDate(ev.publishedAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3" />
                {formatNumber(ev.viewCount)}
              </span>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  )
}

// ===== 单卡片 =====
function EventCard({
  event,
  index,
  onOpen,
}: {
  event: Event
  index: number
  onOpen: (id: string) => void
}) {
  const tags = parseTags(event.tags).slice(0, 4)
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(event.id)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm',
        'transition-[box-shadow,border-color] duration-300',
        'hover:border-emerald-600/40 hover:shadow-lg hover:shadow-emerald-600/10',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
      )}
    >
      {/* hover 时左上角光晕 */}
      <span
        className="pointer-events-none absolute -left-12 -top-12 size-24 rounded-full bg-emerald-500/20 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />
      {/* 封面 */}
      <div className="relative overflow-hidden">
        <LazyImage
          src={event.coverImage}
          alt={event.title}
          aspectRatio="wide"
          className="size-full"
          imgClassName="size-full object-cover transition-transform duration-700 group-hover:scale-110"
          fallbackSrc={`https://picsum.photos/seed/gw94ev${event.id.slice(-6)}/640/360`}
        />
        {/* 渐变遮罩（hover 时浮现） */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {/* 中心 hover 图标 */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
          <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-emerald-700 shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-100 scale-75">
            <ArrowRight className="size-5" />
          </span>
        </div>
        {/* 置顶标 */}
        {event.pinned > 0 && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm">
            <Pin className="size-3" />
            置顶
          </span>
        )}
        {/* hover 时右下角阅读提示 */}
        <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium text-emerald-700 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 translate-y-2">
          阅读全文
          <ArrowRight className="size-3" />
        </span>
      </div>

      {/* 内容 */}
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            className={cn(
              'border-transparent',
              CATEGORY_COLOR[event.category] ||
                'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300',
            )}
          >
            {event.category}
          </Badge>
          <Badge
            className={cn(
              'border-transparent',
              event.priority === 'high' ? PRIORITY_HIGH : PRIORITY_NORMAL,
            )}
          >
            {event.priority === 'high' ? '高优先级' : '普通'}
          </Badge>
        </div>

        {/* 标题 */}
        <h3 className="line-clamp-2 text-sm font-bold leading-snug">
          {event.title}
        </h3>

        {/* 摘要 */}
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {event.summary}
        </p>

        {/* 标签 chips */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* 底部元信息 */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {relativeTime(event.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3" />
            {formatNumber(event.viewCount)}
          </span>
        </div>
      </div>
    </motion.button>
  )
}

// ===== Section 主组件 =====
export function EventsSection() {
  const accessPassed = useAppStore((s) => s.accessPassed)
  const hydrateFromTokens = useAppStore((s) => s.hydrateFromTokens)
  const openEvent = useEventModal((s) => s.openEvent)

  React.useEffect(() => {
    hydrateFromTokens()
  }, [hydrateFromTokens])

  // ===== 从 URL hash 读初始筛选状态 =====
  const readHash = React.useCallback(() => {
    if (typeof window === 'undefined') return null
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash) return null
    try {
      const params = new URLSearchParams(hash.startsWith('?') ? hash.slice(1) : hash)
      return {
        category: params.get('c') as EventCategory | null,
        q: params.get('q'),
        tag: params.get('t'),
        priority: params.get('p'),
        sort: params.get('s') as 'default' | 'latest' | 'oldest' | 'popular' | 'pinned' | null,
        pinnedOnly: params.get('pi') === '1',
      }
    } catch {
      return null
    }
  }, [])

  const initial = readHash()
  const [category, setCategory] = React.useState<EventCategory>(
    initial?.category && ['全部', '班级活动', '学习通知', '重要公告', '校园新闻'].includes(initial.category)
      ? initial.category
      : '全部',
  )
  const [queryInput, setQueryInput] = React.useState(initial?.q || '')
  const [query, setQuery] = React.useState(initial?.q || '')
  const [activeTag, setActiveTag] = React.useState<string>(initial?.tag || '')
  const [priority, setPriority] = React.useState<string>(
    initial?.priority && ['all', 'high', 'normal'].includes(initial.priority)
      ? initial.priority
      : 'all',
  )
  const [sort, setSort] = React.useState<'default' | 'latest' | 'oldest' | 'popular' | 'pinned'>(
    initial?.sort && ['default', 'latest', 'oldest', 'popular', 'pinned'].includes(initial.sort)
      ? initial.sort
      : 'default',
  )
  const [pinnedOnly, setPinnedOnly] = React.useState(initial?.pinnedOnly || false)
  const [showAdvanced, setShowAdvanced] = React.useState(
    !!(initial?.priority && initial.priority !== 'all') ||
      !!(initial?.sort && initial.sort !== 'default') ||
      !!(initial?.pinnedOnly),
  )

  // ===== 筛选变化时同步到 URL hash =====
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams()
    if (category !== '全部') params.set('c', category)
    if (query) params.set('q', query)
    if (activeTag) params.set('t', activeTag)
    if (priority !== 'all') params.set('p', priority)
    if (sort !== 'default') params.set('s', sort)
    if (pinnedOnly) params.set('pi', '1')

    const hashStr = params.toString()
    const newHash = hashStr ? `#events?${hashStr}` : '#events'

    // 避免重复触发
    if (window.location.hash !== newHash && window.location.hash.replace(/\?.*$/, '') !== '#events') {
      window.history.replaceState(null, '', newHash)
    } else if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash)
    }
  }, [category, query, activeTag, priority, sort, pinnedOnly])

  // 监听 hashchange（用户前进/后退）
  React.useEffect(() => {
    function onHashChange() {
      const h = readHash()
      if (!h) return
      if (h.category) setCategory(h.category)
      else setCategory('全部')
      if (h.q !== null) {
        setQueryInput(h.q)
        setQuery(h.q)
      }
      if (h.tag !== null) setActiveTag(h.tag)
      else setActiveTag('')
      if (h.priority) setPriority(h.priority)
      else setPriority('all')
      if (h.sort) setSort(h.sort)
      else setSort('default')
      setPinnedOnly(h.pinnedOnly || false)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [readHash])

  // debounce 300ms
  React.useEffect(() => {
    const t = setTimeout(() => setQuery(queryInput.trim()), 300)
    return () => clearTimeout(t)
  }, [queryInput])

  // ===== 标签云 =====
  const tagsQuery = useQuery({
    queryKey: ['event-tags'],
    queryFn: listEventTags,
    enabled: accessPassed,
    staleTime: 60 * 1000,
  })

  // ===== 置顶事件横幅（跨分类，最多 3 条）=====
  const pinnedQuery = useQuery({
    queryKey: ['events-pinned'],
    queryFn: () => listEvents({ pageSize: 50 }),
    enabled: accessPassed,
    staleTime: 30 * 1000,
  })
  const pinnedEvents = React.useMemo(() => {
    const items = pinnedQuery.data?.items ?? []
    return items
      .filter((e) => e.pinned > 0)
      .sort((a, b) => b.pinned - a.pinned)
      .slice(0, 3)
  }, [pinnedQuery.data])
  const pinnedIds = React.useMemo(
    () => new Set(pinnedEvents.map((e) => e.id)),
    [pinnedEvents],
  )

  // ===== 卡片瀑布流（无限加载，过滤掉已展示的置顶事件）=====
  const cardsQuery = useInfiniteQuery({
    queryKey: ['events-list', category, query, activeTag, priority, sort, pinnedOnly],
    queryFn: ({ pageParam }) =>
      listEvents({
        category: category === '全部' ? '' : category,
        q: query,
        tag: activeTag,
        priority: priority === 'all' ? '' : priority,
        sort,
        pinnedOnly,
        page: pageParam,
        pageSize: PAGE_SIZE,
      }),
    enabled: accessPassed,
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const loaded = last.page * last.pageSize
      return loaded < last.total ? last.page + 1 : undefined
    },
  })

  // 客户端过滤掉已展示在 banner 中的置顶事件
  const cards = React.useMemo(() => {
    const all = cardsQuery.data?.pages.flatMap((p) => p.items) ?? []
    return all.filter((e) => !pinnedIds.has(e.id))
  }, [cardsQuery.data, pinnedIds])

  const totalCards = React.useMemo(() => {
    const t = cardsQuery.data?.pages[0]?.total ?? 0
    return Math.max(0, t - pinnedIds.size)
  }, [cardsQuery.data, pinnedIds])

  const hasMore = cardsQuery.hasNextPage && !cardsQuery.isFetchingNextPage

  // 任何筛选变化都重置分页（useInfiniteQuery 的 queryKey 变更会自动重置）
  // 这里保证视觉上 page=1
  const isFiltered =
    query !== '' ||
    activeTag !== '' ||
    category !== '全部' ||
    priority !== 'all' ||
    sort !== 'default' ||
    pinnedOnly

  function handleClearFilters() {
    setQueryInput('')
    setActiveTag('')
    setCategory('全部')
    setPriority('all')
    setSort('default')
    setPinnedOnly(false)
  }

  return (
    <section
      id="events"
      className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      {/* 标题 */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <Sparkles className="size-3.5" />
            Events · 重要事件
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            重要事件
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            班级活动 · 学习通知 · 重要公告 · 校园新闻
          </p>
        </div>
      </div>

      {/* 工具栏：搜索 + Tabs + 高级筛选 */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索标题 / 摘要…"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            className="h-11 pl-9"
            aria-label="搜索事件"
          />
          {queryInput && (
            <button
              type="button"
              onClick={() => setQueryInput('')}
              aria-label="清空搜索"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 高级筛选按钮 */}
          <Button
            type="button"
            variant={showAdvanced || (priority !== 'all' || sort !== 'default' || pinnedOnly) ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAdvanced((v) => !v)}
            className="h-11 gap-1.5"
          >
            <SlidersHorizontal className="size-4" />
            高级
            {(priority !== 'all' || sort !== 'default' || pinnedOnly) && (
              <span className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {[priority !== 'all', sort !== 'default', pinnedOnly].filter(Boolean).length}
              </span>
            )}
            {showAdvanced ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </Button>

          <Tabs
            value={category}
            onValueChange={(v) => setCategory(v as EventCategory)}
            className="w-full sm:w-auto"
          >
            <TabsList className="flex h-11 w-full flex-wrap justify-start sm:w-auto">
              {CATEGORIES.map((c) => (
                <TabsTrigger key={c} value={c} className="h-9 px-3 text-sm">
                  {c}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 高级筛选面板（可折叠） */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 overflow-hidden rounded-lg border border-emerald-600/20 bg-emerald-600/5 p-4"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {/* 优先级 */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Flame className="size-3.5" />
                优先级
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="全部优先级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部优先级</SelectItem>
                  <SelectItem value="high">高优先级</SelectItem>
                  <SelectItem value="normal">普通</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* 排序 */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                {sort === 'popular' ? <TrendingUp className="size-3.5" /> : <Calendar className="size-3.5" />}
                排序方式
              </label>
              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">默认（置顶优先）</SelectItem>
                  <SelectItem value="latest">最新发布</SelectItem>
                  <SelectItem value="oldest">最早发布</SelectItem>
                  <SelectItem value="popular">最热浏览</SelectItem>
                  <SelectItem value="pinned">仅看置顶</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* 置顶开关 */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setPinnedOnly((v) => !v)}
                className={cn(
                  'flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm transition-colors',
                  pinnedOnly
                    ? 'border-emerald-600 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-border text-muted-foreground hover:bg-accent',
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Pin className="size-3.5" />
                  只看置顶
                </span>
                <span
                  className={cn(
                    'relative h-5 w-9 rounded-full transition-colors',
                    pinnedOnly ? 'bg-emerald-600' : 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 size-4 rounded-full bg-white transition-transform',
                      pinnedOnly ? 'translate-x-4' : 'translate-x-0.5',
                    )}
                  />
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 标签云 */}
      {tagsQuery.data && tagsQuery.data.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-1.5">
          <TagIcon className="size-3.5 text-muted-foreground" />
          <button
            type="button"
            onClick={() => setActiveTag('')}
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
              activeTag === ''
                ? 'bg-emerald-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-emerald-600/10 hover:text-emerald-700 dark:hover:text-emerald-300',
            )}
          >
            全部标签
          </button>
          {tagsQuery.data.map((t) => (
            <button
              key={t.tag}
              type="button"
              onClick={() => setActiveTag(activeTag === t.tag ? '' : t.tag)}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                activeTag === t.tag
                  ? 'bg-emerald-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-emerald-600/10 hover:text-emerald-700 dark:hover:text-emerald-300',
              )}
            >
              #{t.tag}
              <span className="ml-0.5 text-[10px] opacity-70">{t.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* 置顶横幅（跨分类，始终显示） */}
      {accessPassed && pinnedEvents.length > 0 && (
        <PinnedBanner events={pinnedEvents} onOpen={openEvent} />
      )}

      {/* 卡片瀑布流 */}
      {cardsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : cardsQuery.isError ? (
        <EmptyState
          icon="search"
          title="加载失败"
          description="网络或服务出了点小问题，请稀后重试"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => cardsQuery.refetch()}
              className="h-9 gap-1.5"
            >
              <Loader2 className="size-4" /> 重试
            </Button>
          }
        />
      ) : cards.length === 0 ? (
        <EmptyState
          icon="inbox"
          title={isFiltered ? '没有符合条件的事件' : '暂无事件'}
          description={isFiltered ? '换个关键词或分类试试' : '管理员还没发布事件，敬请期待'}
          action={
            isFiltered ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="h-9"
              >
                清空筛选
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((ev, i) => (
              <EventCard
                key={ev.id}
                event={ev}
                index={i}
                onOpen={openEvent}
              />
            ))}
          </div>

          {/* 加载更多 */}
          <div className="mt-8 flex flex-col items-center gap-2">
            {hasMore ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => cardsQuery.fetchNextPage()}
                disabled={cardsQuery.isFetchingNextPage}
                className="h-11 min-w-[160px] gap-2 border-emerald-600/30 text-emerald-700 hover:bg-emerald-600/10 dark:text-emerald-300"
              >
                {cardsQuery.isFetchingNextPage ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    加载中…
                  </>
                ) : (
                  '加载更多'
                )}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                已显示全部 {cards.length} / {totalCards} 条
              </span>
            )}
          </div>
        </>
      )}
    </section>
  )
}
