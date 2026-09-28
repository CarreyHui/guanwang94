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
  CheckSquare,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [batchConfirm, setBatchConfirm] = React.useState<null | 'delete' | 'pin' | 'unpin'>(null)

  const queryClient = useQueryClient()
  const openEvent = useEventModal((s) => s.openEvent)
  const startEditEvent = useAdminPanel((s) => s.startEditEvent)
  const setActiveTab = useAdminPanel((s) => s.setActiveTab)

  const list = useQuery<EventListResponse>({
    queryKey: ['admin', 'events', page, PAGE_SIZE],
    queryFn: () => listEvents({ page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  })

  const allItems = list.data?.items ?? []
  const allSelected = allItems.length > 0 && allItems.every((e) => selectedIds.has(e.id))
  const someSelected = allItems.some((e) => selectedIds.has(e.id))
  const selectedCount = selectedIds.size

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const e of allItems) next.delete(e.id)
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const e of allItems) next.add(e.id)
        return next
      })
    }
  }
  function clearSelection() {
    setSelectedIds(new Set())
  }

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

  // 批量操作 mutation
  const batchPinMutation = useMutation({
    mutationFn: async ({ ids, pin }: { ids: string[]; pin: boolean }) => {
      // 串行调用 toggleEventPin，遇到已置顶状态需要先判断
      // 简化：直接调 PATCH，后端会切换状态——但批量时状态会乱
      // 改用：先拉每条详情判断当前状态，再决定 toggle 还是 no-op
      // 这里简化：对每个 id 调一次 toggleEventPin，但只对「需要切换」的调
      const results: Promise<{ ok: boolean; id: string; err?: string }>[] = []
      for (const id of ids) {
        // 拿当前事件状态
        const ev = allItems.find((e) => e.id === id)
        if (!ev) continue
        const shouldPin = pin
        if ((ev.pinned > 0) === shouldPin) continue // 已是目标状态，跳过
        results.push(
          toggleEventPin(id)
            .then(() => ({ ok: true, id }))
            .catch((err) => ({ ok: false, id, err: err instanceof Error ? err.message : '失败' })),
        )
      }
      return Promise.all(results)
    },
    onSuccess: (results) => {
      const ok = results.filter((r) => r.ok).length
      const fail = results.filter((r) => !r.ok).length
      if (fail === 0) toast.success(`已批量操作 ${ok} 条`)
      else toast.warning(`成功 ${ok} 条，失败 ${fail} 条`)
      clearSelection()
      setBatchConfirm(null)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] })
      void queryClient.invalidateQueries({ queryKey: ['events-list'] })
      void queryClient.invalidateQueries({ queryKey: ['events-pinned'] })
      void queryClient.invalidateQueries({ queryKey: ['events-archive-all'] })
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : '批量操作失败')
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results: Promise<{ ok: boolean; id: string; err?: string }>[] = []
      for (const id of ids) {
        results.push(
          deleteEvent(id)
            .then(() => ({ ok: true, id }))
            .catch((err) => ({ ok: false, id, err: err instanceof Error ? err.message : '失败' })),
        )
      }
      return Promise.all(results)
    },
    onSuccess: (results) => {
      const ok = results.filter((r) => r.ok).length
      const fail = results.filter((r) => !r.ok).length
      if (fail === 0) toast.success(`已批量删除 ${ok} 条`)
      else toast.warning(`成功 ${ok} 条，失败 ${fail} 条`)
      clearSelection()
      setBatchConfirm(null)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'top-events'] })
      void queryClient.invalidateQueries({ queryKey: ['events-list'] })
      void queryClient.invalidateQueries({ queryKey: ['events-archive-all'] })
      void queryClient.invalidateQueries({ queryKey: ['events-pinned'] })
      void queryClient.invalidateQueries({ queryKey: ['event-tags'] })
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : '批量删除失败')
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

      {/* 批量操作工具栏（仅在有选中时显示） */}
      {selectedCount > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-600/5 px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <CheckSquare className="size-4" />
            已选 {selectedCount} 条
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBatchConfirm('pin')}
              disabled={batchPinMutation.isPending || batchDeleteMutation.isPending}
              className="h-8 gap-1.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-600/10 dark:text-emerald-300"
            >
              <Pin className="size-3.5" />
              批量置顶
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBatchConfirm('unpin')}
              disabled={batchPinMutation.isPending || batchDeleteMutation.isPending}
              className="h-8 gap-1.5"
            >
              <PinOff className="size-3.5" />
              取消置顶
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBatchConfirm('delete')}
              disabled={batchPinMutation.isPending || batchDeleteMutation.isPending}
              className="h-8 gap-1.5 border-rose-500/30 text-rose-600 hover:bg-rose-500/10 dark:text-rose-300"
            >
              <Trash2 className="size-3.5" />
              批量删除
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-8 gap-1.5"
            >
              取消选择
            </Button>
          </div>
        </div>
      )}

      {/* 表格 */}
      <div className="rounded-lg border border-emerald-600/15">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="全选当前页"
                  disabled={allItems.length === 0}
                />
              </TableHead>
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
                <TableCell colSpan={8}>
                  <div className="flex h-20 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    加载中…
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!list.isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                    暂无事件，点右上角「发布新事件」开始吧
                  </div>
                </TableCell>
              </TableRow>
            )}
            {items.map((ev) => (
              <TableRow key={ev.id} data-selected={selectedIds.has(ev.id)}>
                <TableCell className="w-10">
                  <Checkbox
                    checked={selectedIds.has(ev.id)}
                    onCheckedChange={() => toggleSelect(ev.id)}
                    aria-label={`选择 ${ev.title}`}
                  />
                </TableCell>
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

      {/* 批量操作确认 */}
      <AlertDialog
        open={batchConfirm !== null}
        onOpenChange={(o) => { if (!o) setBatchConfirm(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {batchConfirm === 'delete' && `确认批量删除 ${selectedCount} 条事件？`}
              {batchConfirm === 'pin' && `确认批量置顶 ${selectedCount} 条事件？`}
              {batchConfirm === 'unpin' && `确认取消置顶 ${selectedCount} 条事件？`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {batchConfirm === 'delete' && '将永久删除选中事件，删除后无法恢复。此操作不可逆。'}
              {batchConfirm === 'pin' && '选中事件将设为置顶状态（已是置顶的会跳过）。'}
              {batchConfirm === 'unpin' && '选中事件将取消置顶状态（已非置顶的会跳过）。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11" disabled={batchPinMutation.isPending || batchDeleteMutation.isPending}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                'h-11',
                batchConfirm === 'delete'
                  ? 'bg-rose-600 hover:bg-rose-600/90'
                  : 'bg-emerald-600 hover:bg-emerald-600/90',
              )}
              disabled={batchPinMutation.isPending || batchDeleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault()
                const ids = Array.from(selectedIds)
                if (batchConfirm === 'delete') {
                  batchDeleteMutation.mutate(ids)
                } else if (batchConfirm === 'pin') {
                  batchPinMutation.mutate({ ids, pin: true })
                } else if (batchConfirm === 'unpin') {
                  batchPinMutation.mutate({ ids, pin: false })
                }
              }}
            >
              {batchPinMutation.isPending || batchDeleteMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  处理中…
                </>
              ) : (
                '确认'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
