// 九四班官网 - 关于我们编辑 Modal
// 受控 open
// 7 个字段编辑表单：className / slogan / intro / headTeacher / headTeacherQuote / classCommittee / contact
// Textarea 用于多行字段（intro, classCommittee, contact）
// 保存调 PUT /api/about，成功 toast + 触发父组件刷新

'use client'

import * as React from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { updateAbout } from '@/lib/api'
import type { AboutConfig } from '@/lib/types'

export interface AboutEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 初始值（来自 GET /api/about），打开时填充表单 */
  initial?: AboutConfig | null
  /** 保存成功后的回调（一般父组件 invalidateQueries） */
  onSaved?: () => void
}

// 表单类型：所有字段统一为 string（保存时再 null 化）
interface AboutForm {
  className: string
  slogan: string
  intro: string
  headTeacher: string
  headTeacherQuote: string
  classCommittee: string
  contact: string
}

const EMPTY_FORM: AboutForm = {
  className: '',
  slogan: '',
  intro: '',
  headTeacher: '',
  headTeacherQuote: '',
  classCommittee: '',
  contact: '',
}

export function AboutEditModal({
  open,
  onOpenChange,
  initial,
  onSaved,
}: AboutEditModalProps) {
  const [form, setForm] = React.useState<AboutForm>(EMPTY_FORM)
  const [saving, setSaving] = React.useState(false)

  // open 切换 / initial 变化时同步表单
  React.useEffect(() => {
    if (open) {
      setForm({
        className: initial?.className ?? '',
        slogan: initial?.slogan ?? '',
        intro: initial?.intro ?? '',
        headTeacher: initial?.headTeacher ?? '',
        headTeacherQuote: initial?.headTeacherQuote ?? '',
        classCommittee: initial?.classCommittee ?? '',
        contact: initial?.contact ?? '',
      })
    }
  }, [open, initial])

  function update<K extends keyof AboutForm>(
    key: K,
    value: AboutForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.className.trim()) {
      toast.error('班级名称不能为空')
      return
    }
    setSaving(true)
    try {
      await updateAbout({
        className: form.className,
        slogan: form.slogan,
        intro: form.intro || null,
        headTeacher: form.headTeacher || null,
        headTeacherQuote: form.headTeacherQuote || null,
        classCommittee: form.classCommittee || null,
        contact: form.contact || null,
      })
      toast.success('保存成功')
      onSaved?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑「关于我们」</DialogTitle>
          <DialogDescription>
            修改班级名称、班训、简介、班主任、班委与联系方式
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 班级名称 + 班训 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="about-className" className="text-sm font-medium">
                班级名称
              </Label>
              <Input
                id="about-className"
                value={form.className}
                onChange={(e) => update('className', e.target.value)}
                maxLength={64}
                disabled={saving}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="about-slogan" className="text-sm font-medium">
                班训
              </Label>
              <Input
                id="about-slogan"
                value={form.slogan}
                onChange={(e) => update('slogan', e.target.value)}
                placeholder="如：志存高远 · 脚踏实地 · 团结奋进"
                maxLength={128}
                disabled={saving}
                className="h-11"
              />
            </div>
          </div>

          {/* 班级简介 */}
          <div className="space-y-1.5">
            <Label htmlFor="about-intro" className="text-sm font-medium">
              班级简介
            </Label>
            <Textarea
              id="about-intro"
              value={form.intro}
              onChange={(e) => update('intro', e.target.value)}
              rows={4}
              disabled={saving}
              placeholder="简短介绍班级情况、特点…"
              className="resize-none"
            />
          </div>

          {/* 班主任 + 寄语 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="about-headTeacher" className="text-sm font-medium">
                班主任
              </Label>
              <Input
                id="about-headTeacher"
                value={form.headTeacher}
                onChange={(e) => update('headTeacher', e.target.value)}
                maxLength={32}
                disabled={saving}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="about-headTeacherQuote"
                className="text-sm font-medium"
              >
                班主任寄语
              </Label>
              <Input
                id="about-headTeacherQuote"
                value={form.headTeacherQuote}
                onChange={(e) => update('headTeacherQuote', e.target.value)}
                maxLength={256}
                disabled={saving}
                className="h-11"
              />
            </div>
          </div>

          {/* 班委名单 */}
          <div className="space-y-1.5">
            <Label
              htmlFor="about-committee"
              className="text-sm font-medium"
            >
              班委名单
            </Label>
            <Textarea
              id="about-committee"
              value={form.classCommittee}
              onChange={(e) => update('classCommittee', e.target.value)}
              rows={3}
              disabled={saving}
              placeholder="用逗号、空格或换行分隔，如：班长 张三, 学习委员 李四"
              className="resize-none"
            />
            <p className="text-[11px] text-muted-foreground">
              支持用 , ， ； 、 或换行分隔
            </p>
          </div>

          {/* 联系方式 */}
          <div className="space-y-1.5">
            <Label htmlFor="about-contact" className="text-sm font-medium">
              联系方式
            </Label>
            <Textarea
              id="about-contact"
              value={form.contact}
              onChange={(e) => update('contact', e.target.value)}
              rows={3}
              disabled={saving}
              placeholder="如：邮箱 guanwang94@example.com, 微信 gw94class"
              className="resize-none"
            />
            <p className="text-[11px] text-muted-foreground">
              支持用 , ， ； 、 或换行分隔
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="h-11"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-11 gap-2 bg-emerald-600 hover:bg-emerald-600/90"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  保存中…
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  保存
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
