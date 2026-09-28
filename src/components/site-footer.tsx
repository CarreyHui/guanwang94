// 九四班官网 - Footer
// emerald 背景 + 版权信息 + 简单链接（RSS / 关于我们 / 留言）
// 用 mt-auto sticky 到底部

'use client'

import * as React from 'react'
import { GraduationCap, Heart, Rss, Info, MessageSquare } from 'lucide-react'

import { cn } from '@/lib/utils'

const LINKS: { href: string; label: string; icon: React.ElementType }[] = [
  { href: '/rss.xml', label: 'RSS', icon: Rss },
  { href: '#about', label: '关于我们', icon: Info },
  { href: '#messages', label: '留言', icon: MessageSquare },
]

export function SiteFooter() {
  return (
    <footer
      className={cn(
        'mt-auto w-full border-t border-emerald-600/20',
        'bg-gradient-to-br from-emerald-700 to-teal-700 text-white',
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          {/* 左：Logo + 介绍 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
                <GraduationCap className="size-5" />
              </span>
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold">九四班官网</span>
                <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">
                  Guanwang94 · Class
                </span>
              </div>
            </div>
            <p className="max-w-md text-sm text-white/80">
              志存高远 · 脚踏实地 · 团结奋进。
              这里记录九四班的点滴瞬间，欢迎同学们留下属于我们共同的青春记忆。
            </p>
          </div>

          {/* 右：链接 */}
          <nav className="flex flex-wrap items-center gap-2">
            {LINKS.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Icon className="size-4" />
                  {link.label}
                </a>
              )
            })}
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-6 text-xs text-white/70 sm:flex-row">
          <p>
            © 2026 九四班官网 Guanwang94 · All Rights Reserved
          </p>
          <p className="inline-flex items-center gap-1">
            Made with <Heart className="size-3.5 fill-rose-300 text-rose-300" /> by 九四班
          </p>
        </div>
      </div>
    </footer>
  )
}
