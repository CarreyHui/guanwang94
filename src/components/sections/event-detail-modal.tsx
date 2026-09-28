// 九四班官网 - 事件详情 Modal
// 用 shadcn Dialog；从 useEventModal 全局 store 读 open + selectedId
// 显示封面（点击放大 Lightbox） + 标题 + 分类/优先级 Badge + 时间/浏览数/阅读时间 + tags + TOC 目录 + Markdown 正文（GFM） + 相关事件 + 分享/打印
// 数据调 /api/events/[id]，后端会 viewCount +1

'use client'

import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Eye,
  Clock,
  Share2,
  Printer,
  Link2,
  Tag,
  Pin,
  GraduationCap,
  Loader2,
  BookOpen,
  ListTree,
  Sparkles,
  CalendarPlus,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LazyImage } from '@/components/lazy-image'
import { Lightbox } from '@/components/lightbox'
import { useEventModal } from '@/store/use-event-modal'
import { getEvent, listEvents } from '@/lib/api'
import type { Event } from '@/lib/types'
import {
  formatDateTime,
  relativeTime,
  formatNumber,
  readingTime,
  extractToc,
  type TocItem,
} from '@/lib/format'
import { cn } from '@/lib/utils'

// 分类 → emerald 系颜色映射（与 events-section 保持一致）
const CATEGORY_COLOR: Record<string, string> = {
  班级活动: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300',
  学习通知: 'bg-teal-600/15 text-teal-700 dark:text-teal-300',
  重要公告: 'bg-amber-600/15 text-amber-700 dark:text-amber-300',
  校园新闻: 'bg-sky-600/15 text-sky-700 dark:text-sky-300',
}

const PRIORITY_HIGH = 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
const PRIORITY_NORMAL = 'bg-slate-500/15 text-slate-600 dark:text-slate-300'

