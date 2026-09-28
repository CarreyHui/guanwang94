// 九四班官网 - 管理后台「发布/编辑事件」
// 编辑模式：useAdminPanel.editingEventId 存在时拉详情填充，按钮「更新」
// 创建：POST /api/events；更新：PUT /api/events/[id]
// 成功后 toast + 切到「管理事件」Tab + invalidate 事件列表

'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Save, X, ImageOff, Pin } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createEvent,
  updateEvent,
  getEvent,
  type EventInput,
} from '@/lib/api'
import type { EventCategory } from '@/lib/types'
import { useAdminPanel } from '@/store/use-admin-panel'
import { parseList } from '@/lib/format'
import { cn } from '@/lib/utils'

const CATEGORIES: EventCategory[] = [
  '班级活动',
  '学习通知',
  '重要公告',
  '校园新闻',
]

const PRIORITIES = [
  { value: 'normal', label: '普通' },
  { value: 'high', label: '重要' },
] as const

// 把 ISO 字符串转换为 datetime-local input 需要的 `YYYY-MM-DDTHH:mm` 格式（本地时区）
function toLocalDateTimeInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function PublishFormTab() {
  const editingId = useAdminPanel((s) => s.editingEventId)
  const clearEditing = useAdminPanel((s) => s.clearEditingEvent)
  const setActiveTab = useAdminPanel((s) => s.setActiveTab)
  const queryClient = useQueryClient()

  const isEdit = !!editingId

  // 编辑模式：拉详情
  const { data: existing, isLoading } = useQuery({
    queryKey: ['admin', 'event', editingId],
    queryFn: () => getEvent(editingId as string),
    enabled: !!editingId,
  })

  // 表单状态
  const [title, setTitle] = React.useState('')
  const [summary, setSummary] = React.useState('')
  const [content, setContent] = React.useState('')
  const [coverImage, setCoverImage] = React.useState('')
  const [category, setCategory] = React.useState<EventCategory>('班级活动')
  const [priority, setPriority] = React.useState<'normal' | 'high'>('normal')
  const [tags, setTags] = React.useState('')
  const [publishedAt, setPublishedAt] = React.useState('')
  const [pinned, setPinned] = React.useState(false)

  // 编辑模式：详情拉到后填充
  React.useEffect(() => {
    if (isEdit && existing) {
      setTitle(existing.title || '')
      setSummary(existing.summary || '')
      setContent(existing.content || '')
      setCoverImage(existing.coverImage || '')
      setCategory((existing.category as EventCategory) || '班级活动')
      setPriority(existing.priority === 'high' ? 'high' : 'normal')
      setTags(existing.tags || '')
      setPublishedAt(toLocalDateTimeInput(existing.publishedAt))
      setPinned(!!existing.pinned)
    }
  }, [isEdit, existing])

  // 创建模式下，第一次进入时给一个默认时间
  React.useEffect(() => {
    if (!isEdit && !publishedAt) {
      setPublishedAt(toLocalDateTimeInput(new Date().toISOString()))
    }
  }, [isEdit, publishedAt])

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: EventInput = {
        title: title.trim(),
        summary: summary.trim(),
        content,
        coverImage: coverImage.trim() || null,
        category,
        priority,
        tags,
        publishedAt: publishedAt
          ? new Date(publishedAt).toISOString()
          : new Date().toISOString(),
        pinned: pinned ? 1 : 0,
      }
      if (isEdit && editingId) {
        return updateEvent(editingId, payload)
      }
      return createEvent(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? '事件已更新' : '事件已发布')
      // 触发列表刷新
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'top-events'] })
      void queryClient.invalidateQueries({ queryKey: ['events-list'] })
      void queryClient.invalidateQueries({ queryKey: ['events-archive-all'] })
      void queryClient.invalidateQueries({ queryKey: ['events-pinned'] })
      // 退出编辑模式 → 切到管理事件
      clearEditing()
      setActiveTab('events')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : '保存失败'
      toast.error(msg)
    },
  })

  const tagList = React.useMemo(() => parseList(tags), [tags])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !summary.trim() || !content.trim()) {
      toast.error('标题 / 摘要 / 正文不能为空')
      return
    }
    mutation.mutate()
  }

  function handleReset() {
    setTitle('')
    setSummary('')
    setContent('')
    setCoverImage('')
    setCategory('班级活动')
    setPriority('normal')
    setTags('')
    setPublishedAt(toLocalDateTimeInput(new Date().toISOString()))
    setPinned(false)
    clearEditing()
    setActiveTab('events')
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        加载事件详情…
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">
            {isEdit ? '编辑事件' : '发布新事件'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? '修改后保存即更新到全站'
              : '填写完成后发布到九四班官网首页与归档'}
          </p>
        </div>
        {isEdit && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-9 gap-1.5"
          >
            <X className="size-4" />
            取消编辑
          </Button>
        )}
      </header>

      {/* 标题 */}
      <div className="space-y-1.5">
        <Label htmlFor="ev-title">
          标题 <span className="text-rose-600">*</span>
        </Label>
        <Input
          id="ev-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：期中考试安排"
          className="h-11"
          maxLength={120}
          required
        />
      </div>

      {/* 摘要 */}
      <div className="space-y-1.5">
        <Label htmlFor="ev-summary">
          摘要 <span className="text-rose-600">*</span>
        </Label>
        <Textarea
          id="ev-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="一句话总结，会显示在卡片上"
          rows={2}
          maxLength={300}
          required
        />
      </div>

      {/* 正文 */}
      <div className="space-y-1.5">
        <Label htmlFor="ev-content">
          正文（Markdown）<span className="text-rose-600">*</span>
        </Label>
        <Textarea
          id="ev-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={'支持 Markdown：\n## 二级标题\n- 列表项\n**加粗**\n[链接](https://...)'}
          rows={10}
          className="font-mono text-sm"
          required
        />
      </div>

      {/* 封面图 + 预览 */}
      <div className="space-y-1.5">
        <Label htmlFor="ev-cover">封面图 URL（选填）</Label>
        <Input
          id="ev-cover"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          placeholder="https://picsum.photos/seed/xxx/1200/600"
          className="h-11"
        />
        {coverImage.trim() && (
          <div className="relative aspect-[2/1] w-full max-w-md overflow-hidden rounded-md border border-emerald-600/15 bg-muted">
            <img
              src={coverImage.trim()}
              alt="封面预览"
              className="size-full object-cover"
              onError={(e) => {
                const img = e.currentTarget
                img.style.display = 'none'
                const fallback = img.nextElementSibling
                if (fallback) (fallback as HTMLElement).style.display = 'flex'
              }}
            />
            <div
              className="absolute inset-0 hidden flex-col items-center justify-center gap-1 text-sm text-muted-foreground"
              style={{ display: 'none' }}
            >
              <ImageOff className="size-6" />
              <span>图片加载失败</span>
            </div>
          </div>
        )}
      </div>

      {/* 分类 + 优先级 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>分类</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as EventCategory)}
          >
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>优先级</Label>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as 'normal' | 'high')}
          >
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="选择优先级" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 标签 */}
      <div className="space-y-1.5">
        <Label htmlFor="ev-tags">标签（逗号分隔）</Label>
        <Input
          id="ev-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="例如：期中, 通知, 考试"
          className="h-11"
        />
        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tagList.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 发布时间 + 置顶 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ev-published">发布时间</Label>
          <Input
            id="ev-published"
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="flex items-end gap-3 pb-1.5">
          <Switch
            id="ev-pinned"
            checked={pinned}
            onCheckedChange={setPinned}
          />
          <Label
            htmlFor="ev-pinned"
            className={cn(
              'flex h-11 items-center gap-1.5 text-sm',
              pinned && 'text-emerald-700 dark:text-emerald-300',
            )}
          >
            <Pin className="size-4" />
            置顶显示
          </Label>
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={mutation.isPending}
          className="h-11"
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="h-11 bg-emerald-600 hover:bg-emerald-600/90"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              保存中…
            </>
          ) : (
            <>
              <Save className="size-4" />
              {isEdit ? '更新' : '发布'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
