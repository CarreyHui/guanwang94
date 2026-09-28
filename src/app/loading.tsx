// 九四班官网 - 路由级 loading
// 路由切换 / 流式渲染时显示

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative size-16">
          {/* 外圈渐变 */}
          <div className="absolute inset-0 rounded-full border-4 border-emerald-600/15" />
          {/* 旋转圈 */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-600 animate-spin" />
          {/* 中心 94 */}
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-600">
            94
          </div>
        </div>
        <p className="text-sm text-muted-foreground">九四班官网加载中…</p>
      </div>
    </div>
  )
}
