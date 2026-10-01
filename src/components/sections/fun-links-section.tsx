// 九四班官网 - 趣味跳转磁贴 Section
// 独立 section，磁贴网格风格，支持多个跳转链接
// 数据调 /api/fun-links，管理员可在后台 CRUD
// 点击磁贴在新标签页打开

'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Sparkles, Link as LinkIcon, Star, Heart, Globe, Rocket,
  BookOpen, Camera, Music, Gamepad2, Palette, GraduationCap,
  Trophy, Gift, Coffee, Sun, Moon, Cloud, ExternalLink,
  type LucideIcon,
} from 'lucide-react'
import { listFunLinks, type FunLinkItem } from '@/lib/api'
import { useAppStore } from '@/store/use-app-store'
import { cn } from '@/lib/utils'

// icon name → lucide component 映射
const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles, Link: LinkIcon, Star, Heart, Globe, Rocket,
  BookOpen, Camera, Music, Gamepad2, Palette, GraduationCap,
  Trophy, Gift, Coffee, Sun, Moon, Cloud,
}

// color → tailwind gradient class 映射
const COLOR_MAP: Record<string, { gradient: string; ring: string; text: string }> = {
  amber: {
    gradient: 'from-amber-400 to-orange-500',
    ring: 'hover:ring-amber-400/50',
    text: 'text-amber-50',
  },
  rose: {
    gradient: 'from-rose-400 to-pink-500',
    ring: 'hover:ring-rose-400/50',
    text: 'text-rose-50',
  },
  sky: {
    gradient: 'from-sky-400 to-blue-500',
    ring: 'hover:ring-sky-400/50',
    text: 'text-sky-50',
  },
  teal: {
    gradient: 'from-teal-400 to-cyan-500',
    ring: 'hover:ring-teal-400/50',
    text: 'text-teal-50',
  },
  violet: {
    gradient: 'from-violet-400 to-purple-500',
    ring: 'hover:ring-violet-400/50',
    text: 'text-violet-50',
  },
  emerald: {
    gradient: 'from-emerald-400 to-green-500',
    ring: 'hover:ring-emerald-400/50',
    text: 'text-emerald-50',
  },
  orange: {
    gradient: 'from-orange-400 to-red-500',
    ring: 'hover:ring-orange-400/50',
    text: 'text-orange-50',
  },
}

export function FunLinksSection() {
  const accessPassed = useAppStore((s) => s.accessPassed)

  const listQuery = useQuery({
    queryKey: ['fun-links'],
    queryFn: listFunLinks,
    enabled: accessPassed,
    staleTime: 60 * 1000,
  })

  const items = listQuery.data?.items ?? []
  if (!accessPassed || items.length === 0) return null

  return (
    <section
      id="fun-links"
      className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14"
    >
      {/* 标题 */}
      <div className="mb-5 sm:mb-6">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
          <Sparkles className="size-3.5" />
          Fun Links · 趣味跳转
        </div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
          更多精彩
        </h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          点击磁贴访问更多班级相关站点
        </p>
      </div>

      {/* 磁贴网格：手机 2 列，平板 3 列，桌面 4 列 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {items.map((item, i) => (
          <FunLinkTile key={item.id} item={item} index={i} />
        ))}
      </div>
    </section>
  )
}

function FunLinkTile({ item, index }: { item: FunLinkItem; index: number }) {
  const Icon = ICON_MAP[item.icon] || Sparkles
  const color = COLOR_MAP[item.color] || COLOR_MAP.amber

  function handleClick() {
    // 安全校验：仅允许 http/https
    if (!/^https?:\/\//.test(item.url)) return
    window.open(item.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.06, 0.4) }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl p-3 text-center shadow-md transition-shadow sm:rounded-2xl sm:p-4',
        'bg-gradient-to-br ring-2 ring-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
        color.gradient,
        color.ring,
      )}
      aria-label={`${item.title} - 在新标签页打开`}
    >
      {/* 背景装饰光晕 */}
      <div className="pointer-events-none absolute -right-4 -top-4 size-20 rounded-full bg-white/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 size-24 rounded-full bg-black/10 blur-2xl" />

      {/* hover 时右上角 ExternalLink */}
      <span className="absolute right-2 top-2 opacity-0 transition-opacity duration-300 group-hover:opacity-90">
        <ExternalLink className={cn('size-3.5', color.text)} />
      </span>

      {/* 图标 */}
      <span className={cn('relative z-10 flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm sm:size-12', color.text)}>
        <Icon className="size-5 sm:size-6" />
      </span>

      {/* 标题 */}
      <span className={cn('relative z-10 line-clamp-2 text-sm font-bold leading-tight sm:text-base', color.text)}>
        {item.title}
      </span>

      {/* 描述（仅 sm+ 显示） */}
      {item.description && (
        <span className={cn('relative z-10 line-clamp-2 hidden text-[11px] opacity-80 sm:block', color.text)}>
          {item.description}
        </span>
      )}
    </motion.button>
  )
}
