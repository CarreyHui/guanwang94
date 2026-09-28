// 九四班官网 - 管理后台「管理事件」
// 表格列表 + 分页（每页 10 条）+ 操作：预览 / 置顶切换 / 编辑 / 删除（AlertDialog 确认）
// 预览调 use-event-modal.openEvent(id)；编辑切到 publish-form-tab 并传 event id

'use client'

import * as React from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Eye,
  Pencil,
  Pin,
  PinOff,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { listEvents, deleteEvent, toggleEventPin } from '@/lib/api'
import type { Event, EventListResponse } from '@/lib/types'
import { formatDateTime, formatNumber } from '@/lib/format'
import { useEventModal } from '@/store/use-event-modal'
import { useAdminPanel } from '@/store/use-admin-panel'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

// 分类 → badge 颜色
function categoryClass(category: string): string {
  switch (category) {
    case '班级活动':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
    case '学习通知':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200'
    case '重要公告':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
    case '校园新闻':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function ManageEventsTab() {
  const [page, setPage] = React.useState(1)
  const [delTarget, setDelTarget] = React.useState<Event | null>(null)

  const queryClient = useQueryClient()
  const openEvent = useEventModal((s) => s.openEvent)
  const startEditEvent = useAdminPanel((s) => s.startEditEvent)
  const setActiveTab = useAdminPanel((s) => s.setActiveTab)

  const list = useQuery<EventListResponse>({
    queryKey: ['admin', 'events', page, PAGE_SIZE],
    queryFn: () => listEvents({ page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  })

  const pinMutation = useMutation({
    mutationFn: (id: string) => toggleEventPin(id),
    onSuccess: (res) => {
      toast.success(res.pinned ? '已置顶' : '已取消置顶')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] })
      void queryClient.invalidateQueries({ queryKey: ['events-list'] })
      void queryClient.invalidateQueries({ queryKey: ['events-pinned'] })
      void queryClient.invalidateQueries({ queryKey: ['events-archive-all'] })
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : '操作失败'
      toast.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      toast.success('事件已删除')
      setDelTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'top-events'] })
      void queryClient.invalidateQueries({ queryKey: ['events-list'] })
      void queryClient.invalidateQueries({ queryKey: ['events-archive-all'] })
      void queryClient.invalidateQueries({ queryKey: ['events-pinned'] })
      void queryClient.invalidateQueries({ queryKey: ['event-tags'] })
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : '删除失败'
      toast.error(msg)
    },
  })

  const items = list.data?.items ?? []
  const total = list.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // 当 page 超出 totalPages 时自动回退（删除最后一项时）
  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function handleEdit(ev: Event) {
    startEditEvent(ev.id)
    // 切到 publish-form-tab 由 startEditEvent 处理
    void setActiveTab('publish')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 顶部：标题 + 发布新事件 */}
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">管理事件</h2>
          <p className="text-sm text-muted-foreground">
            共 {formatNumber(total)} 条，每页 {PAGE_SIZE} 条
          </p>
        </div>
        <Button
          type="button"
          onClick={() => startEditEvent(null)}
          className="h-10 gap-1.5 bg-emerald-600 hover:bg-emerald-600/90"
        >
          <Plus className="size-4" />
          发布新事件
        </Button>
      </header>

      {/* 表格 */}
      <div className="rounded-lg border border-emerald-600/15">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">标题</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>优先级</TableHead>
              <TableHead>置顶</TableHead>
              <TableHead className="text-right">浏览数</TableHead>
              <TableHead className="hidden md:table-cell">发布时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex h-20 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    加载中…
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!list.isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                    暂无事件，点右上角「发布新事件」开始吧
                  </div>
                </TableCell>
              </TableRow>
            )}
            {items.map((ev) => (
              <TableRow key={ev.id}>
                <TableCell className="max-w-[260px]">
                  <div className="truncate font-medium">{ev.title}</div>
                  <div className="line-clamp-1 text-xs text-muted-foreground">
                    {ev.summary}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn('border-transparent', categoryClass(ev.category))}
                  >
                    {ev.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  {ev.priority === 'high' ? (
                    <Badge className="bg-amber-500 text-white">重要</Badge>
                  ) : (
                    <Badge variant="secondary">普通</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {ev.pinned ? (
                    <Badge className="bg-emerald-600 text-white">
                      <Pin className="size-3" />
                      置顶
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatNumber(ev.viewCount)}
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground md:table-cell">
                  {formatDateTime(ev.publishedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-9 text-emerald-700 hover:bg-emerald-600/10 dark:text-emerald-300"
                      onClick={() => openEvent(ev.id)}
                      title="预览"
                      aria-label="预览"
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-9"
                      onClick={() => pinMutation.mutate(ev.id)}
                      disabled={pinMutation.isPending}
                      title={ev.pinned ? '取消置顶' : '置顶'}
                      aria-label={ev.pinned ? '取消置顶' : '置顶'}
                    >
                      {ev.pinned ? (
                        <PinOff className="size-4" />
                      ) : (
                        <Pin className="size-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-9 text-emerald-700 hover:bg-emerald-600/10 dark:text-emerald-300"
                      onClick={() => handleEdit(ev)}
                      title="编辑"
                      aria-label="编辑"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-9 text-rose-600 hover:bg-rose-600/10 dark:text-rose-400"
                      onClick={() => setDelTarget(ev)}
                      title="删除"
                      aria-label="删除"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            第 {page} / {totalPages} 页
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || list.isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-9"
            >
              <ChevronLeft className="size-4" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || list.isFetching}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-9"
            >
              下一页
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      <AlertDialog
        open={!!delTarget}
        onOpenChange={(o) => { if (!o) setDelTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该事件？</AlertDialogTitle>
            <AlertDialogDescription>
              将永久删除「{delTarget?.title}」，删除后无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11" disabled={deleteMutation.isPending}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 bg-rose-600 hover:bg-rose-600/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault()
                if (delTarget) deleteMutation.mutate(delTarget.id)
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  删除中…
                </>
              ) : (
                '确认删除'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
