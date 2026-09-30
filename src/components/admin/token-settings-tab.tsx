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
  Palette,
  Sparkles,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LazyImage } from '@/components/lazy-image'
import { THEME_COLOR_OPTIONS } from '@/components/theme-color-applier'
import { cn } from '@/lib/utils'
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
  const [themeColor, setThemeColor] = React.useState('emerald')
  const [customPrimaryColor, setCustomPrimaryColor] = React.useState('')
  const [funUrl, setFunUrl] = React.useState('')
  const [funTitle, setFunTitle] = React.useState('有趣功能')
  const [funEnabled, setFunEnabled] = React.useState(false)

  // 数据加载后填充
  React.useEffect(() => {
    if (siteQuery.data) {
      setSiteTitle(siteQuery.data.siteTitle)
      setSiteDescription(siteQuery.data.siteDescription)
      setLogoUrl(siteQuery.data.logoUrl)
      setOgImageUrl(siteQuery.data.ogImageUrl)
      setThemeColor(siteQuery.data.themeColor || 'emerald')
      setCustomPrimaryColor(siteQuery.data.customPrimaryColor || '')
      setFunUrl(siteQuery.data.funUrl || '')
      setFunTitle(siteQuery.data.funTitle || '有趣功能')
      setFunEnabled(siteQuery.data.funEnabled ?? false)
    }
  }, [siteQuery.data])

  const siteSaveMut = useMutation({
    mutationFn: () =>
      updateSiteConfig({
        siteTitle,
        siteDescription,
        logoUrl,
        ogImageUrl,
        themeColor,
        customPrimaryColor,
        funUrl,
        funTitle,
        funEnabled,
      }),
    onSuccess: () => {
      toast.success('站点配置已保存')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'site-config'] })
      // 同步到 localStorage 让 ThemeColorApplier 立即生效
      if (typeof window !== 'undefined') {
        localStorage.setItem('gw94_theme_color', themeColor)
        if (customPrimaryColor) {
          localStorage.setItem('gw94_custom_color', customPrimaryColor)
        } else {
          localStorage.removeItem('gw94_custom_color')
        }
      }
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

              {/* 主题色选择器 */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Palette className="size-3.5" />
                  站点主色调
                </Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {THEME_COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setThemeColor(opt.value)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all hover:scale-105',
                        themeColor === opt.value
                          ? 'border-2 border-emerald-600 bg-emerald-600/5 shadow-sm'
                          : 'border-border bg-card hover:border-emerald-600/30',
                      )}
                      aria-pressed={themeColor === opt.value}
                      aria-label={opt.label}
                    >
                      <span
                        className="size-7 rounded-full ring-2 ring-white/50 dark:ring-white/20"
                        style={{ backgroundColor: opt.swatch }}
                      />
                      <span className="text-[11px] font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  保存后全站主色调立即生效（emerald 默认，6 种可选）。访客端下次访问时自动应用。
                </p>
              </div>

              {/* 自定义 hex 主题色（覆盖预设） */}
              <div className="space-y-1.5">
                <Label htmlFor="custom-color" className="flex items-center gap-1">
                  <Palette className="size-3.5" />
                  自定义主色（可选，覆盖预设）
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="color"
                      value={customPrimaryColor || '#10b981'}
                      onChange={(e) => setCustomPrimaryColor(e.target.value)}
                      className="size-11 cursor-pointer rounded-md border border-input bg-background p-1"
                      aria-label="选择自定义颜色"
                    />
                  </div>
                  <Input
                    id="custom-color"
                    value={customPrimaryColor}
                    onChange={(e) => {
                      const v = e.target.value
                      // 仅允许合法 hex 或空
                      if (v === '' || /^#[0-9a-fA-F]{0,6}$/.test(v)) {
                        setCustomPrimaryColor(v)
                      }
                    }}
                    placeholder="#10b981（留空用预设）"
                    className="h-11 flex-1 font-mono"
                    maxLength={7}
                  />
                  {customPrimaryColor && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomPrimaryColor('')}
                      className="h-11 shrink-0"
                    >
                      清除
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  填写合法 hex 颜色（如 <code className="font-mono">#10b981</code>）会覆盖上方预设主色调。留空则使用预设。
                </p>
              </div>

              {/* 趣味跳转配置 */}
              <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <Label className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                  <Sparkles className="size-3.5" />
                  趣味跳转（主页浮动按钮）
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  设置后，主页左下角会显示一个浮动按钮，点击在新标签页打开你配置的网址。可用于跳转班级相册、外部活动页等。
                </p>

                {/* 开关 */}
                <div className="flex items-center justify-between rounded-md bg-card/50 px-3 py-2">
                  <span className="text-sm font-medium">启用趣味跳转</span>
                  <button
                    type="button"
                    onClick={() => setFunEnabled((v) => !v)}
                    aria-pressed={funEnabled}
                    className={cn(
                      'relative h-6 w-11 rounded-full transition-colors',
                      funEnabled ? 'bg-amber-500' : 'bg-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 size-5 rounded-full bg-white transition-transform',
                        funEnabled ? 'translate-x-5' : 'translate-x-0.5',
                      )}
                    />
                  </button>
                </div>

                {/* 标题 + URL */}
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label htmlFor="fun-title" className="text-[11px] text-muted-foreground">
                      按钮标题
                    </Label>
                    <Input
                      id="fun-title"
                      value={funTitle}
                      onChange={(e) => setFunTitle(e.target.value)}
                      placeholder="有趣功能"
                      className="h-10"
                      maxLength={50}
                      disabled={!funEnabled}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="fun-url" className="text-[11px] text-muted-foreground">
                      跳转网址（必须 http:// 或 https:// 开头）
                    </Label>
                    <Input
                      id="fun-url"
                      value={funUrl}
                      onChange={(e) => setFunUrl(e.target.value)}
                      placeholder="https://example.com/class-album"
                      className="h-10"
                      type="url"
                      maxLength={500}
                      disabled={!funEnabled}
                    />
                  </div>
                </div>

                {/* 预览 */}
                {funEnabled && funUrl && (
                  <div className="mt-2 flex items-center gap-2 rounded-md bg-card/60 px-2.5 py-1.5">
                    <span className="text-[11px] text-muted-foreground">预览：</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
                      <Sparkles className="size-3" />
                      {funTitle || '有趣功能'}
                    </span>
                    <code className="truncate text-[10px] text-muted-foreground">{funUrl}</code>
                  </div>
                )}
              </div>

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
