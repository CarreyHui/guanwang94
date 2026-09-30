// 九四班官网 - 趣味跳转浮动按钮
// 调 /api/access/fun-link 获取管理员配置的趣味链接
// enabled && url 时显示，点击在新标签页打开

'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ExternalLink } from 'lucide-react'
import { getFunLink } from '@/lib/api'
import { useAppStore } from '@/store/use-app-store'
import { cn } from '@/lib/utils'

export function FunLinkButton() {
  const accessPassed = useAppStore((s) => s.accessPassed)
  const [funLink, setFunLink] = React.useState<{ enabled: boolean; url: string; title: string } | null>(null)
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    if (!accessPassed) {
      setFunLink(null)
      setLoaded(false)
      return
    }
    let cancelled = false
    getFunLink()
      .then((data) => {
        if (!cancelled) {
          setFunLink(data)
          setLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [accessPassed])

  // 不显示条件：未加载 / 未通过门控 / 未启用 / 无 URL
  if (!loaded || !accessPassed || !funLink?.enabled || !funLink?.url) {
    return null
  }

  function handleClick() {
    if (!funLink?.url) return
    // 安全校验：仅允许 http/https
    if (!/^https?:\/\//.test(funLink.url)) return
    window.open(funLink.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <AnimatePresence>
      <motion.button
        type="button"
        onClick={handleClick}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'group fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg',
          'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white',
          'transition-shadow hover:shadow-xl hover:shadow-orange-500/30',
        )}
        aria-label={funLink.title}
        title={funLink.url}
      >
        <span className="relative flex size-5 items-center justify-center">
          <Sparkles className="size-5" />
          {/* 闪烁动画装饰 */}
          <span className="absolute -right-1 -top-1 size-1.5 animate-ping rounded-full bg-amber-200" />
        </span>
        <span className="text-sm font-bold tracking-wide">{funLink.title}</span>
        <ExternalLink className="size-3.5 opacity-70 transition-opacity group-hover:opacity-100" />
      </motion.button>
    </AnimatePresence>
  )
}
