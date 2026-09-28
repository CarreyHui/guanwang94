// 九四班官网 - 访问门控 Modal
// 通过门控前拦截整页：全屏覆盖 Dialog，强制 open，不能 ESC/点遮罩关闭
// 输入令牌，调 /api/access/verify → 成功存 localStorage + setAccess(true) + toast；失败 toast 错误

'use client'

import * as React from 'react'
import { KeyRound, ShieldCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ACCESS_LOST_EVENT, setAccessToken, verifyAccess } from '@/lib/api'
import { useAppStore } from '@/store/use-app-store'
import { cn } from '@/lib/utils'

export function AccessGate() {
  const accessPassed = useAppStore((s) => s.accessPassed)
  const setAccess = useAppStore((s) => s.setAccess)
  const hydrateFromTokens = useAppStore((s) => s.hydrateFromTokens)

  const [token, setToken] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // 客户端 mount 后从 token 重新推导状态，避免 SSR/CSR 不一致导致的闪烁
  React.useEffect(() => {
    hydrateFromTokens()
    setMounted(true)
  }, [hydrateFromTokens])

  // 监听 access-lost 事件（API 返回 401/403 时触发）
  React.useEffect(() => {
    function handleLost() {
      setAccess(false)
      toast.error('访问令牌已失效，请重新输入')
    }
    window.addEventListener(ACCESS_LOST_EVENT, handleLost)
    return () => window.removeEventListener(ACCESS_LOST_EVENT, handleLost)
  }, [setAccess])

  // 拦截 ESC 与 pointer-down-outside，强制 open
  const handleInteractOutside = React.useCallback(
    (e: Event) => e.preventDefault(),
    [],
  )
  const handleEscapeKeyDown = React.useCallback((e: KeyboardEvent) => {
    e.preventDefault()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = token.trim()
    if (!trimmed) {
      toast.error('请输入访问令牌')
      return
    }
    setLoading(true)
    try {
      const res = await verifyAccess(trimmed)
      setAccessToken(res.signed)
      setAccess(true)
      toast.success('欢迎来到九四班官网！')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '验证失败'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // SSR/CSR 一致：未 mount 时强制不显示，避免 hydration mismatch
  const open = mounted && !accessPassed

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={handleEscapeKeyDown}
        className={cn(
          'sm:max-w-md border-emerald-600/30',
          'bg-background/95 backdrop-blur-xl',
        )}
      >
        <DialogHeader className="space-y-3">
          <div className="flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600 ring-4 ring-emerald-600/10">
              <ShieldCheck className="size-7" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-bold tracking-tight">
            九四班官网 · 访问门控
          </DialogTitle>
          <DialogDescription className="text-center">
            请输入访问令牌以继续浏览班级官网
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="access-token" className="text-sm font-medium">
              访问令牌
            </Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="access-token"
                type="text"
                autoComplete="off"
                placeholder="请输入令牌"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading}
                className="h-11 pl-9"
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !token.trim()}
            className="h-11 w-full bg-emerald-600 hover:bg-emerald-600/90"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                验证中…
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" />
                进入官网
              </>
            )}
          </Button>

          <p className="rounded-md bg-emerald-600/10 px-3 py-2 text-center text-xs text-emerald-700 dark:text-emerald-300">
            提示：默认令牌 <span className="font-mono font-bold">1234</span>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
