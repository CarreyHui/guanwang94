// 九四班官网 - 管理后台「站点配置」
// 1. 当前访问令牌 + 修改（GET/PUT /api/access/token）
// 2. 站点 SEO 配置：站点标题/描述/Logo URL/OG image URL（GET/PUT /api/access/site-config）

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
  Globe,
  ImageIcon,
  Type,
  FileText,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LazyImage } from '@/components/lazy-image'
import {
  getAccessToken,
  updateAccessToken,
  getSiteConfig,
  updateSiteConfig,
} from '@/lib/api'
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

  // ===== 站点 SEO 配置 =====
  const siteQuery = useQuery({
    queryKey: ['admin', 'site-config'],
    queryFn: getSiteConfig,
  })

  const [siteTitle, setSiteTitle] = React.useState('')
  const [siteDescription, setSiteDescription] = React.useState('')
  const [logoUrl, setLogoUrl] = React.useState('')
  const [ogImageUrl, setOgImageUrl] = React.useState('')

  // 数据加载后填充
  React.useEffect(() => {
    if (siteQuery.data) {
      setSiteTitle(siteQuery.data.siteTitle)
      setSiteDescription(siteQuery.data.siteDescription)
      setLogoUrl(siteQuery.data.logoUrl)
      setOgImageUrl(siteQuery.data.ogImageUrl)
    }
  }, [siteQuery.data])

  const siteSaveMut = useMutation({
    mutationFn: () =>
      updateSiteConfig({
        siteTitle,
        siteDescription,
        logoUrl,
        ogImageUrl,
      }),
    onSuccess: () => {
      toast.success('站点配置已保存')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'site-config'] })
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : '保存失败')
    },
  })

  function handleSaveSite(e: React.FormEvent) {
    e.preventDefault()
    if (!siteTitle.trim()) {
      toast.error('站点标题不能为空')
      return
    }
    siteSaveMut.mutate()
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

      {/* 站点 SEO 配置 */}
      <Card className="gap-2 py-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="size-4 text-emerald-600" />
            站点 SEO 配置
          </CardTitle>
        </CardHeader>
        <CardContent>
          {siteQuery.isLoading ? (
            <div className="flex h-12 items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> 加载中…
            </div>
          ) : siteQuery.isError ? (
            <div className="text-sm text-rose-600">加载失败，请刷新重试</div>
          ) : (
            <form onSubmit={handleSaveSite} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="site-title" className="flex items-center gap-1">
                  <Type className="size-3.5" />
                  站点标题
                </Label>
                <Input
                  id="site-title"
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  placeholder="九四班官网 · Guanwang94"
                  className="h-11"
                  maxLength={200}
                />
                <p className="text-[11px] text-muted-foreground">
                  显示在浏览器标签和搜索结果标题中（≤200 字符）
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="site-desc" className="flex items-center gap-1">
                  <FileText className="size-3.5" />
                  站点描述
                </Label>
                <Textarea
                  id="site-desc"
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  placeholder="志存高远 · 脚踏实地 · 团结奋进"
                  className="min-h-[80px] resize-y"
                  maxLength={500}
                />
                <p className="text-[11px] text-muted-foreground">
                  用于搜索引擎和社交分享描述（≤500 字符）
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="logo-url" className="flex items-center gap-1">
                    <ImageIcon className="size-3.5" />
                    Logo URL（选填）
                  </Label>
                  <Input
                    id="logo-url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://…/logo.svg"
                    className="h-11"
                    type="url"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="og-url" className="flex items-center gap-1">
                    <ImageIcon className="size-3.5" />
                    OG 分享图 URL（选填）
                  </Label>
                  <Input
                    id="og-url"
                    value={ogImageUrl}
                    onChange={(e) => setOgImageUrl(e.target.value)}
                    placeholder="https://…/og.png（建议 1200×630）"
                    className="h-11"
                    type="url"
                  />
                </div>
              </div>

              {/* Logo 预览 */}
              {(logoUrl || ogImageUrl) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {logoUrl && (
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">Logo 预览</p>
                      <div className="flex size-16 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                        <LazyImage
                          src={logoUrl}
                          alt="Logo"
                          aspectRatio="square"
                          className="size-full"
                          imgClassName="size-full object-contain p-1"
                        />
                      </div>
                    </div>
                  )}
                  {ogImageUrl && (
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">OG 分享图预览</p>
                      <div className="aspect-[1.91/1] w-full max-w-[200px] overflow-hidden rounded-lg border bg-muted">
                        <LazyImage
                          src={ogImageUrl}
                          alt="OG"
                          aspectRatio="wide"
                          className="size-full"
                          imgClassName="size-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={siteSaveMut.isPending || !siteTitle.trim()}
                  className="h-11 gap-1.5 bg-emerald-600 hover:bg-emerald-600/90"
                >
                  {siteSaveMut.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> 保存中…
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> 保存配置
                    </>
                  )}
                </Button>
              </div>
              <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                站点标题/描述影响浏览器标签、搜索引擎和社交分享展示。
                Logo URL 会覆盖默认 favicon。OG 分享图建议 1200×630 像素。
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
