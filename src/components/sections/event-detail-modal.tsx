// 九四班官网 - 事件详情 Modal
// 用 shadcn Dialog；从 useEventModal 全局 store 读 open + selectedId
// 显示封面（点击放大 Lightbox） + 标题 + 分类/优先级 Badge + 时间/浏览数 + tags + Markdown 正文 + 分享/打印
// 数据调 /api/events/[id]，后端会 viewCount +1

'use client'

import * as React from 'react'
import ReactMarkdown from 'react-markdown'
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
import { getEvent } from '@/lib/api'
import type { Event } from '@/lib/types'
import { formatDateTime, relativeTime, formatNumber } from '@/lib/format'
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

export function EventDetailModal() {
  const open = useEventModal((s) => s.open)
  const selectedId = useEventModal((s) => s.selectedId)
  const closeEvent = useEventModal((s) => s.closeEvent)

  const [event, setEvent] = React.useState<Event | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [lightboxOpen, setLightboxOpen] = React.useState(false)

  // 打开时拉取详情
  React.useEffect(() => {
    if (!open || !selectedId) {
      setEvent(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setEvent(null)
    getEvent(selectedId)
      .then((data) => {
        if (!cancelled) setEvent(data)
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

  // 关闭 lightbox 也跟随关闭
  React.useEffect(() => {
    if (!open) setLightboxOpen(false)
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

  const tags = event ? parseTags(event.tags) : []
  const [canShare, setCanShare] = React.useState(false)
  React.useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && closeEvent()}>
        <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-2xl">
          <DialogTitle className="sr-only">事件详情</DialogTitle>
          <DialogDescription className="sr-only">
            查看事件标题、摘要、正文与相关标签
          </DialogDescription>

          <div className="flex max-h-[92vh] flex-col overflow-y-auto">
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

                  {/* 元信息 */}
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

                  {/* 正文（Markdown） */}
                  {event.content && (
                    <div className="prose-94 mt-1 border-t pt-4 text-sm">
                      <ReactMarkdown>{event.content}</ReactMarkdown>
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
