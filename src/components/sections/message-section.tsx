// 九四班官网 - 留言给管理员（反馈通道）
// 表单：昵称（必填）+ 联系方式（选填）+ 内容（500 字 + 字数计数）+ 提交
// 搜索框 + 排序（最新 / 热门）
// 列表卡片：留言 + 嵌套回复（emerald 背景 + Shield 图标，标记「管理员回复」）
// 管理员可见「回复」按钮（内联编辑）+ 删除按钮
// Heart 点赞 + localStorage `gw94_message_liked_<id>` 防重复
// 用 @tanstack/react-query

'use client'

import * as React from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Trash2,
  Reply,
  Loader2,
  Send,
  Mail,
  Shield,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/store/use-app-store'
import {
  listMessages,
  createMessage,
  adminReplyMessage,
  deleteMessage,
  likeMessage,
} from '@/lib/api'
import type { Message } from '@/lib/types'
import { relativeTime, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

const MAX_CONTENT = 500

const LIKED_KEY = (id: string) => `gw94_message_liked_${id}`
function isLiked(id: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(LIKED_KEY(id)) === '1'
  } catch {
    return false
  }
}
function markLiked(id: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LIKED_KEY(id), '1')
  } catch {
    // ignore
  }
}

// ===== 回复卡片 =====
function ReplyCard({ reply }: { reply: Message }) {
  const isAdmin = reply.replyRole === 'admin'
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2.5',
        isAdmin
          ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/60 dark:bg-emerald-900/15'
          : 'border-border bg-muted/40',
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        {isAdmin ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-medium text-white">
            <Shield className="size-3" />
            管理员回复
          </span>
        ) : null}
        <span className="text-xs font-medium text-foreground">
          {reply.nickname}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {relativeTime(reply.createdAt)}
        </span>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
        {reply.content}
      </p>
    </div>
  )
}

// ===== 留言卡片 =====
function MessageCard({
  message,
  isAdmin,
  onLike,
  onDelete,
  onReply,
}: {
  message: Message
  isAdmin: boolean
  onLike: (id: string) => void
  onDelete: (id: string) => void
  onReply: (parentId: string, content: string) => void
}) {
  const [liked, setLiked] = React.useState(false)
  const [pop, setPop] = React.useState(false)
  const [replyOpen, setReplyOpen] = React.useState(false)
  const [replyText, setReplyText] = React.useState('')

  React.useEffect(() => {
    setLiked(isLiked(message.id))
  }, [message.id])

  function handleLike() {
    if (liked) {
      toast.info('你已经点过赞啦')
      return
    }
    markLiked(message.id)
    setLiked(true)
    setPop(true)
    setTimeout(() => setPop(false), 400)
    onLike(message.id)
  }

  function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = replyText.trim()
    if (!t) {
      toast.error('回复内容不能为空')
      return
    }
    onReply(message.id, t)
    setReplyText('')
    setReplyOpen(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border bg-card p-4 shadow-sm sm:p-5"
    >
      {/* 头部 */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{message.nickname}</span>
          <span className="text-[11px] text-muted-foreground">
            {relativeTime(message.createdAt)}
          </span>
        </div>
        {isAdmin && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onDelete(message.id)}
            className="h-8 gap-1 px-2 text-xs text-rose-600 hover:bg-rose-600/10 hover:text-rose-700 dark:text-rose-400"
          >
            <Trash2 className="size-3.5" />
            删除
          </Button>
        )}
      </div>

      {/* 内容 */}
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
        {message.content}
      </p>

      {/* 联系方式（管理员可见） */}
      {isAdmin && message.contact && (
        <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-300">
          <Mail className="size-3" />
          联系方式：{message.contact}
        </p>
      )}

      {/* 嵌套回复 */}
      {message.replies && message.replies.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 border-emerald-500/30 pl-3">
          {message.replies.map((r) => (
            <ReplyCard key={r.id} reply={r} />
          ))}
        </div>
      )}

      {/* 管理员内联回复编辑器 */}
      {isAdmin && replyOpen && (
        <form
          onSubmit={handleReplySubmit}
          className="mt-3 flex flex-col gap-2 border-t pt-3"
        >
          <Textarea
            placeholder="以管理员身份回复…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value.slice(0, 1000))}
            rows={3}
            className="resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setReplyOpen(false)
                setReplyText('')
              }}
              className="h-9"
            >
              取消
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!replyText.trim()}
              className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-600/90"
            >
              <Send className="size-3.5" />
              发送回复
            </Button>
          </div>
        </form>
      )}

      {/* 底部操作区 */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2">
        <span className="text-[11px] text-muted-foreground">
          {message.replies && message.replies.length > 0
            ? `${message.replies.length} 条回复`
            : ''}
        </span>
        <div className="flex items-center gap-1.5">
          {isAdmin && !replyOpen && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setReplyOpen(true)}
              className="h-8 gap-1 px-2 text-xs text-emerald-700 hover:bg-emerald-600/10 dark:text-emerald-300"
            >
              <Reply className="size-3.5" />
              回复
            </Button>
          )}
          {isAdmin && replyOpen && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setReplyOpen(false)}
              className="h-8 gap-1 px-2 text-xs"
            >
              <X className="size-3.5" />
              收起
            </Button>
          )}
          <button
            type="button"
            onClick={handleLike}
            aria-label="点赞"
            aria-pressed={liked}
            className={cn(
              'inline-flex h-8 min-w-[44px] items-center gap-1 rounded-full px-2.5 text-xs font-medium transition-colors',
              liked
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300'
                : 'bg-muted text-muted-foreground hover:bg-rose-600/10 hover:text-rose-600',
            )}
          >
            <Heart
              className={cn(
                'size-3.5',
                liked && 'fill-rose-500 text-rose-500',
                pop && 'heart-pop',
              )}
            />
            <span className="tabular-nums">{formatNumber(message.likes)}</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ===== Section 主组件 =====
