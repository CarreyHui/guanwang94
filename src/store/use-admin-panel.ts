// 九四班官网 - 管理后台面板开关 + 当前 Tab + 正在编辑的事件 id
// 仅内存态（无 persist），让 site-header 的「后台」按钮和 admin-panel 内的 Tab 切换共享状态

'use client'

import { create } from 'zustand'

export type AdminTab =
  | 'dashboard'
  | 'publish'
  | 'events'
  | 'messages'
  | 'confessions'
  | 'token'

export interface AdminPanelState {
  /** 面板是否打开 */
  open: boolean
  /** 当前激活的 Tab */
  activeTab: AdminTab
  /** 进入「发布/编辑事件」时正在编辑的事件 id（为 null 表示新建） */
  editingEventId: string | null

  openPanel: () => void
  closePanel: () => void
  setActiveTab: (tab: AdminTab) => void
  /** 切到 publish tab 并设置编辑目标；不传 id 即为新建 */
  startEditEvent: (id?: string | null) => void
  /** 清空编辑目标（保留当前 tab） */
  clearEditingEvent: () => void
}

export const useAdminPanel = create<AdminPanelState>((set) => ({
  open: false,
  activeTab: 'dashboard',
  editingEventId: null,

  openPanel: () => set({ open: true }),
  closePanel: () => set({ open: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  startEditEvent: (id = null) =>
    set({ activeTab: 'publish', editingEventId: id ?? null }),
  clearEditingEvent: () => set({ editingEventId: null }),
}))
