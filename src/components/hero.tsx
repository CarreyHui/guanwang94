// 九四班官网 - Hero 区
// 大背景图（picsum） + emerald 渐变遮罩 + 班级口号 + slogan + 4 个统计数字 + 2 个 CTA
// 统计数据从 /api/stats/public 获取，带计数动画

'use client'

import * as React from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Info, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LazyImage } from '@/components/lazy-image'
import { getPublicStats } from '@/lib/api'
import { useAppStore } from '@/store/use-app-store'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

const HERO_IMAGE = 'https://picsum.photos/seed/gw94hero/1600/800'
const CLASS_NUMBER = 94

interface Stat {
  label: string
  value: number
  suffix?: string
}

function useCountUp(target: number, active: boolean, duration = 1200): number {
  const [current, setCurrent] = React.useState(0)
  React.useEffect(() => {
    if (!active || target <= 0) {
      setCurrent(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, duration])
  return current
}

function StatItem({ stat, active }: { stat: Stat; active: boolean }) {
  const value = useCountUp(stat.value, active)
  return (
    <div className="flex flex-col items-center gap-1 px-3 py-2 text-center">
      <span className="count-up text-2xl font-bold text-white sm:text-3xl md:text-4xl">
        {formatNumber(value)}
        {stat.suffix}
      </span>
      <span className="text-xs font-medium text-white/80 sm:text-sm">
        {stat.label}
      </span>
    </div>
  )
}

export function Hero() {
  const accessPassed = useAppStore((s) => s.accessPassed)
  const hydrateFromTokens = useAppStore((s) => s.hydrateFromTokens)

  const [stats, setStats] = React.useState<{
    eventCount: number
    messageCount: number
    visitCount: number
  } | null>(null)

  const statsRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(statsRef, { once: true, margin: '-50px' })

  // 视差滚动
  const [scrollY, setScrollY] = React.useState(0)
  React.useEffect(() => {
    let raf = 0
    function onScroll() {
      if (raf) return
      raf = requestAnimationFrame(() => {
        setScrollY(window.scrollY)
        raf = 0
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  React.useEffect(() => {
    hydrateFromTokens()
  }, [hydrateFromTokens])

  React.useEffect(() => {
    if (!accessPassed) return
    let cancelled = false
    getPublicStats()
      .then((data) => {
        if (!cancelled) {
          setStats({
            eventCount: data.eventCount,
            messageCount: data.messageCount,
            visitCount: data.visitCount,
          })
        }
      })
      .catch(() => {
        // 静默失败，统计数字会用 0 占位
      })
    return () => {
      cancelled = true
    }
  }, [accessPassed])

  const items: Stat[] = [
    { label: '重要事件', value: stats?.eventCount ?? 0 },
    { label: '留言数', value: stats?.messageCount ?? 0 },
    { label: '访问数', value: stats?.visitCount ?? 0 },
    { label: '班号', value: CLASS_NUMBER, suffix: ' 班' },
  ]

  return (
    <section
      id="hero"
      className="relative isolate flex min-h-[60vh] items-center justify-center overflow-hidden sm:min-h-[70vh] lg:min-h-[78vh]"
    >
      {/* 背景图（视差） */}
      <div
        className="absolute inset-0 -z-10 size-full overflow-hidden"
        style={{
          transform: `translate3d(0, ${scrollY * 0.25}px, 0) scale(1.15)`,
          transition: 'transform 0.08s linear',
        }}
      >
        <LazyImage
          src={HERO_IMAGE}
          alt="九四班 · 班级背景"
          aspectRatio="wide"
          className="size-full"
          imgClassName="size-full object-cover"
        />
      </div>

      {/* emerald 渐变遮罩 */}
      <div
        className={cn(
          'absolute inset-0 -z-10',
          'bg-gradient-to-br from-emerald-900/80 via-emerald-700/65 to-teal-600/70',
        )}
      />
      <div
        className={cn(
          'absolute inset-0 -z-10',
          'bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(6,78,59,0.55)_100%)]',
        )}
      />

      {/* 装饰浮动光晕（hero 顶部 + 底部） */}
      <div className="pointer-events-none absolute -left-20 top-1/4 size-72 rounded-full bg-emerald-400/20 blur-3xl motion-safe:animate-pulse" />
      <div
        className="pointer-events-none absolute -right-20 top-1/3 size-80 rounded-full bg-amber-400/15 blur-3xl motion-safe:animate-pulse"
        style={{ animationDelay: '1.5s' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 size-72 rounded-full bg-teal-300/20 blur-3xl motion-safe:animate-pulse"
        style={{ animationDelay: '0.8s' }}
      />

      {/* 装饰网格 */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
        }}
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-20 text-center sm:px-6 md:py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center gap-5"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-md ring-1 ring-white/30">
            <Sparkles className="size-3.5" />
            Guanwang94 · Class of 94
          </span>

          <h1 className="text-5xl font-bold tracking-tight text-white drop-shadow-sm sm:text-6xl md:text-7xl">
            九四班
          </h1>

          <p className="max-w-2xl text-base font-medium text-white/90 sm:text-lg md:text-xl">
            志存高远 · 脚踏实地 · 团结奋进
          </p>

          <p className="max-w-2xl text-sm text-white/75 sm:text-base">
            这里记录九四班的每一次重要时刻、每一份温暖瞬间。
          </p>

          {/* CTA */}
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 gap-2 bg-white px-6 text-emerald-700 shadow-lg hover:bg-white/90"
            >
              <a href="#events">
                浏览重要事件
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 gap-2 border-white/40 bg-white/10 px-6 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
            >
              <a href="#about">
                <Info className="size-4" />
                关于我们
              </a>
            </Button>
          </div>
        </motion.div>

        {/* 统计数字 */}
        <motion.div
          ref={statsRef}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={cn(
            'mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4',
            'rounded-2xl bg-white/10 p-2 backdrop-blur-md ring-1 ring-white/20',
          )}
        >
          {items.map((s) => (
            <StatItem key={s.label} stat={s} active={inView} />
          ))}
        </motion.div>
      </div>

      {/* 底部斜切过渡 */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-12',
          'bg-gradient-to-b from-transparent to-background',
        )}
      />
    </section>
  )
}
