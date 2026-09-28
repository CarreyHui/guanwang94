'use client'

import { useEffect } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/hero'
import { AccessGate } from '@/components/access-gate'
import { ReadingProgress } from '@/components/reading-progress'
import { AdminPanel } from '@/components/admin-panel'
import {
  EventsSection,
  GallerySection,
  ConfessionSection,
  MessageSection,
  ArchiveSection,
  AboutSection,
  EventDetailModal,
} from '@/components/sections'
import { useAppStore } from '@/store/use-app-store'
import { useEventModal } from '@/store/use-event-modal'

export default function Home() {
  const accessPassed = useAppStore((s) => s.accessPassed)
  const isAdmin = useAppStore((s) => s.isAdmin)
  const hydrateFromTokens = useAppStore((s) => s.hydrateFromTokens)
  const openEvent = useEventModal((s) => s.openEvent)

  // 启动时从 localStorage token 反推鉴权状态
  useEffect(() => {
    hydrateFromTokens()
  }, [hydrateFromTokens])

  // 已通过门控才上报访问
  useEffect(() => {
    if (!accessPassed) return
    const ctrl = new AbortController()
    fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('gw94_access_token') || ''}`,
      },
      body: JSON.stringify({ path: '/', referrer: document.referrer || '' }),
      signal: ctrl.signal,
    }).catch(() => {})
    return () => ctrl.abort()
  }, [accessPassed])

  // 监听 ?event=id query：通过门控后自动打开事件详情
  useEffect(() => {
    if (!accessPassed) return
    const params = new URLSearchParams(window.location.search)
    const eventId = params.get('event')
    if (eventId) {
      // 滚到事件区
      requestAnimationFrame(() => {
        const eventsSection = document.getElementById('events')
        if (eventsSection) {
          eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
      openEvent(eventId)
      // 清掉 query，避免刷新重复打开
      const url = new URL(window.location.href)
      url.searchParams.delete('event')
      window.history.replaceState(null, '', url.toString())
    }
  }, [accessPassed, openEvent])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <ReadingProgress />
      <SiteHeader />

      <main className="flex-1 flex flex-col">
        {/* Hero 始终可见 */}
        <Hero />

        {/* 门控未通过时只显示 Hero，下方内容隐藏避免泄露 */}
        {accessPassed ? (
          <>
            <EventsSection />
            <GallerySection />
            <ConfessionSection />
            <MessageSection />
            <ArchiveSection />
            <AboutSection />
          </>
        ) : (
          <section className="flex-1 flex items-center justify-center py-20 px-4">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold mb-3 text-primary">
                欢迎来到九四班官网
              </h2>
              <p className="text-muted-foreground mb-6">
                请输入访问令牌以浏览班级内容。默认令牌为{' '}
                <code className="px-2 py-0.5 rounded bg-muted text-primary font-mono">
                  1234
                </code>
                。
              </p>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />

      {/* 全局弹层 */}
      <AccessGate />
      <EventDetailModal />
      {isAdmin && <AdminPanel />}
    </div>
  )
}
