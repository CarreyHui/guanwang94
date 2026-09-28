// 九四班官网 - 管理后台「站点配置」
// 显示当前访问令牌（GET /api/access/token）+ 修改表单（PUT /api/access/token）
// 保存成功 toast：旧令牌已失效，所有客户端需重新输入

'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Loader2,
  Save,
  Copy,
  RefreshCw,
  KeyRound,
  ShieldAlert,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getAccessToken, updateAccessToken } from '@/lib/api'
import type { AccessTokenResponse } from '@/lib/types'

export function TokenSettingsTab() {
  const queryClient = useQueryClient()
  const [newToken, setNewToken] = React.useState('')

  const current = useQuery<AccessTokenResponse>({
    queryKey: ['admin', 'access-token'],
    queryFn: getAccessToken,
  })

  const saveMutation = useMutation({
    mutationFn: (token: string) => updateAccessToken(token),
    onSuccess: () => {
      toast.success('保存成功，旧令牌已失效，所有客户端需重新输入')
      setNewToken('')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'access-token'] })
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : '保存失败'
      toast.error(msg)
    },
  })

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const t = newToken.trim()
    if (!t) {
      toast.error('新令牌不能为空')
      return
    }
    if (t.length < 4) {
      toast.error('令牌至少 4 个字符')
      return
    }
    saveMutation.mutate(t)
  }

  async function handleCopy() {
    const token = current.data?.accessToken
    if (!token) return
    try {
      await navigator.clipboard.writeText(token)
      toast.success('当前令牌已复制到剪贴板')
    } catch {
      toast.error('复制失败，请手动选择复制')
    }
  }

  function handleRefresh() {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'access-token'] })
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-lg font-bold">站点配置</h2>
        <p className="text-sm text-muted-foreground">
          修改访问令牌会立刻让旧令牌失效，所有正在浏览的同学需要重新输入新令牌。
        </p>
      </header>

      {/* 当前令牌 */}
      <Card className="gap-2 py-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4 text-emerald-600" />
            当前访问令牌
          </CardTitle>
        </CardHeader>
        <CardContent>
          {current.isLoading ? (
            <div className="flex h-12 items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              加载中…
            </div>
          ) : current.isError ? (
            <div className="text-sm text-rose-600">加载失败，请刷新重试</div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code
                className="flex-1 select-all overflow-x-auto rounded-md border border-emerald-600/15 bg-emerald-600/5 px-3 py-2.5 font-mono text-base font-bold tracking-wider text-emerald-700 dark:text-emerald-300"
                aria-label="当前访问令牌"
              >
                {current.data?.accessToken || '（未设置）'}
              </code>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!current.data?.accessToken}
                  className="h-10 gap-1.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-600/10 dark:text-emerald-300"
                >
                  <Copy className="size-4" />
                  复制
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="h-10 gap-1.5"
                  title="刷新"
                >
                  <RefreshCw className="size-4" />
                  刷新
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 修改表单 */}
      <Card className="gap-2 py-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="size-4 text-amber-600" />
            修改访问令牌
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="new-token">新令牌</Label>
              <Input
                id="new-token"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                placeholder="例如：2026gw94"
                className="h-11"
                maxLength={64}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              disabled={saveMutation.isPending || !newToken.trim()}
              className="h-11 gap-1.5 bg-emerald-600 hover:bg-emerald-600/90"
            >
              {saveMutation.isPending ? (
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
          </form>
          <p className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            保存后所有当前会话仍可继续访问，但新进入或刷新页面的同学需要输入新令牌。
            默认令牌是 <span className="font-mono font-bold">1234</span>。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
