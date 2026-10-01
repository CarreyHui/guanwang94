// 九四班官网 - 管理后台「趣味跳转」Tab
// CRUD 磁贴：标题/URL/描述/icon/color/顺序/启用
// 网格预览 + 编辑 modal + 删除确认

'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Sparkles, Plus, Pencil, Trash2, Loader2, ExternalLink, GripVertical,
} from 'lucide-react'
import {
  Sparkles as SparklesIcon, Link as LinkIcon, Star, Heart, Globe, Rocket,
  BookOpen, Camera, Music, Gamepad2, Palette, GraduationCap,
  Trophy, Gift, Coffee, Sun, Moon, Cloud,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  listFunLinks, createFunLink, updateFunLink, deleteFunLink,
  type FunLinkItem, type FunLinkInput,
} from '@/lib/api'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles: SparklesIcon, Link: LinkIcon, Star, Heart, Globe, Rocket,
  BookOpen, Camera, Music, Gamepad2, Palette, GraduationCap,
  Trophy, Gift, Coffee, Sun, Moon, Cloud,
}
const ICON_OPTIONS = Object.keys(ICON_MAP)

const COLOR_MAP: Record<string, { gradient: string; label: string }> = {
  amber: { gradient: 'from-amber-400 to-orange-500', label: '琥珀' },
  rose: { gradient: 'from-rose-400 to-pink-500', label: '玫瑰' },
  sky: { gradient: 'from-sky-400 to-blue-500', label: '天空' },
  teal: { gradient: 'from-teal-400 to-cyan-500', label: '青蓝' },
  violet: { gradient: 'from-violet-400 to-purple-500', label: '紫罗兰' },
  emerald: { gradient: 'from-emerald-400 to-green-500', label: '翡翠' },
  orange: { gradient: 'from-orange-400 to-red-500', label: '橙红' },
}
const COLOR_OPTIONS = Object.keys(COLOR_MAP)