function parseTags(tags: string): string[] {
  if (!tags) return []
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

// 自定义 markdown 渲染器：给 h2/h3 加 id 以便 TOC 跳转
function MarkdownComponents({ toc }: { toc: TocItem[] }) {
  let tocIdx = 0
  return {
    h1: ({ children }: { children?: React.ReactNode }) => {
      const item = toc[tocIdx++]
      return (
        <h1 id={item?.id} className="scroll-mt-4">
          {children}
        </h1>
      )
    },
    h2: ({ children }: { children?: React.ReactNode }) => {
      const item = toc[tocIdx++]
      return (
        <h2 id={item?.id} className="scroll-mt-4">
          {children}
        </h2>
      )
    },
    h3: ({ children }: { children?: React.ReactNode }) => {
      const item = toc[tocIdx++]
      return (
        <h3 id={item?.id} className="scroll-mt-4">
          {children}
        </h3>
      )
    },
  }
}

export function EventDetailModal() {
  const open = useEventModal((s) => s.open)
  const selectedId = useEventModal((s) => s.selectedId)
  const closeEvent = useEventModal((s) => s.closeEvent)
  const openEvent = useEventModal((s) => s.openEvent)

  // 拉所有事件列表（含 tags），用于翻页 + 按标签筛选
  const [allEvents, setAllEvents] = React.useState<Event[]>([])
  const [byTag, setByTag] = React.useState(false)
  React.useEffect(() => {
    if (!open) {
      setAllEvents([])
      setByTag(false)
      return
    }
    let cancelled = false
    ;(async () => {
      const all: Event[] = []
      let page = 1
      const pageSize = 50
      while (page <= 5) {
        try {
          const res = await listEvents({ page, pageSize })
          all.push(...res.items)
          if (all.length >= res.total || res.items.length < pageSize) break
          page++
        } catch {
          break
        }
      }
      if (!cancelled) setAllEvents(all)
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  const [event, setEvent] = React.useState<Event | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const [related, setRelated] = React.useState<Event[]>([])
  const [scrollPct, setScrollPct] = React.useState(0)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  // 当前事件的 tags（用于 byTag 筛选）
  const currentTags = React.useMemo(() => {
    if (!event) return [] as string[]
    return event.tags
      ? event.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []
  }, [event])

  // 翻页列表（byTag 时只取与当前事件有共同标签的事件）
  const navList = React.useMemo(() => {
    if (!byTag || currentTags.length === 0) return allEvents
    const tagSet = new Set(currentTags)
    return allEvents.filter((e) => {
      const eTags = e.tags ? e.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
      return eTags.some((t) => tagSet.has(t))
    })
  }, [allEvents, byTag, currentTags])

  const eventIds = navList.map((e) => e.id)
  const currentIndex = selectedId ? eventIds.indexOf(selectedId) : -1
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < eventIds.length - 1

  function handlePrev() {
    if (hasPrev) openEvent(eventIds[currentIndex - 1])
  }
  function handleNext() {
    if (hasNext) openEvent(eventIds[currentIndex + 1])
  }

  // 键盘左右键翻页
  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, hasPrev, hasNext, currentIndex, eventIds])

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const max = el.scrollHeight - el.clientHeight
    if (max <= 0) {
      setScrollPct(0)
      return
    }
    setScrollPct(Math.min(100, Math.max(0, (el.scrollTop / max) * 100)))
  }

  // 打开时拉取详情
  React.useEffect(() => {
    if (!open || !selectedId) {
      setEvent(null)
      setRelated([])
      return
    }
    let cancelled = false
    setLoading(true)
    setEvent(null)
    setRelated([])
    getEvent(selectedId)
      .then(async (data) => {
        if (cancelled) return
        setEvent(data)
        // 拉相关事件：按标签匹配优先 + 同分类兜底
        try {
          const myTags = data.tags
            ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
            : []
          // 1. 先按每个标签拉候选（去重）
          const candidates = new Map<string, Event>()
          // 同分类候选
          const catRes = await listEvents({ category: data.category, page: 1, pageSize: 10 })
          for (const e of catRes.items) {
            if (e.id !== data.id) candidates.set(e.id, e)
          }
          // 按每个标签拉候选
          for (const tag of myTags.slice(0, 3)) {
            try {
              const tagRes = await listEvents({ tag, page: 1, pageSize: 5 })
              for (const e of tagRes.items) {
                if (e.id !== data.id) candidates.set(e.id, e)
              }
            } catch {
              // 单个标签失败不阻塞
            }
          }
          // 2. 按标签重合度排序
          const myTagSet = new Set(myTags)
          const scored = Array.from(candidates.values()).map((e) => {
            const eTags = e.tags ? e.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
            const overlap = eTags.filter((t) => myTagSet.has(t)).length
            // 同分类 +1 分
            const sameCat = e.category === data.category ? 1 : 0
            // 高浏览 +0.5 分（归一化）
            const viewScore = Math.min(0.5, e.viewCount / 1000)
            return { event: e, score: overlap * 2 + sameCat + viewScore }
          })
          scored.sort((a, b) => b.score - a.score || b.event.viewCount - a.event.viewCount)
          if (!cancelled) {
            setRelated(scored.slice(0, 3).map((s) => s.event))
          }
        } catch {
          // 相关事件失败不影响主流程
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : '加载事件失败')
          closeEvent()
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, selectedId, closeEvent])

  // 关闭 lightbox 也跟随关闭 + 重置进度
  React.useEffect(() => {
    if (!open) {
      setLightboxOpen(false)
      setScrollPct(0)
    }
  }, [open])

  async function handleShare() {
    if (typeof window === 'undefined' || !navigator.share) return
    try {
      await navigator.share({
        title: event?.title || '九四班官网',
        text: event?.summary || '',
        url: window.location.href,
      })
    } catch {
      // 用户取消分享，忽略
    }
  }

  async function handleCopyLink() {
    if (typeof window === 'undefined' || !navigator.clipboard) {
      toast.error('当前浏览器不支持复制')
      return
    }
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('已复制链接')
    } catch {
      toast.error('复制失败')
    }
  }

  function handlePrint() {
    if (typeof window !== 'undefined') window.print()
  }

  // 加入日历（生成单个事件 .ics 文件并下载）
  function handleAddToCalendar() {
    if (!event) return
    try {
      const start = new Date(event.publishedAt)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      const pad = (n: number) => String(n).padStart(2, '0')
      const fmt = (d: Date) =>
        d.getUTCFullYear().toString() +
        pad(d.getUTCMonth() + 1) +
        pad(d.getUTCDate()) +
        'T' +
        pad(d.getUTCHours()) +
        pad(d.getUTCMinutes()) +
        pad(d.getUTCSeconds()) +
        'Z'
      const esc = (s: string) =>
        s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n').replace(/\r/g, '')
      const tags = parseTags(event.tags)
      const cats = [event.category, ...tags].slice(0, 5).map(esc).join(',')
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Guanwang94//九四班官网//CN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${event.id}@guanwang94.saozi.cc.cd`,
        `DTSTAMP:${fmt(new Date())}`,
        `DTSTART:${fmt(start)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${esc(event.title)}`,
        `DESCRIPTION:${esc(event.summary + '\n\n' + event.content.replace(/[#*`>_~]/g, ''))}`,
        `CATEGORIES:${cats}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n')
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gw94-event-${event.id.slice(-6)}.ics`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('已生成日历文件，可导入 Google/Apple/Outlook Calendar')
    } catch (err) {
      toast.error('生成日历文件失败')
    }
  }

  // 下载全部事件 iCal
  function handleDownloadAllICS() {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('gw94_access_token') || ''
    // 通过 fetch 拿 .ics 文件
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
        toast.success('已下载全部事件日历')
      })
      .catch(() => toast.error('下载失败，请稍后重试'))
  }

  const tags = event ? parseTags(event.tags) : []
  const toc = event ? extractToc(event.content) : []
  const readTime = event ? readingTime(event.content) : ''
  const [canShare, setCanShare] = React.useState(false)
  React.useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  // 滚动到指定 TOC anchor
  function scrollToHeading(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && closeEvent()}>
        <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-2xl">
          <DialogTitle className="sr-only">事件详情</DialogTitle>
          <DialogDescription className="sr-only">
            查看事件标题、摘要、正文与相关标签
          </DialogDescription>

          {/* 顶部阅读进度条 */}
          <div className="absolute inset-x-0 top-0 z-20 h-1 bg-muted">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 transition-[width] duration-150"
              style={{ width: `${scrollPct}%` }}
            />
          </div>

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex max-h-[92vh] flex-col overflow-y-auto"
          >
            {loading && (
              <div className="flex h-72 items-center justify-center text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
                <span className="ml-2 text-sm">加载中…</span>
              </div>
            )}

            {!loading && event && (
              <>
                {/* 封面图 */}
                {event.coverImage && (
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="group relative block aspect-[16/9] w-full overflow-hidden"
                    aria-label="点击放大封面"
                  >
                    <LazyImage
                      src={event.coverImage}
                      alt={event.title}
                      aspectRatio="wide"
                      className="size-full"
                      imgClassName="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-xs text-white opacity-90 backdrop-blur-sm">
                      <Eye className="size-3.5" />
                      点击放大
                    </span>
                  </button>
                )}

                <div className="flex flex-col gap-4 px-5 pb-6 pt-4 sm:px-6">
                  {/* Badges 行 */}
                  <div className="flex flex-wrap items-center gap-2">
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
                    {event.pinned > 0 && (
                      <Badge className="border-transparent bg-emerald-600 text-white">
                        <Pin className="size-3" />
                        置顶
                      </Badge>
                    )}
                  </div>

                  {/* 标题 */}
                  <h2 className="text-2xl font-bold leading-tight tracking-tight">
                    {event.title}
                  </h2>

                  {/* 元信息（新增阅读时间） */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {formatDateTime(event.publishedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3.5" />
                      {formatNumber(event.viewCount)} 次浏览
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="size-3.5" />
                      {readTime}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap className="size-3.5" />
                      九四班
                    </span>
                    {event.updatedAt && event.updatedAt !== event.createdAt && (
                      <span className="text-muted-foreground/70">
                        最近更新 {relativeTime(event.updatedAt)}
                      </span>
                    )}
                  </div>

                  {/* 摘要 */}
                  {event.summary && (
                    <p className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                      {event.summary}
                    </p>
                  )}

                  {/* 标签 */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tag className="size-3.5 text-muted-foreground" />
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* TOC 目录（仅当标题 ≥ 2 个时显示） */}
                  {toc.length >= 2 && (
                    <div className="rounded-lg border border-emerald-600/20 bg-emerald-600/5 px-4 py-3">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        <ListTree className="size-3.5" />
                        本文目录
                      </div>
                      <ul className="flex flex-col gap-0.5 text-sm">
                        {toc.map((item, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              onClick={() => scrollToHeading(item.id)}
                              className={cn(
                                'w-full text-left text-muted-foreground transition-colors hover:text-emerald-700 dark:hover:text-emerald-300',
                                item.level === 1 && 'font-medium',
                                item.level === 2 && 'pl-3',
                                item.level === 3 && 'pl-6 text-xs',
                              )}
                            >
                              {item.text}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 正文（Markdown + GFM） */}
                  {event.content && (
                    <div className="prose-94 mt-1 border-t pt-4 text-sm">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents({ toc })}
                      >
                        {event.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* 相关事件 */}
                  {related.length > 0 && (
                    <div className="mt-2 border-t pt-4">
                      <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
                        <Sparkles className="size-4 text-emerald-600" />
                        相关推荐
                        <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                          （按标签匹配）
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {related.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => openEvent(e.id)}
                            className="group flex flex-col gap-1.5 rounded-lg border border-border bg-card p-2.5 text-left transition-all hover:border-emerald-600/40 hover:shadow-sm"
                          >
                            {e.coverImage && (
                              <div className="aspect-[16/9] w-full overflow-hidden rounded">
                                <LazyImage
                                  src={e.coverImage}
                                  alt={e.title}
                                  aspectRatio="wide"
                                  className="size-full"
                                  imgClassName="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              </div>
                            )}
                            <span className="line-clamp-2 text-xs font-medium leading-snug">
                              {e.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatNumber(e.viewCount)} 次浏览
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 底部操作区 */}
                  <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-4">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCopyLink}
                      className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-600/90"
                    >
                      <Link2 className="size-4" />
                      复制直链
                    </Button>
                    {canShare && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleShare}
                        className="h-9 gap-1.5"
                      >
                        <Share2 className="size-4" />
                        系统分享
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handlePrint}
                      className="h-9 gap-1.5"
                    >
                      <Printer className="size-4" />
                      打印
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddToCalendar}
                      className="h-9 gap-1.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-600/10 dark:text-emerald-300"
                    >
                      <CalendarPlus className="size-4" />
                      加入日历
                    </Button>
                    {/* 翻页按钮 */}
                    {eventIds.length > 1 && (
                      <div className="ml-auto flex flex-wrap items-center gap-1.5">
                        {/* 按标签翻页 toggle */}
                        {currentTags.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setByTag((v) => !v)}
                            aria-pressed={byTag}
                            title={byTag ? '当前：仅在有共同标签的事件间翻页' : '开启：仅在有共同标签的事件间翻页'}
                            className={cn(
                              'inline-flex h-9 items-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors',
                              byTag
                                ? 'border-emerald-600 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300'
                                : 'border-border text-muted-foreground hover:bg-accent',
                            )}
                          >
                            <Tag className="size-3.5" />
                            <span className="hidden sm:inline">按标签</span>
                          </button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handlePrev}
                          disabled={!hasPrev}
                          className="h-9 gap-1.5"
                          aria-label="上一条事件"
                        >
                          <ChevronLeft className="size-4" />
                          <span className="hidden sm:inline">上一条</span>
                        </Button>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {currentIndex >= 0 ? currentIndex + 1 : '-'}/{eventIds.length}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleNext}
                          disabled={!hasNext}
                          className="h-9 gap-1.5"
                          aria-label="下一条事件"
                        >
                          <span className="hidden sm:inline">下一条</span>
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 封面 Lightbox */}
      {event?.coverImage && (
        <Lightbox
          open={lightboxOpen}
          index={0}
          images={[{ src: event.coverImage, alt: event.title }]}
          onIndexChange={() => {}}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}
