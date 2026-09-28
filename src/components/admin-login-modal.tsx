// 九四班官网 - 管理员登录 Modal
// 用 shadcn Dialog，受控 open（由父组件传入 onOpenChange）
// 输入用户名 + 密码 → 调 /api/auth/login → 成功存 token + setAdmin(true)；失败 toast

'use client'

import * as React from 'react'
import { Lock, User, Loader2, ShieldAlert } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { adminLogin, setAdminToken } from '@/lib/api'
import { useAppStore } from '@/store/use-app-store'

export interface AdminLoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminLoginModal({ open, onOpenChange }: AdminLoginModalProps) {
  const setAdmin = useAppStore((s) => s.setAdmin)

  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  // 关闭时清空输入
  React.useEffect(() => {
    if (!open) {
      setUsername('')
      setPassword('')
      setLoading(false)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const u = username.trim()
    const p = password
    if (!u || !p) {
      toast.error('请输入用户名和密码')
      return
    }
    setLoading(true)
    try {
      const res = await adminLogin(u, p)
      setAdminToken(res.adminToken, res.username)
      setAdmin(true, res.username)
      toast.success(`欢迎回来，${res.username}`)
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登录失败'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <div className="flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600 ring-4 ring-emerald-600/10">
              <Lock className="size-6" />
            </div>
          </div>
          <DialogTitle className="text-center text-lg font-bold">
            管理员登录
          </DialogTitle>
          <DialogDescription className="text-center">
            登录后可管理事件、留言、表白与站点配置
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="admin-username" className="text-sm font-medium">
              用户名
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-username"
                type="text"
                autoComplete="username"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="h-11 pl-9"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-sm font-medium">
              密码
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-11 pl-9"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-11"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="h-11 bg-emerald-600 hover:bg-emerald-600/90"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  登录中…
                </>
              ) : (
                <>
                  <Lock className="size-4" />
                  登录
                </>
              )}
            </Button>
          </DialogFooter>

          <div className="flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
            <span>
              默认账号 <span className="font-mono font-bold">CarreyHui</span> / 密码{' '}
              <span className="font-mono font-bold">syh20120509</span>
            </span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
