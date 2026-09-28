// 九四班官网 - 全局 Zustand store
// 状态：accessPassed / isAdmin / adminUsername / theme
// 启动时调用 hydrateFromTokens() 从 localStorage 读取 gw94_access_token / gw94_admin_token 同步状态
// theme 通过 persist 持久化；accessPassed/isAdmin 不持久化（避免与 localStorage token 不同步）

'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Theme } from '@/lib/types'

const ACCESS_KEY = 'gw94_access_token'
const ADMIN_KEY = 'gw94_admin_token'
const ADMIN_USERNAME_KEY = 'gw94_admin_username'

export interface AppState {
  /** 是否已通过访问门控 */
  accessPassed: boolean
  /** 是否已登录管理员 */
  isAdmin: boolean
  /** 管理员用户名 */
  adminUsername: string | null
  /** 主题偏好 */
  theme: Theme

  setAccess: (v: boolean) => void
  setAdmin: (v: boolean, username?: string | null) => void
  logout: () => void
  setTheme: (v: Theme) => void
  /** 从 localStorage 读取 token 同步状态，应在客户端 mount 后调用 */
  hydrateFromTokens: () => void
}

function readTokens(): {
  accessPassed: boolean
  isAdmin: boolean
  adminUsername: string | null
} {
  if (typeof window === 'undefined') {
    return { accessPassed: false, isAdmin: false, adminUsername: null }
  }
  try {
    const access = window.localStorage.getItem(ACCESS_KEY)
    const admin = window.localStorage.getItem(ADMIN_KEY)
    const username = window.localStorage.getItem(ADMIN_USERNAME_KEY)
    return {
      accessPassed: !!access,
      isAdmin: !!admin,
      adminUsername: admin ? username : null,
    }
  } catch {
    return { accessPassed: false, isAdmin: false, adminUsername: null }
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      accessPassed: false,
      isAdmin: false,
      adminUsername: null,
      theme: 'system',

      setAccess: (v) => set({ accessPassed: v }),

      setAdmin: (v, username = null) =>
        set({ isAdmin: v, adminUsername: v ? username : null }),

      logout: () => {
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.removeItem(ADMIN_KEY)
            window.localStorage.removeItem(ADMIN_USERNAME_KEY)
          } catch {
            // ignore
          }
        }
        set({ isAdmin: false, adminUsername: null })
      },

      setTheme: (v) => set({ theme: v }),

      hydrateFromTokens: () => {
        set(readTokens())
      },
    }),
    {
      name: 'gw94-app-store',
      storage: createJSONStorage(() => localStorage),
      // 仅持久化主题偏好，access/admin 每次启动由 token 重新推导
      partialize: (s) => ({ theme: s.theme }),
    },
  ),
)
