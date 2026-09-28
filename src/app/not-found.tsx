import Link from 'next/link'
import { Home, MessageSquare, Compass, Frown } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      {/* 背景装饰光晕 */}
      <div className="pointer-events-none absolute -left-32 top-1/4 size-96 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 size-96 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/5 blur-3xl" />

      {/* 装饰网格 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 w-full max-w-md text-center">
        {/* 装饰图标 */}
        <div className="mb-6 inline-flex size-20 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm">
          <Compass className="size-10 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
        </div>

        {/* 404 大字 + amber 圆点 */}
        <div className="mb-6 inline-flex items-center gap-2">
          <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 bg-clip-text text-7xl font-extrabold tracking-tight text-transparent sm:text-8xl">
            404
          </div>
          <div className="relative">
            <div className="size-3 rounded-full bg-amber-500" />
            <div className="absolute inset-0 size-3 animate-ping rounded-full bg-amber-500/60" />
          </div>
        </div>

        <h1 className="mb-3 text-2xl font-bold text-primary sm:text-3xl">
          页面走丢了
        </h1>
        <p className="mb-2 text-sm text-muted-foreground sm:text-base">
          你访问的页面不存在或已被移除。
        </p>
        <p className="mb-8 text-sm text-muted-foreground/80">
          可能是链接输错了，也可能这条青春记忆已被归档。
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Home className="size-4" /> 回到首页
          </Link>
          <a
            href="/#messages"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card/50 px-6 font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-accent"
          >
            <MessageSquare className="size-4" /> 给我们留言
          </a>
        </div>

        <div className="mt-12 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
          <Frown className="size-3.5" />
          <span>© 2026 九四班官网 · Guanwang94</span>
        </div>
      </div>
    </div>
  )
}
