// 九四班官网 - 懒加载图片
// native <img loading="lazy"> + shimmer 占位 + onError 兜底（破损图标 placeholder）
// 完成加载淡入

'use client'

import * as React from 'react'
import { ImageOff } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface LazyImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined
  /** 占位宽高比，配合 shimmer 显示 */
  aspectRatio?: 'square' | 'wide' | 'tall' | 'auto'
  alt: string
  className?: string
  imgClassName?: string
  /** 兜底占位图（onError 触发后切换到这里再试一次） */
  fallbackSrc?: string
}

const RATIO_CLASS: Record<NonNullable<LazyImageProps['aspectRatio']>, string> = {
  square: 'aspect-square',
  wide: 'aspect-[16/9]',
  tall: 'aspect-[3/4]',
  auto: '',
}

export function LazyImage({
  src,
  alt,
  aspectRatio = 'wide',
  className,
  imgClassName,
  fallbackSrc,
  ...rest
}: LazyImageProps) {
  const [usedSrc, setUsedSrc] = React.useState<string | null | undefined>(src)
  const [loaded, setLoaded] = React.useState(false)
  const [errored, setErrored] = React.useState(false)

  // 切换 src 时重置状态
  React.useEffect(() => {
    setUsedSrc(src)
    setLoaded(false)
    setErrored(false)
  }, [src])

  function handleError() {
    if (fallbackSrc && usedSrc !== fallbackSrc) {
      // 尝试兜底图
      setUsedSrc(fallbackSrc)
      setLoaded(false)
    } else {
      setErrored(true)
    }
  }

  const showPlaceholder = errored || !usedSrc

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted',
        RATIO_CLASS[aspectRatio],
        aspectRatio === 'auto' && 'h-full',
        className,
      )}
    >
      {/* shimmer 占位（加载完成或错误时隐藏） */}
      {!loaded && !showPlaceholder && (
        <div aria-hidden className="shimmer absolute inset-0" />
      )}

      {showPlaceholder ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
          <ImageOff className="size-7 opacity-60" />
          {alt && (
            <span className="line-clamp-2 px-2 text-center text-xs text-muted-foreground/80">
              {alt}
            </span>
          )}
        </div>
      ) : (
        <img
          src={usedSrc ?? undefined}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={cn(
            'size-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
          {...rest}
        />
      )}
    </div>
  )
}
