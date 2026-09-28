// 九四班官网 - 关于我们
// 调 /api/about 拿配置
// 显示：班级简介 + 班训 + 班主任 + 寄语 + 班委名单（parseList）+ 联系方式（parseList）
// 右上角「管理员编辑」按钮（isAdmin 可见）→ 弹出 AboutEditModal
// emerald 卡片布局

'use client'

import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Info,
  Pencil,
  GraduationCap,
  Quote,
  Users,
  Phone,
  Sparkles,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/use-app-store'
import { getAbout } from '@/lib/api'
import type { AboutConfig } from '@/lib/types'
import { parseList } from '@/lib/format'
import { cn } from '@/lib/utils'
import { AboutEditModal } from './about-edit-modal'

export function AboutSection() {
  const accessPassed = useAppStore((s) => s.accessPassed)
  const hydrateFromTokens = useAppStore((s) => s.hydrateFromTokens)
  const isAdmin = useAppStore((s) => s.isAdmin)
  const qc = useQueryClient()

  React.useEffect(() => {
    hydrateFromTokens()
  }, [hydrateFromTokens])

  const [editOpen, setEditOpen] = React.useState(false)

  const { data, isLoading, isError, refetch } = useQuery<AboutConfig>({
    queryKey: ['about'],
    queryFn: getAbout,
    enabled: accessPassed,
    staleTime: 60 * 1000,
  })

  const committee = parseList(data?.classCommittee)
  const contact = parseList(data?.contact)

  return (
    <section
      id="about"
      className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      {/* 标题 + 管理员编辑按钮 */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <Info className="size-3.5" />
            About · 关于我们
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            关于我们
          </h2>
        </div>
        {isAdmin && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setEditOpen(true)}
            className="h-10 gap-1.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-600/10 dark:text-emerald-300"
          >
            <Pencil className="size-4" />
            <span className="hidden sm:inline">管理员编辑</span>
          </Button>
        )}
      </div>

      {/* 内容 */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <span className="ml-2 text-sm">加载中…</span>
        </div>
      ) : isError || !data ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
          <p className="text-sm">
            {isError ? '加载失败' : '关于我们暂未配置'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9"
          >
            重试
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* 班级简介 */}
          <Card className="md:col-span-2 bg-gradient-to-br from-emerald-600/10 via-card to-teal-600/10">
            <div className="mb-2 flex items-center gap-2">
              <GraduationCap className="size-5 text-emerald-600" />
              <h3 className="text-base font-semibold">{data.className}</h3>
              <Badge>班训</Badge>
            </div>
            <p className="text-lg font-medium text-emerald-800 dark:text-emerald-200">
              「{data.slogan || '—'}」
            </p>
            {data.intro && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {data.intro}
              </p>
            )}
          </Card>

          {/* 班主任 */}
          <Card>
            <div className="mb-2 flex items-center gap-2">
              <Users className="size-5 text-emerald-600" />
              <h3 className="text-base font-semibold">班主任</h3>
            </div>
            <p className="text-lg font-semibold">
              {data.headTeacher || '—'}
            </p>
            {data.headTeacherQuote && (
              <div className="mt-3 flex gap-2 rounded-md bg-emerald-600/5 px-3 py-2">
                <Quote className="size-4 shrink-0 text-emerald-600" />
                <p className="text-sm italic leading-relaxed text-muted-foreground">
                  {data.headTeacherQuote}
                </p>
              </div>
            )}
          </Card>

          {/* 班委名单 */}
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Users className="size-5 text-emerald-600" />
              <h3 className="text-base font-semibold">班委名单</h3>
            </div>
            {committee.length > 0 ? (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {committee.map((item, i) => (
                  <li
                    key={`${item}-${i}`}
                    className="rounded-md bg-emerald-600/5 px-2.5 py-1.5 text-center text-sm font-medium"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">暂无班委信息</p>
            )}
          </Card>

          {/* 联系方式 */}
          <Card className="md:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <Phone className="size-5 text-emerald-600" />
              <h3 className="text-base font-semibold">联系我们</h3>
            </div>
            {contact.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {contact.map((item, i) => (
                  <span
                    key={`${item}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1 text-sm text-emerald-800 dark:text-emerald-200"
                  >
                    <Sparkles className="size-3" />
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">暂无联系方式</p>
            )}
          </Card>
        </div>
      )}

      {/* 编辑 Modal */}
      <AboutEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={data}
        onSaved={() => qc.invalidateQueries({ queryKey: ['about'] })}
      />
    </section>
  )
}

// ===== 内联 Card（更紧凑的关于我们卡片样式）=====
function Card({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 shadow-sm sm:p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

// Badge：小尺寸内联标签
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-600/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
      {children}
    </span>
  )
}
