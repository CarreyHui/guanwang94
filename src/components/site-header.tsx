// 九四班官网 - 顶部 Header (sticky)
// 左：Logo「九四班官网」+ 副标题「GUANWANG94 · CLASS」
// 中（桌面）：导航锚点 - 重要事件/班级风采/表白墙/留言/归档/关于我们
// 右：主题切换 + 登录管理员按钮（未登录显示锁图标+"管理员登录"，登录后显示"后台"+"退出"）
// 移动端用 shadcn Sheet 抽屉导航

'use client'

import * as React from 'react'
import {
  Menu,
  Lock,
  LogOut,
  Shield,
  GraduationCap,
  Home,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme-toggle'
import { AdminLoginModal } from '@/components/admin-login-modal'
import { useAppStore } from '@/store/use-app-store'
import { useAdminPanel } from '@/store/use-admin-panel'
import { adminLogout } from '@/lib/api'
import { cn } from '@/lib/utils'

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: '#events', label: '重要事件' },
  { href: '#showcase', label: '班级风采' },
  { href: '#confessions', label: '表白墙' },
  { href: '#messages', label: '留言' },
  { href: '#archive', label: '归档' },
  { href: '#about', label: '关于我们' },
]

function scrollToTop() {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function SiteHeader() {
  const isAdmin = useAppStore((s) => s.isAdmin)
  const adminUsername = useAppStore((s) => s.adminUsername)
  const hydrateFromTokens = useAppStore((s) => s.hydrateFromTokens)
  const logout = useAppStore((s) => s.logout)
  const openPanel = useAdminPanel((s) => s.openPanel)

  const [loginOpen, setLoginOpen] = React.useState(false)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    hydrateFromTokens()
    setMounted(true)
  }, [hydrateFromTokens])

  async function handleLogout() {
    try {
      await adminLogout()
    } catch {
      // 即使后端调用失败也清掉本地状态
    }
    logout()
    toast.success('已退出管理员登录')
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-emerald-600/15',
        'bg-background/80 backdrop-blur-lg',
        'supports-[backdrop-filter]:bg-background/70',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* 左：Logo */}
        <button
          type="button"
          onClick={scrollToTop}
          className="group flex items-center gap-2.5 outline-none"
          aria-label="返回顶部"
        >
          <span
            className={cn(
              'flex size-9 items-center justify-center rounded-lg',
              'bg-emerald-600 text-white shadow-sm transition-transform group-hover:scale-105',
            )}
          >
            <GraduationCap className="size-5" />
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="text-base font-bold tracking-tight">
              九四班官网
            </span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-600/80">
              Guanwang94 · Class
            </span>
          </span>
        </button>

        {/* 中：桌面导航 */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-colors',
                'hover:bg-emerald-600/10 hover:text-emerald-700 dark:hover:text-emerald-300',
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* 右：操作区 */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          {/* 管理员区（mount 后再渲染，避免 hydration 不一致） */}
          {mounted && !isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLoginOpen(true)}
              className="h-9 gap-1.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-600/10 hover:text-emerald-700 dark:text-emerald-300"
            >
              <Lock className="size-4" />
              <span className="hidden sm:inline">管理员登录</span>
            </Button>
          )}
          {mounted && isAdmin && (
            <>
              <span className="hidden text-xs text-emerald-700 dark:text-emerald-300 lg:inline">
                {adminUsername}
              </span>
              <Button
                size="sm"
                variant="default"
                onClick={openPanel}
                className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-600/90"
              >
                <Shield className="size-4" />
                <span className="hidden sm:inline">后台</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-9 gap-1.5"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">退出</span>
              </Button>
            </>
          )}

          {/* 移动端抽屉触发 */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 md:hidden"
                aria-label="打开导航菜单"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <GraduationCap className="size-5 text-emerald-600" />
                  九四班官网
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-2 flex flex-col gap-1 px-4">
                <button
                  type="button"
                  onClick={() => {
                    setSheetOpen(false)
                    scrollToTop()
                  }}
                  className="flex h-11 items-center gap-2 rounded-md px-3 text-left text-sm font-medium hover:bg-emerald-600/10"
                >
                  <Home className="size-4 text-emerald-600" />
                  返回顶部
                </button>
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setSheetOpen(false)}
                    className="flex h-11 items-center rounded-md px-3 text-sm font-medium text-foreground/80 hover:bg-emerald-600/10 hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    {item.label}
                  </a>
                ))}
                <div className="mt-2 border-t pt-2">
                  {mounted && !isAdmin && (
                    <Button
                      variant="outline"
                      className="h-11 w-full justify-start gap-2 border-emerald-600/30 text-emerald-700 hover:bg-emerald-600/10 dark:text-emerald-300"
                      onClick={() => {
                        setSheetOpen(false)
                        setLoginOpen(true)
                      }}
                    >
                      <Lock className="size-4" />
                      管理员登录
                    </Button>
                  )}
                  {mounted && isAdmin && (
                    <>
                      <Button
                        variant="default"
                        className="h-11 w-full justify-start gap-2 bg-emerald-600 hover:bg-emerald-600/90"
                        onClick={() => {
                          setSheetOpen(false)
                          openPanel()
                        }}
                      >
                        <Shield className="size-4" />
                        进入后台
                      </Button>
                      <Button
                        variant="ghost"
                        className="mt-1 h-11 w-full justify-start gap-2"
                        onClick={() => {
                          setSheetOpen(false)
                          handleLogout()
                        }}
                      >
                        <LogOut className="size-4" />
                        退出登录
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <AdminLoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  )
}
