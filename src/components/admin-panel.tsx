// 九四班官网 - 管理后台主面板（Dialog 全屏覆盖，受 use-admin-panel 控制）
// 左侧 6 个 Tab 导航，右侧内容区根据 activeTab 渲染对应子组件
// 不可 ESC 关、不可点击外部关，避免误关丢失正在编辑的内容；只能用顶部「退出」按钮关闭

'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  Megaphone,
  ListChecks,
  MessageSquare,
  Heart,
  Settings,
  LogOut,
  GraduationCap,
  Sparkles,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAdminPanel, type AdminTab } from '@/store/use-admin-panel'
import { DashboardTab } from '@/components/admin/dashboard-tab'
import { PublishFormTab } from '@/components/admin/publish-form-tab'
import { ManageEventsTab } from '@/components/admin/manage-events-tab'
import { ManageMessagesTab } from '@/components/admin/manage-messages-tab'
import { ManageConfessionsTab } from '@/components/admin/manage-confessions-tab'
import { FunLinksTab } from '@/components/admin/fun-links-tab'
import { TokenSettingsTab } from '@/components/admin/token-settings-tab'

interface NavItem {
  tab: AdminTab
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { tab: 'dashboard', label: '数据看板', icon: LayoutDashboard },
  { tab: 'publish', label: '发布事件', icon: Megaphone },
  { tab: 'events', label: '管理事件', icon: ListChecks },
  { tab: 'messages', label: '管理留言', icon: MessageSquare },
  { tab: 'confessions', label: '管理表白墙', icon: Heart },
  { tab: 'funlinks', label: '趣味跳转', icon: Sparkles },
  { tab: 'token', label: '站点配置', icon: Settings },
]

export function AdminPanel() {
  const open = useAdminPanel((s) => s.open)
  const activeTab = useAdminPanel((s) => s.activeTab)
  const editingEventId = useAdminPanel((s) => s.editingEventId)
  const closePanel = useAdminPanel((s) => s.closePanel)
  const setActiveTab = useAdminPanel((s) => s.setActiveTab)

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) closePanel() }}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="!block !p-0 !gap-0 max-w-6xl w-[95vw] !max-h-[85vh] sm:!max-h-[90vh] overflow-hidden rounded-xl sm:rounded-2xl"
        style={{ maxWidth: '72rem', width: '95vw', maxHeight: '85vh', padding: 0, overflow: 'hidden' }}
      >
        {/* 内部 flex 容器，强制高度 */}
        <div className="flex h-full max-h-[85vh] flex-col sm:max-h-[90vh]" style={{ height: '85vh', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
          {/* 顶部 Header */}
          <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-emerald-600/15 bg-emerald-600/5 px-4 sm:px-6" style={{ flexShrink: 0 }}>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                <GraduationCap className="size-5" />
              </span>
              <div className="flex flex-col leading-tight">
                <DialogTitle className="text-base font-bold tracking-tight">
                  九四班管理后台
                </DialogTitle>
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-600/80">
                  Guanwang94 Admin
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={closePanel}
              className="h-9 gap-1.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-600/10 hover:text-emerald-700 dark:text-emerald-300"
            >
              <LogOut className="size-4" />
              退出后台
            </Button>
          </div>

          {/* 主体：固定高度 + flex */}
          <div className="flex flex-1 flex-col overflow-hidden sm:flex-row" style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            {/* 左侧导航 */}
            <nav className="shrink-0 overflow-x-auto overflow-y-auto border-b border-emerald-600/10 bg-emerald-600/5 sm:w-52 sm:border-b-0 sm:border-r sm:py-2" style={{ flexShrink: 0 }}>
              <ul className="flex w-max gap-1 p-2 sm:flex-col sm:w-full sm:p-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const active = activeTab === item.tab
                  return (
                    <li key={item.tab} className="sm:w-full">
                      <button
                        type="button"
                        onClick={() => setActiveTab(item.tab)}
                        className={cn(
                          'flex h-11 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors',
                          'sm:w-full',
                          active
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-foreground/75 hover:bg-emerald-600/10 hover:text-emerald-700 dark:hover:text-emerald-300',
                        )}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="whitespace-nowrap">{item.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* 右侧内容区：flex-1 + overflow-y-auto */}
            <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'publish' && (
              <PublishFormTab key={editingEventId ?? 'new'} />
            )}
            {activeTab === 'events' && <ManageEventsTab />}
            {activeTab === 'messages' && <ManageMessagesTab />}
            {activeTab === 'confessions' && <ManageConfessionsTab />}
            {activeTab === 'funlinks' && <FunLinksTab />}
            {activeTab === 'token' && <TokenSettingsTab />}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
