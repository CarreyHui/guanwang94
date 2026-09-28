// 九四班官网 - 表白墙
// 5 种类型大按钮 + 表单（昵称选填 + 内容 300 字限制 + 字数计数 + 实时预览 chip）
// 列表卡片按 type 颜色区分；Heart 点赞 + heart-pop + localStorage 防重复
// 类型筛选 + 排序（最新/热门）；管理员可见删除按钮；用 @tanstack/react-query

'use client'

import * as React from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Trash2, Loader2, Send, MessageCircleHeart, SmilePlus } from 'lucide-react'
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
  listConfessions,
  createConfession,
  likeConfession,
  deleteConfession,
  toggleConfessionReaction,
  type ReactionEmoji,
} from '@/lib/api'
import type { Confession, ConfessionType, ConfessionColor } from '@/lib/types'
import { relativeTime, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { EmptyState, CardSkeleton } from '@/components/empty-state'
import { ConfessionTopBar } from './confession-top-bar'

const MAX_CONTENT = 300

// emoji 反应列表
const REACTION_EMOJIS: ReactionEmoji[] = ['👍', '❤️', '🎉', '🚀', '😢', '😮']

// ===== 类型配置 =====
interface TypeConfig {
  type: ConfessionType
  label: string
  emoji: string
  color: ConfessionColor
  // 大按钮样式
  btnActive: string
  btnIdle: string
  // 卡片样式
  cardBg: string
  cardBorder: string
  chipBg: string
  chipText: string
}

const TYPE_CONFIGS: TypeConfig[] = [
  {
    type: 'confession',
    label: '表白',
    emoji: '💗',
    color: 'rose',
    btnActive: 'bg-rose-600 text-white border-rose-600 shadow-sm',
    btnIdle: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
    cardBg: 'bg-rose-50/60 dark:bg-rose-900/10',
    cardBorder: 'border-rose-200 dark:border-rose-800/60',
    chipBg: 'bg-rose-100 dark:bg-rose-900/40',
    chipText: 'text-rose-700 dark:text-rose-300',
  },
  {
    type: 'thanks',
    label: '感谢',
    emoji: '🙏',
    color: 'amber',
    btnActive: 'bg-amber-600 text-white border-amber-600 shadow-sm',
    btnIdle: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
    cardBg: 'bg-amber-50/60 dark:bg-amber-900/10',
    cardBorder: 'border-amber-200 dark:border-amber-800/60',
    chipBg: 'bg-amber-100 dark:bg-amber-900/40',
    chipText: 'text-amber-700 dark:text-amber-300',
  },
  {
    type: 'bless',
    label: '祝福',
    emoji: '🌈',
    color: 'emerald',
    btnActive: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
    btnIdle: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
    cardBg: 'bg-emerald-50/60 dark:bg-emerald-900/10',
    cardBorder: 'border-emerald-200 dark:border-emerald-800/60',
    chipBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    chipText: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    type: 'complain',
    label: '吐槽',
    emoji: '😤',
    color: 'orange',
    btnActive: 'bg-orange-600 text-white border-orange-600 shadow-sm',
    btnIdle: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
    cardBg: 'bg-orange-50/60 dark:bg-orange-900/10',
    cardBorder: 'border-orange-200 dark:border-orange-800/60',
    chipBg: 'bg-orange-100 dark:bg-orange-900/40',
    chipText: 'text-orange-700 dark:text-orange-300',
  },
  {
    type: 'wish',
    label: '心愿',
    emoji: '⭐',
    color: 'sky',
    btnActive: 'bg-sky-600 text-white border-sky-600 shadow-sm',
    btnIdle: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800',
    cardBg: 'bg-sky-50/60 dark:bg-sky-900/10',
    cardBorder: 'border-sky-200 dark:border-sky-800/60',
    chipBg: 'bg-sky-100 dark:bg-sky-900/40',
    chipText: 'text-sky-700 dark:text-sky-300',
  },
]

function configOf(type: ConfessionType): TypeConfig {
  return TYPE_CONFIGS.find((t) => t.type === type) ?? TYPE_CONFIGS[0]
}

// localStorage 工具
const LIKED_KEY = (id: string) => `gw94_confession_liked_${id}`
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

// ===== 卡片 =====
function ConfessionCard({
  confession,
  isAdmin,
  onLike,
  onReact,
  onDelete,
}: {
  confession: Confession
  isAdmin: boolean
  onLike: (id: string) => void
  onReact: (id: string, emoji: ReactionEmoji) => void
  onDelete: (id: string) => void
}) {
  const cfg = configOf(confession.type)
  const [liked, setLiked] = React.useState(false)
  const [pop, setPop] = React.useState(false)
  const [showReactions, setShowReactions] = React.useState(false)
  const [localCounts, setLocalCounts] = React.useState<Record<string, number>>(
    confession.reactionCounts || {},
  )
  const [myReactions, setMyReactions] = React.useState<string[]>(
    confession.myReactions || [],
  )

  React.useEffect(() => {
    setLiked(isLiked(confession.id))
    setLocalCounts(confession.reactionCounts || {})
    setMyReactions(confession.myReactions || [])
  }, [confession.id, confession.reactionCounts, confession.myReactions])

  function handleLike() {
    if (liked) {
      toast.info('你已经点过赞啦')
      return
    }
    markLiked(confession.id)
    setLiked(true)
    setPop(true)
    setTimeout(() => setPop(false), 400)
    onLike(confession.id)
  }

  function handleReact(emoji: ReactionEmoji) {
    const has = myReactions.includes(emoji)
    // 乐观更新
    setLocalCounts((prev) => {
      const next = { ...prev }
      if (has) {
        next[emoji] = Math.max(0, (next[emoji] || 0) - 1)
        if (next[emoji] === 0) delete next[emoji]
      } else {
        next[emoji] = (next[emoji] || 0) + 1
      }
      return next
    })
    setMyReactions((prev) =>
      has ? prev.filter((e) => e !== emoji) : [...prev, emoji],
    )
    onReact(confession.id, emoji)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-xl border p-4 shadow-sm',
        cfg.cardBg,
        cfg.cardBorder,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
            cfg.chipBg,
            cfg.chipText,
          )}
        >
          <span>{cfg.emoji}</span>
          {cfg.label}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {relativeTime(confession.createdAt)}
        </span>
      </div>

      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
        {confession.content}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          —— {confession.nickname}
        </span>
        <div className="flex items-center gap-1.5">
          {isAdmin && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onDelete(confession.id)}
              className="h-8 gap-1 px-2 text-xs text-rose-600 hover:bg-rose-600/10 hover:text-rose-700 dark:text-rose-400"
            >
              <Trash2 className="size-3.5" />
              删除
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
            <span className="tabular-nums">{formatNumber(confession.likes)}</span>
          </button>
          {/* emoji 反应区 */}
          <div className="flex flex-wrap items-center gap-1">
            {REACTION_EMOJIS.map((emoji) => {
              const count = localCounts[emoji] || 0
              const mine = myReactions.includes(emoji)
              if (count === 0 && !mine) return null
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReact(emoji)}
                  aria-label={`反应 ${emoji}`}
                  aria-pressed={mine}
                  className={cn(
                    'inline-flex h-7 items-center gap-0.5 rounded-full border px-2 text-xs transition-all hover:scale-105',
                    mine
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'border-border bg-muted/60 text-muted-foreground hover:border-emerald-500/30 hover:bg-emerald-500/10',
                  )}
                >
                  <span className="text-sm leading-none">{emoji}</span>
                  {count > 0 && (
                    <span className="tabular-nums text-[11px]">{count}</span>
                  )}
                </button>
              )
            })}
            {/* 展开全部 emoji 选择 */}
            <button
              type="button"
              onClick={() => setShowReactions((v) => !v)}
              aria-label="更多反应"
              aria-expanded={showReactions}
              className={cn(
                'inline-flex h-7 items-center gap-0.5 rounded-full border border-dashed border-border px-2 text-xs transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5',
                showReactions && 'border-emerald-500/40 bg-emerald-500/5',
              )}
            >
              <SmilePlus className="size-3.5" />
            </button>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5 shadow-sm"
              >
                {REACTION_EMOJIS.map((emoji) => {
                  const mine = myReactions.includes(emoji)
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        handleReact(emoji)
                        setShowReactions(false)
                      }}
                      aria-label={`添加反应 ${emoji}`}
                      className={cn(
                        'inline-flex size-7 items-center justify-center rounded-full text-sm transition-all hover:scale-125 hover:bg-muted',
                        mine && 'bg-emerald-500/15',
                      )}
                    >
                      {emoji}
                    </button>
                  )
                })}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ===== Section 主组件 =====
