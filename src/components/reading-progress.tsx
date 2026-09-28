// 九四班官网 - 阅读进度条 + 返回顶部按钮
// 顶部 3px 进度条（reading-progress class），监听 scroll 计算百分比
// 滚动 > 600px 显示右下角圆形"返回顶部"按钮，emerald 主题，hover 放大
// 用 framer-motion 做 in/out 动画

'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

import { cn } from '@/lib/utils'

const SHOW_AFTER = 600

export function ReadingProgress() {
  const [progress, setProgress] = React.useState(0)
  const [showButton, setShowButton] = React.useState(false)

  React.useEffect(() => {
    let ticking = false
    function update() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const height =
        document.documentElement.scrollHeight - window.innerHeight
      const pct = height > 0 ? Math.min(100, (scrollTop / height) * 100) : 0
      setProgress(pct)
      setShowButton(scrollTop > SHOW_AFTER)
      ticking = false
    }
    function onScroll() {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* 顶部进度条 */}
      <div
        aria-hidden
        className={cn(
          'reading-progress fixed inset-x-0 top-0 z-[60] h-[3px] origin-left',
        )}
        style={{ transform: `scaleX(${progress / 100})` }}
      />

      {/* 返回顶部 */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            type="button"
            onClick={scrollToTop}
            aria-label="返回顶部"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              'fixed bottom-6 right-6 z-50',
              'flex size-11 items-center justify-center rounded-full',
              'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30',
              'ring-2 ring-emerald-600/20 hover:bg-emerald-700',
              'focus:outline-none focus-visible:ring-emerald-600/40',
            )}
          >
            <ArrowUp className="size-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
