import Link from 'next/link'
import { Home, MessageSquare } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background text-foreground">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="text-7xl font-extrabold tracking-tight">404</div>
          <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold mb-3 text-primary">页面走丢了</h1>
        <p className="text-muted-foreground mb-8">
          你访问的页面不存在或已被移除。可能是链接输错了，也可能这条青春记忆已被归档。
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            <Home className="w-4 h-4" /> 回到首页
          </Link>
          <a
            href="/#messages"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-lg border border-border text-foreground font-medium hover:bg-accent transition"
          >
            <MessageSquare className="w-4 h-4" /> 给我们留言
          </a>
        </div>
        <p className="mt-10 text-xs text-muted-foreground">
          © 2026 九四班官网 · Guanwang94
        </p>
      </div>
    </div>
  )
}
