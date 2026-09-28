// 九四班官网 - 事件详情 Modal 全局状态
// 让 events-section / archive-section 共享同一个 EventDetailModal 实例
// 使用 zustand（无 persist），仅内存态

'use client'

import { create } from 'zustand'

export interface EventModalState {
  /** 是否打开 */
  open: boolean
  /** 当前选中事件 id */
  selectedId: string | null
  /** 打开某事件详情 */
  openEvent: (id: string) => void
  /** 关闭 */
  closeEvent: () => void
}

export const useEventModal = create<EventModalState>((set) => ({
  open: false,
  selectedId: null,
  openEvent: (id: string) => set({ open: true, selectedId: id }),
  closeEvent: () => set({ open: false, selectedId: null }),
}))
