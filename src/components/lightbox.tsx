// 九四班官网 - 图片 Lightbox
// 受控 open + 当前索引；大图显示 + 上一张/下一张 + 关闭 + 索引显示 "3 / 12"
// ESC 关闭，左右键切换；framer-motion 淡入

'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface LightboxImage {
  src: string
  alt?: string
}

export interface LightboxProps {
  open: boolean
  images: LightboxImage[]
  index: number
  onIndexChange: (i: number) => void
  onClose: () => void
}

export function Lightbox({
  open,
  images,
  index,
  onIndexChange,
  onClose,
}: LightboxProps) {
  const total = images.length

  const goPrev = React.useCallback(() => {
    if (total <= 1) return
    onIndexChange((index - 1 + total) % total)
  }, [index, total, onIndexChange])

  const goNext = React.useCallback(() => {
    if (total <= 1) return
    onIndexChange((index + 1) % total)
  }, [index, total, onIndexChange])

  // 键盘控制
  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, goPrev, goNext, onClose])

  // 锁定 body 滚动
  React.useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  const current = images[index]

  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          className={cn(
            'fixed inset-0 z-[100] flex flex-col',
            'bg-black/85 backdrop-blur-sm',
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          {/* 顶部栏：关闭 + 索引 */}
          <div
            className="flex items-center justify-between px-4 py-3 text-white/90"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-sm font-medium tabular-nums">
              {index + 1} / {total}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className={cn(
                'flex size-10 items-center justify-center rounded-full',
                'bg-white/10 transition-colors hover:bg-white/20',
              )}
            >
              <X className="size-5" />
            </button>
          </div>

          {/* 大图区 */}
          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.img
                key={current.src}
                src={current.src}
                alt={current.alt ?? ''}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              />
            </AnimatePresence>

            {/* 上一张 */}
            {total > 1 && (
              <button
                type="button"
                onClick={goPrev}
                aria-label="上一张"
                className={cn(
                  'absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full',
                  'bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-4 sm:size-12',
                )}
              >
                <ChevronLeft className="size-6" />
              </button>
            )}

            {/* 下一张 */}
            {total > 1 && (
              <button
                type="button"
                onClick={goNext}
                aria-label="下一张"
                className={cn(
                  'absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full',
                  'bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4 sm:size-12',
                )}
              >
                <ChevronRight className="size-6" />
              </button>
            )}
          </div>

          {/* 底部说明 */}
          {current.alt && (
            <div
              className="px-4 pb-6 text-center text-sm text-white/80"
              onClick={(e) => e.stopPropagation()}
            >
              {current.alt}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
