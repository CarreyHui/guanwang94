// 九四班官网 - 滚动渐显动画组件
// 元素进入视口时淡入上移，支持 stagger 延迟

'use client'

import * as React from 'react'
import { motion, useInView } from 'framer-motion'

interface ScrollRevealProps {
  children: React.ReactNode
  delay?: number
  y?: number
  duration?: number
  once?: boolean
  className?: string
  as?: 'div' | 'section' | 'article' | 'li' | 'span'
}

export function ScrollReveal({
  children,
  delay = 0,
  y = 24,
  duration = 0.5,
  once = true,
  className,
  as = 'div',
}: ScrollRevealProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once, amount: 0.15 })
  const MotionTag = motion[as] as typeof motion.div
  return (
    <MotionTag
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  )
}

// 视差背景图（用于 Hero）
interface ParallaxBgProps {
  src: string
  className?: string
  children?: React.ReactNode
}

export function ParallaxBg({ src, className, children }: ParallaxBgProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [offset, setOffset] = React.useState(0)

  React.useEffect(() => {
    function onScroll() {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      // 当 section 在视口内才计算
      if (rect.bottom > 0 && rect.top < windowHeight) {
        setOffset(window.scrollY * 0.3)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={ref} className={className}>
      <div
        className="absolute inset-0 -z-10 size-full"
        style={{
          transform: `translateY(${offset}px) scale(1.1)`,
          transition: 'transform 0.05s linear',
        }}
      >
        {children}
      </div>
    </div>
  )
}
