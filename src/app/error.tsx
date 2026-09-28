// 九四班官网 - 全局运行时错误边界
// 任何 React 渲染错误都会兜底显示这个页面，避免整页白屏

'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 上报错误到 console（生产环境可对接 Sentry）
    console.error('[九四班官网] 运行时错误:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background text-foreground">
      <div className="w-full max-w-md text-center">
        <div className="relative mx-auto mb-6 size-20">
          <div className="absolute inset-0 -z-10 rounded-full bg-rose-500/20 blur-2xl" />
          <AlertTriangle className="size-20 text-rose-500" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-rose-600 dark:text-rose-400">
          页面出了点小问题
        </h1>
        <p className="text-sm text-muted-foreground mb-2">
          抱歉，页面在渲染时遇到了一个错误。可以尝试重试，或回到首页。
        </p>
        {error.digest && (
          <p className="mb-4 rounded-md bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">
            错误码：{error.digest}
          </p>
        )}
        {process.env.NODE_ENV === 'development' && error.message && (
          <details className="mb-4 rounded-md border border-rose-500/30 bg-rose-500/5 p-3 text-left text-xs text-rose-700 dark:text-rose-300">
            <summary className="cursor-pointer font-medium">
              开发模式错误信息
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <RefreshCw className="size-4" />
            重试
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Home className="size-4" />
            回到首页
          </a>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          © 2026 九四班官网 · Guanwang94
        </p>
      </div>
    </div>
  )
}