export function MessageSection() {
  const accessPassed = useAppStore((s) => s.accessPassed)
  const hydrateFromTokens = useAppStore((s) => s.hydrateFromTokens)
  const isAdmin = useAppStore((s) => s.isAdmin)
  const qc = useQueryClient()

  React.useEffect(() => {
    hydrateFromTokens()
  }, [hydrateFromTokens])

  const [nickname, setNickname] = React.useState('')
  const [contact, setContact] = React.useState('')
  const [content, setContent] = React.useState('')

  const [searchInput, setSearchInput] = React.useState('')
  const [search, setSearch] = React.useState('')
  const [sort, setSort] = React.useState<'latest' | 'hot'>('latest')

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // 列表 query
  const listQuery = useQuery({
    queryKey: ['messages', search, sort],
    queryFn: () =>
      listMessages({
        q: search,
        sort,
        pageSize: 50,
      }),
    enabled: accessPassed,
    placeholderData: keepPreviousData,
  })

  // 创建留言
  const createMut = useMutation({
    mutationFn: () =>
      createMessage({
        nickname: nickname.trim(),
        content: content.trim(),
        contact: contact.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('留言已提交')
      setContent('')
      setContact('')
      // 昵称保留，方便连续留言
      qc.invalidateQueries({ queryKey: ['messages'] })
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : '提交失败')
    },
  })

  // 点赞（乐观）
  const likeMut = useMutation({
    mutationFn: (id: string) => likeMessage(id),
    onMutate: async (id) => {
      const prev = qc.getQueryData<{ items: Message[]; total: number }>([
        'messages',
        search,
        sort,
      ])
      if (prev) {
        const next = {
          ...prev,
          items: prev.items.map((m) =>
            m.id === id ? { ...m, likes: m.likes + 1 } : m,
          ),
        }
        qc.setQueryData(['messages', search, sort], next)
      }
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(['messages', search, sort], ctx.prev)
      }
      toast.error('点赞失败')
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['messages'] })
    },
  })

  // 管理员回复
  const replyMut = useMutation({
    mutationFn: ({ parentId, content }: { parentId: string; content: string }) =>
      adminReplyMessage(parentId, content),
    onSuccess: () => {
      toast.success('回复成功')
      qc.invalidateQueries({ queryKey: ['messages'] })
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : '回复失败')
    },
  })

  // 删除
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: () => {
      toast.success('已删除')
      qc.invalidateQueries({ queryKey: ['messages'] })
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : '删除失败')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) {
      toast.error('请填写昵称')
      return
    }
    if (!content.trim()) {
      toast.error('内容不能为空')
      return
    }
    createMut.mutate()
  }

  return (
    <section
      id="messages"
      className="mx-auto w-full max-w-4xl scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      {/* 标题 */}
      <div className="mb-6">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <Mail className="size-3.5" />
          Messages · 留言给管理员
        </div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          留言给管理员
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          反馈通道 · 管理员会查看并回复
        </p>
      </div>

      {/* 表单 */}
      <div className="mb-6 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Input
                type="text"
                placeholder="昵称（必填）"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 32))}
                maxLength={32}
                className="h-11"
                aria-label="昵称"
              />
            </div>
            <div>
              <Input
                type="text"
                placeholder="联系方式（选填，仅管理员可见）"
                value={contact}
                onChange={(e) => setContact(e.target.value.slice(0, 100))}
                maxLength={100}
                className="h-11"
                aria-label="联系方式"
              />
            </div>
          </div>

          <div className="relative">
            <Textarea
              placeholder="写下你的留言…（最多 500 字）"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
              maxLength={MAX_CONTENT}
              rows={4}
              className="resize-none pr-16"
              aria-label="内容"
            />
            <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground tabular-nums">
              {content.length} / {MAX_CONTENT}
            </span>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createMut.isPending || !nickname.trim() || !content.trim()}
              className="h-11 min-w-[120px] gap-2 bg-emerald-600 hover:bg-emerald-600/90"
            >
              {createMut.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  提交中…
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  提交
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* 工具栏：搜索 + 排序 */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Input
            type="text"
            placeholder="搜索留言内容…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-11 pl-9"
            aria-label="搜索留言"
          />
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as 'latest' | 'hot')}>
            <SelectTrigger size="sm" className="h-11 w-[120px]" aria-label="排序">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">最新</SelectItem>
              <SelectItem value="hot">热门</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 列表 */}
      {listQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <span className="ml-2 text-sm">加载中…</span>
        </div>
      ) : listQuery.isError ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
          <p className="text-sm">加载失败</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => listQuery.refetch()}
            className="h-9"
          >
            重试
          </Button>
        </div>
      ) : (listQuery.data?.items ?? []).length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
          <p className="text-sm">
            {search ? '没有符合条件的结果' : '还没有留言，快来第一个留言吧'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {(listQuery.data?.items ?? []).map((m) => (
              <MessageCard
                key={m.id}
                message={m}
                isAdmin={isAdmin}
                onLike={(id) => likeMut.mutate(id)}
                onDelete={(id) => deleteMut.mutate(id)}
                onReply={(parentId, content) => replyMut.mutate({ parentId, content })}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  )
}
