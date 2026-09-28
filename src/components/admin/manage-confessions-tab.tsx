// 九四班官网 - 管理后台「管理表白墙」
// 表格列表（类型 Badge + 昵称 + 内容截断 + 点赞 + 时间 + 删除）+ 分页
// 删除：AlertDialog 确认 → DELETE /api/confessions/delete?id=xxx

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
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Heart,
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
import { listConfessions, deleteConfession } from '@/lib/api'
import type {
  Confession,
  ConfessionListResponse,
  ConfessionType,
} from '@/lib/types'
import { formatDateTime, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

interface TypeMeta {
  label: string
  emoji: string
  badge: string
}

const TYPE_META: Record<ConfessionType, TypeMeta> = {
  confession: {
    label: '表白',
    emoji: '💗',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  },
  thanks: {
    label: '感谢',
    emoji: '🙏',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  },
  bless: {
    label: '祝福',
    emoji: '🌈',
    badge:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  },
  complain: {
    label: '吐槽',
    emoji: '😤',
    badge:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  },
  wish: {
    label: '心愿',
    emoji: '⭐',
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  },
}

export function ManageConfessionsTab() {
  const [page, setPage] = React.useState(1)
  const [delTarget, setDelTarget] = React.useState<Confession | null>(null)

  const queryClient = useQueryClient()

  const list = useQuery<ConfessionListResponse>({
    queryKey: ['admin', 'confessions', page, PAGE_SIZE],
    queryFn: () => listConfessions({ page, pageSize: PAGE_SIZE, sort: 'latest' }),
    placeholderData: keepPreviousData,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteConfession(id),
    onSuccess: () => {
      toast.success('表白已删除')
      setDelTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'confessions'] })
      void queryClient.invalidateQueries({ queryKey: ['confessions'] })
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : '删除失败'
      toast.error(msg)
    },
  })

  const items = list.data?.items ?? []
  const total = list.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-lg font-bold">管理表白墙</h2>
        <p className="text-sm text-muted-foreground">
          共 {formatNumber(total)} 条表白，每页 {PAGE_SIZE} 条
        </p>
      </header>

      <div className="rounded-lg border border-emerald-600/15">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>类型</TableHead>
              <TableHead className="min-w-[100px]">昵称</TableHead>
              <TableHead className="min-w-[220px]">内容</TableHead>
              <TableHead className="text-right">
                <Heart className="ms-auto size-3.5" />
              </TableHead>
              <TableHead className="hidden md:table-cell">时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex h-20 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    加载中…
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!list.isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                    暂无表白
                  </div>
                </TableCell>
              </TableRow>
            )}
            {items.map((c) => {
              const meta = TYPE_META[c.type]
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('border-transparent gap-1', meta.badge)}
                    >
                      <span>{meta.emoji}</span>
                      {meta.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{c.nickname}</TableCell>
                  <TableCell className="max-w-[320px]">
                    <div className="line-clamp-2 text-sm text-foreground/90">
                      {c.content}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatNumber(c.likes)}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground md:table-cell">
                    {formatDateTime(c.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-9 text-rose-600 hover:bg-rose-600/10 dark:text-rose-400"
                      onClick={() => setDelTarget(c)}
                      title="删除"
                      aria-label="删除"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

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

      <AlertDialog
        open={!!delTarget}
        onOpenChange={(o) => { if (!o) setDelTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该表白？</AlertDialogTitle>
            <AlertDialogDescription>
              来自「{delTarget?.nickname}」的{TYPE_META[delTarget?.type ?? 'confession']?.label ?? ''}
              将永久删除，无法恢复。
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
