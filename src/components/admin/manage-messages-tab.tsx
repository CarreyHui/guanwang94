// 九四班官网 - 管理后台「管理留言」
// 表格列表（根留言）+ 分页 + 回复（内联 textarea，调 PUT /api/messages 带 parentId）+ 删除（AlertDialog 确认）

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
  CornerDownRight,
  Send,
  Shield,
  X,
  Heart,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import { listMessages, deleteMessage, adminReplyMessage } from '@/lib/api'
import type { Message, MessageListResponse } from '@/lib/types'
import { formatDateTime, formatNumber } from '@/lib/format'

const PAGE_SIZE = 10

export function ManageMessagesTab() {
  const [page, setPage] = React.useState(1)
  const [replyTo, setReplyTo] = React.useState<string | null>(null)
  const [replyContent, setReplyContent] = React.useState('')
  const [delTarget, setDelTarget] = React.useState<Message | null>(null)

  const queryClient = useQueryClient()

  const list = useQuery<MessageListResponse>({
    queryKey: ['admin', 'messages', page, PAGE_SIZE],
    queryFn: () => listMessages({ page, pageSize: PAGE_SIZE, sort: 'latest' }),
    placeholderData: keepPreviousData,
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      adminReplyMessage(id, content),
    onSuccess: () => {
      toast.success('回复已发布')
      setReplyTo(null)
      setReplyContent('')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
      void queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : '回复失败'
      toast.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: () => {
      toast.success('留言已删除')
      setDelTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
      void queryClient.invalidateQueries({ queryKey: ['messages'] })
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

  function startReply(m: Message) {
    setReplyTo(m.id)
    setReplyContent('')
  }

  function cancelReply() {
    setReplyTo(null)
    setReplyContent('')
  }

  function submitReply(id: string) {
    const text = replyContent.trim()
    if (!text) {
      toast.error('回复内容不能为空')
      return
    }
    replyMutation.mutate({ id, content: text })
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-lg font-bold">管理留言</h2>
        <p className="text-sm text-muted-foreground">
          共 {formatNumber(total)} 条根留言，每页 {PAGE_SIZE} 条
        </p>
      </header>

      <div className="rounded-lg border border-emerald-600/15">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">昵称</TableHead>
              <TableHead className="min-w-[220px]">内容</TableHead>
              <TableHead className="hidden md:table-cell">联系</TableHead>
              <TableHead className="text-right">
                <Heart className="ms-auto size-3.5" />
              </TableHead>
              <TableHead className="hidden md:table-cell">回复</TableHead>
              <TableHead className="hidden lg:table-cell">时间</TableHead>
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
                    暂无留言
                  </div>
                </TableCell>
              </TableRow>
            )}
            {items.map((m) => (
              <React.Fragment key={m.id}>
                <TableRow>
                  <TableCell className="font-medium">{m.nickname}</TableCell>
                  <TableCell className="max-w-[320px]">
                    <div className="line-clamp-2 text-sm text-foreground/90">
                      {m.content}
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-[160px] truncate font-mono text-xs text-muted-foreground md:table-cell">
                    {m.contact || '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatNumber(m.likes)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {m.replies && m.replies.length > 0 ? (
                      <Badge
                        variant="secondary"
                        className="gap-1"
                      >
                        <Shield className="size-3 text-emerald-600" />
                        {m.replies.length} 条
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground lg:table-cell">
                    {formatDateTime(m.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 gap-1.5 text-emerald-700 hover:bg-emerald-600/10 dark:text-emerald-300"
                        onClick={() =>
                          replyTo === m.id ? cancelReply() : startReply(m)
                        }
                      >
                        <CornerDownRight className="size-4" />
                        {replyTo === m.id ? '收起' : '回复'}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-9 text-rose-600 hover:bg-rose-600/10 dark:text-rose-400"
                        onClick={() => setDelTarget(m)}
                        title="删除"
                        aria-label="删除"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {replyTo === m.id && (
                  <TableRow className="bg-emerald-600/5 hover:bg-emerald-600/5">
                    <TableCell colSpan={7}>
                      <div className="flex flex-col gap-2 pl-4 sm:flex-row sm:items-start">
                        <Textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={`以管理员身份回复 ${m.nickname}…`}
                          rows={2}
                          className="min-h-11 flex-1"
                          maxLength={1000}
                        />
                        <div className="flex gap-1.5 sm:flex-col">
                          <Button
                            size="sm"
                            className="h-11 gap-1.5 bg-emerald-600 hover:bg-emerald-600/90"
                            disabled={replyMutation.isPending}
                            onClick={() => submitReply(m.id)}
                          >
                            {replyMutation.isPending ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Send className="size-4" />
                            )}
                            发布回复
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-11"
                            onClick={cancelReply}
                          >
                            <X className="size-4" />
                            取消
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
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
            <AlertDialogTitle>确认删除该留言？</AlertDialogTitle>
            <AlertDialogDescription>
              将同时删除其下所有回复，删除后无法恢复。
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