export function ConfessionSection() {
  const accessPassed = useAppStore((s) => s.accessPassed)
  const hydrateFromTokens = useAppStore((s) => s.hydrateFromTokens)
  const isAdmin = useAppStore((s) => s.isAdmin)
  const qc = useQueryClient()

  React.useEffect(() => {
    hydrateFromTokens()
  }, [hydrateFromTokens])

  const [selectedType, setSelectedType] = React.useState<ConfessionType>('confession')
  const [nickname, setNickname] = React.useState('')
  const [content, setContent] = React.useState('')

  // 列表筛选/排序
  const [filterType, setFilterType] = React.useState<'all' | ConfessionType>('all')
  const [sort, setSort] = React.useState<'latest' | 'hot'>('latest')

  // 列表 query（无限滚动）
  const listQuery = useInfiniteQuery({
    queryKey: ['confessions', filterType, sort],
    queryFn: ({ pageParam = 1 }) =>
      listConfessions({
        type: filterType === 'all' ? '' : filterType,
        sort,
        page: pageParam,
        pageSize: 10,
      }),
    enabled: accessPassed,
    initialPageParam: 1,
    getNextPageParam: (last) => {
      // 还有下一页的条件：当前已加载的总数 < 总数
      const loaded = last.page * last.pageSize
      return loaded < last.total ? last.page + 1 : undefined
    },
  })

  // 自动加载更多（IntersectionObserver）
  const loadMoreRef = React.useRef<HTMLButtonElement>(null)
  const hasMore = listQuery.hasNextPage && !listQuery.isFetchingNextPage
  React.useEffect(() => {
    if (!hasMore) return
    const el = loadMoreRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          listQuery.fetchNextPage()
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, listQuery])

  const allItems = React.useMemo(() => {
    return listQuery.data?.pages.flatMap((p) => p.items) ?? []
  }, [listQuery.data])

  // 发布 mutation
  const createMut = useMutation({
    mutationFn: () =>
      createConfession({
        type: selectedType,
        nickname: nickname.trim() || undefined,
        content: content.trim(),
      }),
    onSuccess: () => {
      toast.success('发布成功')
      setContent('')
      setNickname('')
      qc.invalidateQueries({ queryKey: ['confessions'] })
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : '发布失败')
    },
  })

  // 点赞 mutation（乐观更新）
  const likeMut = useMutation({
    mutationFn: (id: string) => likeConfession(id),
    onMutate: async (id) => {
      // 乐观 +1
      const prev = qc.getQueryData<{ items: Confession[]; total: number }>([
        'confessions',
        filterType,
        sort,
      ])
      if (prev) {
        const next = {
          ...prev,
          items: prev.items.map((c) =>
            c.id === id ? { ...c, likes: c.likes + 1 } : c,
          ),
        }
        qc.setQueryData(['confessions', filterType, sort], next)
      }
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(['confessions', filterType, sort], ctx.prev)
      }
      toast.error('点赞失败')
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['confessions'] })
    },
  })

  // emoji 反应 mutation
  const reactMut = useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: ReactionEmoji }) =>
      toggleConfessionReaction(id, emoji),
    onSuccess: (data, { id }) => {
      // 用后端返回的最新 counts/myReactions 同步到 cache
      const prev = qc.getQueryData<{ items: Confession[]; total: number }>([
        'confessions',
        filterType,
        sort,
      ])
      if (prev) {
        const next = {
          ...prev,
          items: prev.items.map((c) =>
            c.id === id
              ? {
                  ...c,
                  reactionCounts: data.counts,
                  myReactions: data.myReactions,
                }
              : c,
          ),
        }
        qc.setQueryData(['confessions', filterType, sort], next)
      }
    },
    onError: () => {
      toast.error('反应失败')
      qc.invalidateQueries({ queryKey: ['confessions'] })
    },
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteConfession(id),
    onSuccess: () => {
      toast.success('已删除')
      qc.invalidateQueries({ queryKey: ['confessions'] })
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : '删除失败')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) {
      toast.error('内容不能为空')
      return
    }
    createMut.mutate()
  }

  const previewContent = content.trim().slice(0, 20)
  const previewCfg = configOf(selectedType)

  return (
    <section
      id="confessions"
      className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      {/* 标题 */}
      <div className="mb-6">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-rose-600/10 px-3 py-1 text-xs font-medium text-rose-700 dark:text-rose-300">
          <MessageCircleHeart className="size-3.5" />
          Confessions · 表白墙
        </div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          表白墙
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          表白 · 感谢 · 祝福 · 吐槽 · 心愿
        </p>
      </div>

      {/* 热榜（近 7 天 Top 5） */}
      <ConfessionTopBar />

      {/* 表单区 */}
      <div className="mb-6 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        {/* 5 种类型大按钮 */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {TYPE_CONFIGS.map((cfg) => {
            const active = selectedType === cfg.type
            return (
              <button
                key={cfg.type}
                type="button"
                onClick={() => setSelectedType(cfg.type)}
                className={cn(
                  'flex h-11 items-center justify-center gap-1.5 rounded-lg border-2 text-sm font-medium transition-all',
                  active ? cfg.btnActive : cfg.btnIdle,
                )}
              >
                <span className="text-base">{cfg.emoji}</span>
                {cfg.label}
              </button>
            )
          })}
        </div>

        {/* 昵称 + 内容 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="text"
            placeholder="昵称（选填，不填匿名）"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 32))}
            maxLength={32}
            className="h-11"
            aria-label="昵称"
          />
          <div className="relative">
            <Textarea
              placeholder="写下你想说的…（最多 300 字）"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
              maxLength={MAX_CONTENT}
              rows={3}
              className="resize-none pr-16"
              aria-label="内容"
            />
            <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground tabular-nums">
              {content.length} / {MAX_CONTENT}
            </span>
          </div>

          {/* 实时预览 chip */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>预览：</span>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                previewCfg.chipBg,
                previewCfg.chipText,
              )}
            >
              <span>{previewCfg.emoji}</span>
              {previewCfg.label}
            </span>
            <span className="line-clamp-1 max-w-[220px]">
              {previewContent || '（请输入内容）'}
            </span>
          </div>

          {/* 发布按钮 */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createMut.isPending || !content.trim()}
              className="h-11 min-w-[120px] gap-2 bg-emerald-600 hover:bg-emerald-600/90"
            >
              {createMut.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  发布中…
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  发布
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* 工具栏：筛选 + 排序 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={cn(
            'h-9 rounded-full px-3 text-sm font-medium transition-colors',
            filterType === 'all'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-emerald-600/10 hover:text-emerald-700 dark:hover:text-emerald-300',
          )}
        >
          全部
        </button>
        {TYPE_CONFIGS.map((cfg) => (
          <button
            key={cfg.type}
            type="button"
            onClick={() => setFilterType(cfg.type)}
            className={cn(
              'h-9 rounded-full px-3 text-sm font-medium transition-colors',
              filterType === cfg.type
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-emerald-600/10 hover:text-emerald-700 dark:hover:text-emerald-300',
            )}
          >
            <span className="mr-1">{cfg.emoji}</span>
            {cfg.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as 'latest' | 'hot')}>
            <SelectTrigger size="sm" className="h-9 w-[110px]" aria-label="排序">
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
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : listQuery.isError ? (
        <EmptyState
          icon="search"
          title="加载失败"
          description="网络或服务出了点小问题，请稍后重试"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => listQuery.refetch()}
              className="h-9 gap-1.5"
            >
              <Loader2 className="size-4" /> 重试
            </Button>
          }
        />
      ) : (listQuery.data?.pages[0]?.items.length ?? 0) === 0 ? (
        <EmptyState
          icon="heart"
          title="还没有表白，快来第一个发布吧"
          description="说出心里话，让同学们感受到你的心意"
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {allItems.map((c) => (
                <ConfessionCard
                  key={c.id}
                  confession={c}
                  isAdmin={isAdmin}
                  onLike={(id) => likeMut.mutate(id)}
                  onReact={(id, emoji) => reactMut.mutate({ id, emoji })}
                  onDelete={(id) => deleteMut.mutate(id)}
                />
              ))}
            </AnimatePresence>
          </div>
          {/* 加载更多 / 无限滚动 */}
          {hasMore ? (
            <div className="mt-6 flex justify-center">
              <Button
                ref={loadMoreRef}
                variant="outline"
                size="sm"
                onClick={() => listQuery.fetchNextPage()}
                disabled={listQuery.isFetchingNextPage}
                className="h-10 gap-2"
              >
                {listQuery.isFetchingNextPage ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> 加载中…
                  </>
                ) : (
                  <>加载更多</>
                )}
              </Button>
            </div>
          ) : allItems.length > 10 ? (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              — 已经到底啦，共 {allItems.length} 条 —
            </p>
          ) : null}
        </>
      )}
    </section>
  )
}
