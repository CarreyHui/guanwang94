// 九四班官网 - 班级相册
// 12 张精选 picsum 图片（seed 区分），分类：学习 / 运动 / 艺术 / 合影 / 校园
// 顶部分类筛选 + 瀑布流网格（CSS columns）+ 点击 Lightbox（上一张/下一张/关闭 + 索引）
// 图片数据内嵌为 const，不调 API

'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageOff, Images } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LazyImage } from '@/components/lazy-image'
import { Lightbox, type LightboxImage } from '@/components/lightbox'
import { cn } from '@/lib/utils'

// ===== 类型与数据 =====
type GalleryCategory = '学习' | '运动' | '艺术' | '合影' | '校园'

interface GalleryPhoto {
  id: string
  src: string
  alt: string
  category: GalleryCategory
  aspect: 'wide' | 'tall' | 'square'
}

// 12 张精选图片（picsum 外链，seed 区分）
const GALLERY_PHOTOS: GalleryPhoto[] = [
  { id: 'study1', src: 'https://picsum.photos/seed/gw94study1/640/480', alt: '课堂上认真听讲', category: '学习', aspect: 'wide' },
  { id: 'study2', src: 'https://picsum.photos/seed/gw94study2/480/640', alt: '图书馆自习', category: '学习', aspect: 'tall' },
  { id: 'study3', src: 'https://picsum.photos/seed/gw94study3/640/640', alt: '晚自习灯下', category: '学习', aspect: 'square' },
  { id: 'sport1', src: 'https://picsum.photos/seed/gw94sport1/640/480', alt: '运动会接力', category: '运动', aspect: 'wide' },
  { id: 'sport2', src: 'https://picsum.photos/seed/gw94sport2/480/640', alt: '篮球比赛', category: '运动', aspect: 'tall' },
  { id: 'sport3', src: 'https://picsum.photos/seed/gw94sport3/640/640', alt: '跳远瞬间', category: '运动', aspect: 'square' },
  { id: 'art1', src: 'https://picsum.photos/seed/gw94art1/480/640', alt: '艺术节舞台', category: '艺术', aspect: 'tall' },
  { id: 'art2', src: 'https://picsum.photos/seed/gw94art2/640/480', alt: '美术作品展示', category: '艺术', aspect: 'wide' },
  { id: 'group1', src: 'https://picsum.photos/seed/gw94group1/640/480', alt: '运动会班级合影', category: '合影', aspect: 'wide' },
  { id: 'group2', src: 'https://picsum.photos/seed/gw94group2/640/640', alt: '春游集体照', category: '合影', aspect: 'square' },
  { id: 'campus1', src: 'https://picsum.photos/seed/gw94campus1/640/480', alt: '校园春色', category: '校园', aspect: 'wide' },
  { id: 'campus2', src: 'https://picsum.photos/seed/gw94campus2/480/640', alt: '教学楼黄昏', category: '校园', aspect: 'tall' },
]

const CATEGORIES: ('全部' | GalleryCategory)[] = [
  '全部',
  '学习',
  '运动',
  '艺术',
  '合影',
  '校园',
]

const CATEGORY_PILL: Record<string, string> = {
  学习: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300',
  运动: 'bg-orange-600/15 text-orange-700 dark:text-orange-300',
  艺术: 'bg-rose-600/15 text-rose-700 dark:text-rose-300',
  合影: 'bg-amber-600/15 text-amber-700 dark:text-amber-300',
  校园: 'bg-teal-600/15 text-teal-700 dark:text-teal-300',
}

export function GallerySection() {
  const [active, setActive] = React.useState<'全部' | GalleryCategory>('全部')
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null)

  const filtered = React.useMemo(() => {
    if (active === '全部') return GALLERY_PHOTOS
    return GALLERY_PHOTOS.filter((p) => p.category === active)
  }, [active])

  const lightboxImages: LightboxImage[] = React.useMemo(
    () => filtered.map((p) => ({ src: p.src, alt: p.alt })),
    [filtered],
  )

  function openLightbox(i: number) {
    setLightboxIndex(i)
  }

  function closeLightbox() {
    setLightboxIndex(null)
  }

  return (
    <section
      id="showcase"
      className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      {/* 标题 */}
      <div className="mb-6">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <Images className="size-3.5" />
          Gallery · 班级风采
        </div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          班级相册
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          学习 · 运动 · 艺术 · 合影 · 校园
        </p>
      </div>

      {/* 分类筛选 */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => {
          const isActive = active === c
          return (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              className={cn(
                'h-9 min-w-[44px] rounded-full px-3.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-emerald-600/10 hover:text-emerald-700 dark:hover:text-emerald-300',
              )}
            >
              {c}
            </button>
          )
        })}
        <span className="ml-auto text-xs text-muted-foreground">
          共 {filtered.length} 张
        </span>
      </div>

      {/* 瀑布流网格（CSS columns） */}
      <div className="columns-2 gap-3 [column-fill:_balance] sm:columns-3 lg:columns-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((photo, i) => (
            <motion.button
              key={photo.id}
              type="button"
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
              onClick={() => openLightbox(i)}
              className={cn(
                'group relative mb-3 block w-full overflow-hidden rounded-lg',
                'break-inside-avoid focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
              )}
              aria-label={`查看图片：${photo.alt}`}
            >
              <LazyImage
                src={photo.src}
                alt={photo.alt}
                aspectRatio={photo.aspect}
                className="size-full"
                imgClassName="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                fallbackSrc={`https://picsum.photos/seed/${photo.id}-fallback/640/480`}
              />
              {/* 浮层标签 */}
              <span
                className={cn(
                  'pointer-events-none absolute left-2 top-2 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm',
                  'bg-black/40 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                  CATEGORY_PILL[photo.category],
                )}
              >
                {photo.category}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* 空状态（理论上不会触发） */}
      {filtered.length === 0 && (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageOff className="size-8 opacity-60" />
          <p className="text-sm">该分类暂无图片</p>
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex !== null}
        images={lightboxImages}
        index={lightboxIndex ?? 0}
        onIndexChange={setLightboxIndex}
        onClose={closeLightbox}
      />
    </section>
  )
}