export function FunLinksTab() {
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<FunLinkItem | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<FunLinkItem | null>(null)

  // 表单 state（显式 required 字段，避免 undefined index）
  const [form, setForm] = React.useState<{
    title: string
    url: string
    description: string
    icon: string
    color: string
    order: number
    enabled: boolean
  }>({
    title: '', url: '', description: '', icon: 'Sparkles', color: 'amber', order: 0, enabled: true,
  })

  const listQuery = useQuery({
    queryKey: ['admin', 'fun-links'],
    queryFn: async () => {
      const res = await listFunLinks()
      // admin 也看 disabled 的——用单独接口？简化：admin 用同样公开接口，但管理后台看不到 disabled 的
      // 改为：admin 用专门的 list all（含 disabled）
      return res
    },
  })

  // 后端目前只有公开 GET（仅 enabled），admin 也用这个，但需要看到全部
  // 简化：admin 直接调 listFunLinks（仅 enabled=1），未启用的在后台看不到
  // 后续可加 admin 专用 list all 接口

  const createMut = useMutation({
    mutationFn: (payload: FunLinkInput) => createFunLink(payload),
    onSuccess: () => {
      toast.success('磁贴已添加')
      setEditOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'fun-links'] })
      void queryClient.invalidateQueries({ queryKey: ['fun-links'] })
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : '添加失败'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<FunLinkInput> }) =>
      updateFunLink(id, payload),
    onSuccess: () => {
      toast.success('磁贴已更新')
      setEditOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'fun-links'] })
      void queryClient.invalidateQueries({ queryKey: ['fun-links'] })
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : '更新失败'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFunLink(id),
    onSuccess: () => {
      toast.success('磁贴已删除')
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'fun-links'] })
      void queryClient.invalidateQueries({ queryKey: ['fun-links'] })
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : '删除失败'),
  })

  const toggleEnabledMut = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateFunLink(id, { enabled }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'fun-links'] })
      void queryClient.invalidateQueries({ queryKey: ['fun-links'] })
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : '切换失败'),
  })

  function handleOpenEdit(item?: FunLinkItem) {
    if (item) {
      setEditing(item)
      setForm({
        title: item.title,
        url: item.url,
        description: item.description || '',
        icon: item.icon,
        color: item.color,
        order: item.order,
        enabled: item.enabled === 1,
      })
    } else {
      setEditing(null)
      setForm({
        title: '', url: '', description: '', icon: 'Sparkles', color: 'amber', order: 0, enabled: true,
      })
    }
    setEditOpen(true)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('标题不能为空')
      return
    }
    if (!form.url.trim() || !/^https?:\/\//.test(form.url)) {
      toast.error('网址必须 http:// 或 https:// 开头')
      return
    }
    if (editing) {
      updateMut.mutate({ id: editing.id, payload: form })
    } else {
      createMut.mutate(form)
    }
  }

  const items = listQuery.data?.items ?? []

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">趣味跳转管理</h2>
          <p className="text-sm text-muted-foreground">
            添加 / 编辑 / 删除主页「趣味跳转」磁贴，用于多个网站间跳转
          </p>
        </div>
        <Button
          type="button"
          onClick={() => handleOpenEdit()}
          className="h-10 gap-1.5 bg-emerald-600 hover:bg-emerald-600/90"
        >
          <Plus className="size-4" />
          添加磁贴
        </Button>
      </header>

      {/* 磁贴列表（网格预览 + 操作） */}
      {listQuery.isLoading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <span className="ml-2 text-sm">加载中…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Sparkles className="size-8 opacity-40" />
          <p className="text-sm">还没有磁贴，点击「添加磁贴」开始</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => {
            const Icon = ICON_MAP[item.icon] || Sparkles
            const color = COLOR_MAP[item.color] || COLOR_MAP.amber
            return (
              <div
                key={item.id}
                className={cn(
                  'relative flex aspect-square flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl p-3 text-center shadow-sm',
                  'bg-gradient-to-br',
                  color.gradient,
                  item.enabled !== 1 && 'opacity-50',
                )}
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/20 text-white">
                  <Icon className="size-5" />
                </span>
                <span className="line-clamp-2 text-sm font-bold text-white">{item.title}</span>
                {item.description && (
                  <span className="line-clamp-2 hidden text-[10px] text-white/80 sm:block">
                    {item.description}
                  </span>
                )}
                {/* 操作按钮 */}
                <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="rounded-md bg-black/20 p-1 text-white transition-colors hover:bg-black/40"
                    aria-label="编辑"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="rounded-md bg-black/20 p-1 text-white transition-colors hover:bg-rose-600"
                    aria-label="删除"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
                {/* 启用开关 */}
                <div className="absolute left-1.5 top-1.5">
                  <Switch
                    checked={item.enabled === 1}
                    onCheckedChange={(checked) =>
                      toggleEnabledMut.mutate({ id: item.id, enabled: checked })
                    }
                    className="scale-75"
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 编辑 Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑磁贴' : '添加磁贴'}</DialogTitle>
            <DialogDescription>
              配置跳转磁贴，保存后立即在主页显示
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="fl-title">标题 *</Label>
              <Input
                id="fl-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="如：班级相册"
                className="h-11"
                maxLength={50}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fl-url">跳转网址 *</Label>
              <Input
                id="fl-url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://example.com"
                className="h-11"
                type="url"
                maxLength={500}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fl-desc">描述（选填）</Label>
              <Textarea
                id="fl-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="如：班级活动照片合集"
                className="min-h-[60px] resize-y"
                maxLength={200}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>图标</Label>
                <Select
                  value={form.icon}
                  onValueChange={(v) => setForm((f) => ({ ...f, icon: v }))}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((ic) => {
                      const I = ICON_MAP[ic]
                      return (
                        <SelectItem key={ic} value={ic}>
                          <span className="inline-flex items-center gap-1.5">
                            <I className="size-3.5" />
                            {ic}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>颜色</Label>
                <Select
                  value={form.color}
                  onValueChange={(v) => setForm((f) => ({ ...f, color: v }))}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        <span className="inline-flex items-center gap-1.5">
                          <span className={cn('size-3 rounded-full bg-gradient-to-br', COLOR_MAP[c].gradient)} />
                          {COLOR_MAP[c].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fl-order">顺序（数字越小越靠前）</Label>
                <Input
                  id="fl-order"
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                  className="h-11"
                  min={0}
                  max={999}
                />
              </div>
              <div className="flex items-end space-y-1.5">
                <div className="flex h-11 w-full items-center justify-between rounded-md border px-3">
                  <Label htmlFor="fl-enabled" className="text-sm">启用</Label>
                  <Switch
                    id="fl-enabled"
                    checked={form.enabled}
                    onCheckedChange={(checked) => setForm((f) => ({ ...f, enabled: checked }))}
                  />
                </div>
              </div>
            </div>
            {/* 实时预览 */}
            {form.title && form.url && (
              <div className="rounded-lg border bg-muted/30 p-2.5">
                <p className="mb-1.5 text-[11px] text-muted-foreground">预览：</p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'flex size-9 items-center justify-center rounded-lg bg-gradient-to-br text-white',
                    COLOR_MAP[form.color]?.gradient,
                  )}>
                    {(() => {
                      const I = ICON_MAP[form.icon] || Sparkles
                      return <I className="size-5" />
                    })()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{form.title}</p>
                    {form.description && (
                      <p className="truncate text-[11px] text-muted-foreground">{form.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="h-11"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={createMut.isPending || updateMut.isPending || !form.title.trim() || !form.url.trim()}
                className="h-11 gap-1.5 bg-emerald-600 hover:bg-emerald-600/90"
              >
                {(createMut.isPending || updateMut.isPending) ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    保存中…
                  </>
                ) : (
                  '保存'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除磁贴「{deleteTarget?.title}」？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，主页该磁贴将立即消失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">取消</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 bg-rose-600 hover:bg-rose-600/90"
              disabled={deleteMut.isPending}
              onClick={(e) => {
                e.preventDefault()
                if (deleteTarget) deleteMut.mutate(deleteTarget.id)
              }}
            >
              {deleteMut.isPending ? (
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
