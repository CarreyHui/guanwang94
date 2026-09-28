// 九四班官网 - Service Worker 注册器
// 仅在生产环境注册（开发环境 SW 缓存会干扰 HMR）
// 提供「检测到新版本」toast 提示用户刷新

'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    // 仅在生产环境注册（避免 HMR 干扰）
    if (process.env.NODE_ENV !== 'production') return

    let registered = false

    async function register() {
      if (registered) return
      registered = true
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
        // 检测到新版本
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              toast.info('检测到新版本，刷新页面以更新', {
                duration: 8000,
                action: {
                  label: '立即刷新',
                  onClick: () => {
                    newWorker.postMessage('SKIP_WAITING')
                    setTimeout(() => location.reload(), 500)
                  },
                },
              })
            }
          })
        })
      } catch (err) {
        console.warn('[SW] 注册失败:', err)
      }
    }

    // 页面 load 后注册
    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register)
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
