// 九四班官网 - 主题切换 DropdownMenu（浅色/深色/跟随系统）
// 用 next-themes 的 useTheme；图标 Sun / Moon / Monitor

'use client'

import * as React from 'react'
import { Moon, Sun, Monitor, Check } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store/use-app-store'
import type { Theme } from '@/lib/types'
import { cn } from '@/lib/utils'

const OPTIONS: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
]

export function ThemeToggle() {
  const { theme, setTheme: setNextTheme } = useTheme()
  const setAppTheme = useAppStore((s) => s.setTheme)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  function handleChange(v: Theme) {
    setNextTheme(v)
    setAppTheme(v)
  }

  // 防止 SSR/CSR 不一致：未 mount 前显示占位按钮
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-9"
        aria-label="切换主题"
        disabled
      >
        <Sun className="size-4" />
      </Button>
    )
  }

  const current = (theme as Theme) || 'system'
  const CurrentIcon = current === 'dark' ? Moon : current === 'light' ? Sun : Monitor

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label="切换主题"
        >
          <CurrentIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon
          const active = current === opt.value
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => handleChange(opt.value)}
              className={cn('h-9 cursor-pointer', active && 'bg-accent')}
            >
              <Icon className="size-4" />
              <span className="flex-1">{opt.label}</span>
              {active && <Check className="size-4 text-emerald-600" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
