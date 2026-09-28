// 九四班官网 - 管理后台「数据看板」
// 4 个数字卡片 + 近 7 天访问/留言趋势折线图 + 事件浏览量 Top10 柱状图 + 最近 20 条访问记录表
// 用 @tanstack/react-query 拉数据，recharts 画图

'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  CalendarHeart,
  Eye,
  MessageSquare,
  Activity,
  Loader2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  UserPlus,
  UserCheck,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getOverviewStats,
  getTrend,
  getTopEvents,
  getRecentVisits,
  getHourlyStats,
  getTopPaths,
  getTopReferrers,
  getVisitorTypes,
  getWeeklyComparison,
} from '@/lib/api'
import type { OverviewStats, TrendPoint, TopEvent, Visit } from '@/lib/types'
import { formatDateTime, formatNumber } from '@/lib/format'
import { breakdownUA } from '@/lib/ua'
import { cn } from '@/lib/utils'

// ===== 数字卡片 =====
interface StatCardProps {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  tint: string
}

function StatCard({ label, value, icon: Icon, tint }: StatCardProps) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-lg',
            tint,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className="mt-0.5 truncate text-2xl font-bold leading-none">
            {formatNumber(value)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// ===== 同比对比子组件 =====
interface ComparisonItemProps {
  label: string
  thisWeek: number
  lastWeek: number
  change: number // 百分比，正=增长，负=下降
}

function ComparisonItem({ label, thisWeek, lastWeek, change }: ComparisonItemProps) {
  const isUp = change > 0
  const isDown = change < 0
  const isFlat = change === 0
  const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus
  const colorClass = isUp
    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
    : isDown
      ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
      : 'text-muted-foreground bg-muted'
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
            colorClass,
          )}
        >
          <Icon className="size-3" />
          {isFlat ? '持平' : `${Math.abs(change)}%`}
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-[11px] text-muted-foreground">本周</div>
          <div className="text-xl font-bold tabular-nums">{formatNumber(thisWeek)}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-muted-foreground">上周</div>
          <div className="text-sm tabular-nums text-muted-foreground">{formatNumber(lastWeek)}</div>
        </div>
      </div>
      {/* 进度条对比 */}
      <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
          style={{
            width: `${(thisWeek / Math.max(thisWeek + lastWeek, 1)) * 100}%`,
          }}
        />
        <div
          className="h-full bg-muted"
          style={{
            width: `${(lastWeek / Math.max(thisWeek + lastWeek, 1)) * 100}%`,
          }}
        />
      </div>
    </div>
  )
}

// ===== 折线图 tooltip =====
interface TrendTooltipPayload {
  name: string
  value: number
  color: string
}
function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TrendTooltipPayload[]
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-md border border-emerald-600/20 bg-background px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-semibold text-foreground">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.name}：</span>
          <span className="font-mono font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ===== Top 事件 tooltip =====
interface TopEventsTooltipPayload {
  payload: TopEvent
  value: number
}
function TopEventsTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TopEventsTooltipPayload[]
}) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0]
  return (
    <div className="max-w-[240px] rounded-md border border-emerald-600/20 bg-background px-3 py-2 text-xs shadow-md">
      <div className="line-clamp-2 font-semibold text-foreground">
        {item.payload.title}
      </div>
      <div className="mt-1 text-muted-foreground">
        浏览：<span className="font-mono font-semibold">{item.value}</span>
      </div>
    </div>
  )
}

// ===== Loading 状态 =====
function CenterSpinner({ label = '加载中…' }: { label?: string }) {
  return (
    <div className="flex h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  )
}

// ===== 空状态 =====
function EmptyHint({ hint }: { hint: string }) {
  return (
    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
      {hint}
    </div>
  )
}

// ===== 主组件 =====
export function DashboardTab() {
  const overview = useQuery<OverviewStats>({
    queryKey: ['admin', 'overview'],
    queryFn: getOverviewStats,
  })
  const trend = useQuery<TrendPoint[]>({
    queryKey: ['admin', 'trend', 7],
    queryFn: () => getTrend(7),
  })
  const topEvents = useQuery<TopEvent[]>({
    queryKey: ['admin', 'top-events', 10],
    queryFn: () => getTopEvents(10),
  })
  const recentVisits = useQuery<Visit[]>({
    queryKey: ['admin', 'recent-visits', 20],
    queryFn: () => getRecentVisits(20),
  })
  const hourlyQuery = useQuery({
    queryKey: ['admin', 'hourly'],
    queryFn: getHourlyStats,
  })
  const topPathsQuery = useQuery({
    queryKey: ['admin', 'top-paths', 7, 10],
    queryFn: () => getTopPaths(7, 10),
  })
  const topReferrersQuery = useQuery({
    queryKey: ['admin', 'top-referrers', 7, 10],
    queryFn: () => getTopReferrers(7, 10),
  })
  const visitorTypesQuery = useQuery({
    queryKey: ['admin', 'visitor-types', 7],
    queryFn: () => getVisitorTypes(7),
  })
  const weeklyComparisonQuery = useQuery({
    queryKey: ['admin', 'weekly-comparison'],
    queryFn: getWeeklyComparison,
  })

  const trendData = trend.data ?? []
  const topData = topEvents.data ?? []
  const visits = recentVisits.data ?? []
  const uaBreakdown = React.useMemo(() => breakdownUA(visits), [visits])
  const uaTotal = visits.length || 1

  return (
    <div className="flex flex-col gap-5">
      {/* 4 个数字卡片 */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="总事件数"
          value={overview.data?.totalEvents ?? 0}
          icon={CalendarHeart}
          tint="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300"
        />
        <StatCard
          label="总访问量"
          value={overview.data?.totalVisits ?? 0}
          icon={Eye}
          tint="bg-teal-600/15 text-teal-700 dark:text-teal-300"
        />
        <StatCard
          label="总留言数"
          value={overview.data?.totalMessages ?? 0}
          icon={MessageSquare}
          tint="bg-amber-600/15 text-amber-700 dark:text-amber-300"
        />
        <StatCard
          label="今日访问"
          value={overview.data?.todayVisits ?? 0}
          icon={Activity}
          tint="bg-rose-600/15 text-rose-700 dark:text-rose-300"
        />
      </section>

      {/* 本周 vs 上周同比 */}
      <Card className="gap-2 py-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-emerald-600" />
            本周 vs 上周同比
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyComparisonQuery.isLoading ? (
            <CenterSpinner />
          ) : weeklyComparisonQuery.isError ? (
            <EmptyHint hint="加载失败" />
          ) : !weeklyComparisonQuery.data ? (
            <EmptyHint hint="暂无数据" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <ComparisonItem
                label="访问量"
                thisWeek={weeklyComparisonQuery.data.thisWeek.visits}
                lastWeek={weeklyComparisonQuery.data.lastWeek.visits}
                change={weeklyComparisonQuery.data.visitChange}
              />
              <ComparisonItem
                label="留言数"
                thisWeek={weeklyComparisonQuery.data.thisWeek.messages}
                lastWeek={weeklyComparisonQuery.data.lastWeek.messages}
                change={weeklyComparisonQuery.data.messageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 趋势折线图 */}
      <Card className="gap-2 py-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-emerald-600" />
            近 7 天访问 / 留言趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trend.isLoading ? (
            <CenterSpinner />
          ) : trendData.length === 0 ? (
            <EmptyHint hint="暂无趋势数据" />
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-emerald-600/10"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    name="访问"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#059669' }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="messages"
                    name="留言"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#d97706' }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 事件柱状图 */}
      <Card className="gap-2 py-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-emerald-600" />
            事件浏览量 Top 10
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topEvents.isLoading ? (
            <CenterSpinner />
          ) : topData.length === 0 ? (
            <EmptyHint hint="暂无事件数据" />
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-emerald-600/10"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <YAxis
                    type="category"
                    dataKey="title"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    stroke="currentColor"
                    className="text-muted-foreground"
                    width={120}
                    tickFormatter={(v: string) =>
                      v.length > 10 ? `${v.slice(0, 10)}…` : v
                    }
                  />
                  <Tooltip
                    content={<TopEventsTooltip />}
                    cursor={{ fill: 'rgba(16,185,129,0.06)' }}
                  />
                  <Bar
                    dataKey="viewCount"
                    name="浏览数"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 访客设备 / 浏览器 / 系统分布 */}
      <section className="grid gap-3 lg:grid-cols-3">
        {(() => {
          const sections: Array<{
            title: string
            icon: React.ComponentType<{ className?: string }>
            data: { name: string; count: number; color: string }[]
            iconMap: Record<string, React.ComponentType<{ className?: string }>>
          }> = [
            {
              title: '设备分布',
              icon: Smartphone,
              data: uaBreakdown.byDevice,
              iconMap: { desktop: Monitor, mobile: Smartphone, tablet: Tablet },
            },
            {
              title: '浏览器分布',
              icon: Globe,
              data: uaBreakdown.byBrowser,
              iconMap: {},
            },
            {
              title: '操作系统分布',
              icon: Monitor,
              data: uaBreakdown.byOS,
              iconMap: {},
            },
          ]
          return sections.map((sec) => (
            <Card key={sec.title} className="gap-2 py-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <sec.icon className="size-4 text-emerald-600" />
                  {sec.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {visits.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    暂无访问数据
                  </p>
                ) : sec.data.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    无法识别
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {sec.data.slice(0, 6).map((item) => {
                      const pct = Math.round((item.count / uaTotal) * 100)
                      const IconComp = sec.iconMap[item.name.toLowerCase()]
                      return (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="flex w-20 shrink-0 items-center gap-1.5 text-xs">
                            {IconComp ? (
                              <IconComp
                                className="size-3.5"
                                // lucide-react 接受 style via SVGProps
                                {...({ style: { color: item.color } } as Record<string, unknown>)}
                              />
                            ) : (
                              <span
                                className="inline-block size-2 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                            )}
                            <span className="truncate font-medium">{item.name}</span>
                          </div>
                          <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-muted">
                            <div
                              className="absolute inset-y-0 left-0 rounded-md transition-all"
                              style={{ width: `${pct}%`, backgroundColor: item.color }}
                            />
                            <span className="absolute inset-0 flex items-center justify-between px-2 text-[11px] font-medium text-foreground">
                              <span className="opacity-0">.</span>
                              <span>{item.count} · {pct}%</span>
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        })()}
      </section>

      {/* 访问小时分布 + 一周热力图 */}
      <Card className="gap-2 py-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4 text-emerald-600" />
            访问时间分布（近 7 天）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hourlyQuery.isLoading ? (
            <CenterSpinner />
          ) : hourlyQuery.isError ? (
            <EmptyHint hint="加载失败" />
          ) : (
            <div className="flex flex-col gap-4">
              {/* 24 小时柱状图 */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  按小时分布
                </p>
                <div className="flex h-32 items-end gap-0.5">
                  {hourlyQuery.data?.hourly.map((count, h) => {
                    const max = Math.max(1, ...hourlyQuery.data.hourly)
                    const pct = (count / max) * 100
                    return (
                      <div
                        key={h}
                        className="group relative flex-1"
                        title={`${h}:00 - ${count} 次访问`}
                      >
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-emerald-500 to-teal-400 transition-all hover:from-emerald-600 hover:to-teal-500"
                          style={{ height: `${Math.max(2, pct)}%` }}
                        />
                        {/* hover tooltip */}
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background group-hover:block">
                          {h}:00 → {count}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>0</span>
                  <span>6</span>
                  <span>12</span>
                  <span>18</span>
                  <span>23</span>
                </div>
              </div>

              {/* 最佳发布时段推荐 */}
              {(() => {
                const hourly = hourlyQuery.data?.hourly ?? []
                if (hourly.length === 0 || hourly.every((c) => c === 0)) return null
                // 找访问量最高的 3 个小时（连续 2 小时窗口之和最大）
                const windows: { start: number; total: number }[] = []
                for (let h = 0; h < 24; h++) {
                  const next = (h + 1) % 24
                  windows.push({ start: h, total: hourly[h] + hourly[next] })
                }
                windows.sort((a, b) => b.total - a.total)
                const best = windows[0]
                if (!best || best.total === 0) return null
                return (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="size-3.5" />
                      最佳发布时段推荐
                    </div>
                    <p className="mt-1 text-sm text-foreground">
                      访客最活跃时段：<span className="font-bold text-emerald-700 dark:text-emerald-300">{best.start}:00 - {(best.start + 2) % 24}:00</span>
                      ，共 {best.total} 次访问
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      建议在该时段发布重要事件，可获得更高曝光
                    </p>
                  </div>
                )
              })()}

              {/* 一周 × 24 小时热力图 */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  一周 × 24 小时热力图
                </p>
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    {/* 表头：小时 */}
                    <div className="flex">
                      <div className="w-8 shrink-0" />
                      <div className="flex flex-1 gap-0.5">
                        {Array.from({ length: 24 }).map((_, h) => (
                          <div
                            key={h}
                            className="flex-1 text-center text-[9px] text-muted-foreground"
                          >
                            {h % 3 === 0 ? h : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* 行：周一..周日 */}
                    {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, di) => (
                      <div key={day} className="flex items-center gap-0.5">
                        <div className="w-8 shrink-0 text-[10px] text-muted-foreground">{day}</div>
                        <div className="flex flex-1 gap-0.5">
                          {hourlyQuery.data?.heatmap[di]?.map((count, hi) => {
                            const intensity = count / (hourlyQuery.data?.maxCell || 1)
                            // emerald 色阶：0=透明，1=深 emerald
                            const bg = intensity === 0
                              ? 'bg-muted'
                              : intensity < 0.25
                                ? 'bg-emerald-500/20'
                                : intensity < 0.5
                                  ? 'bg-emerald-500/40'
                                  : intensity < 0.75
                                    ? 'bg-emerald-500/70'
                                    : 'bg-emerald-600'
                            return (
                              <div
                                key={hi}
                                className={cn(
                                  'group relative aspect-square flex-1 rounded-sm transition-all hover:ring-2 hover:ring-emerald-500/40',
                                  bg,
                                )}
                                title={`${day} ${hi}:00 - ${count} 次`}
                              >
                                {count > 0 && intensity >= 0.5 && (
                                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[8px] font-medium text-white">
                                    {count}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* 色阶图例 */}
                <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
                  <span>少</span>
                  <div className="size-2.5 rounded-sm bg-muted" />
                  <div className="size-2.5 rounded-sm bg-emerald-500/20" />
                  <div className="size-2.5 rounded-sm bg-emerald-500/40" />
                  <div className="size-2.5 rounded-sm bg-emerald-500/70" />
                  <div className="size-2.5 rounded-sm bg-emerald-600" />
                  <span>多</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 热门路径 Top 10 */}
      <Card className="gap-2 py-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-emerald-600" />
            热门路径 Top 10（近 7 天）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPathsQuery.isLoading ? (
            <CenterSpinner />
          ) : topPathsQuery.isError ? (
            <EmptyHint hint="加载失败" />
          ) : (topPathsQuery.data?.items ?? []).length === 0 ? (
            <EmptyHint hint="暂无访问数据" />
          ) : (
            <div className="flex flex-col gap-2">
              {(topPathsQuery.data?.items ?? []).map((item, i) => {
                const max = topPathsQuery.data?.items[0]?.count || 1
                const pct = (item.count / max) * 100
                return (
                  <div key={item.path + i} className="flex items-center gap-2">
                    <span className="w-6 shrink-0 text-right text-xs font-medium text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="mb-0.5 flex items-center justify-between gap-2">
                        <code className="truncate font-mono text-xs text-foreground">
                          {item.path}
                        </code>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                          {item.count}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
              {topPathsQuery.data && (
                <p className="mt-2 border-t pt-2 text-[11px] text-muted-foreground">
                  共 {topPathsQuery.data.uniquePaths} 个不同路径，{topPathsQuery.data.total} 次访问
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 热门来源 referrer Top 10 */}
      <Card className="gap-2 py-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="size-4 text-emerald-600" />
            热门来源 Top 10（近 7 天）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topReferrersQuery.isLoading ? (
            <CenterSpinner />
          ) : topReferrersQuery.isError ? (
            <EmptyHint hint="加载失败" />
          ) : (topReferrersQuery.data?.items ?? []).length === 0 ? (
            <EmptyHint hint="暂无来源数据（直接访问无 referrer）" />
          ) : (
            <div className="flex flex-col gap-2">
              {(topReferrersQuery.data?.items ?? []).map((item, i) => {
                const max = topReferrersQuery.data?.items[0]?.count || 1
                const pct = (item.count / max) * 100
                return (
                  <div key={item.referrer + i} className="flex items-center gap-2">
                    <span className="w-6 shrink-0 text-right text-xs font-medium text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="mb-0.5 flex items-center justify-between gap-2">
                        <code className="truncate font-mono text-xs text-foreground">
                          {item.referrer}
                        </code>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                          {item.count}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
              {topReferrersQuery.data && (
                <p className="mt-2 border-t pt-2 text-[11px] text-muted-foreground">
                  共 {topReferrersQuery.data.uniqueReferrers} 个来源，{topReferrersQuery.data.total} 次带 referrer 访问
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新访客 vs 回访 */}
      <Card className="gap-2 py-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4 text-emerald-600" />
            新访客 vs 回访（近 7 天）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visitorTypesQuery.isLoading ? (
            <CenterSpinner />
          ) : visitorTypesQuery.isError ? (
            <EmptyHint hint="加载失败" />
          ) : !visitorTypesQuery.data || visitorTypesQuery.data.total === 0 ? (
            <EmptyHint hint="暂无访客数据" />
          ) : (
            <div className="flex flex-col gap-3">
              {/* 双数字卡 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    <UserPlus className="size-3.5" />
                    新访客
                  </div>
                  <div className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                    {formatNumber(visitorTypesQuery.data.newCount)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {visitorTypesQuery.data.newPct}% 占比
                  </div>
                </div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                    <UserCheck className="size-3.5" />
                    回访客
                  </div>
                  <div className="text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-300">
                    {formatNumber(visitorTypesQuery.data.returningCount)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {visitorTypesQuery.data.returningPct}% 占比
                  </div>
                </div>
              </div>

              {/* 比例条 */}
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>新访客 {visitorTypesQuery.data.newPct}%</span>
                  <span>回访 {visitorTypesQuery.data.returningPct}%</span>
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                    style={{ width: `${visitorTypesQuery.data.newPct}%` }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all"
                    style={{ width: `${visitorTypesQuery.data.returningPct}%` }}
                  />
                </div>
              </div>

              {/* 独立访客数 */}
              <p className="border-t pt-2 text-[11px] text-muted-foreground">
                共 {formatNumber(visitorTypesQuery.data.uniqueVisitors)} 个独立访客，
                {formatNumber(visitorTypesQuery.data.total)} 次访问
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 最近访问记录 */}
      <Card className="gap-2 py-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="size-4 text-emerald-600" />
            最近 20 条访问记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentVisits.isLoading ? (
            <CenterSpinner />
          ) : visits.length === 0 ? (
            <EmptyHint hint="暂无访问记录" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>路径</TableHead>
                  <TableHead className="hidden sm:table-cell">IP Hash</TableHead>
                  <TableHead className="hidden md:table-cell">UA</TableHead>
                  <TableHead className="hidden lg:table-cell">来源</TableHead>
                  <TableHead className="text-right">时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="max-w-[140px] truncate font-mono text-xs">
                      {v.path || '/'}
                    </TableCell>
                    <TableCell className="hidden max-w-[120px] truncate font-mono text-xs text-muted-foreground sm:table-cell">
                      {v.ipHash ? `${v.ipHash.slice(0, 10)}…` : '-'}
                    </TableCell>
                    <TableCell className="hidden max-w-[200px] truncate text-xs text-muted-foreground md:table-cell">
                      {v.ua
                        ? v.ua.length > 36
                          ? `${v.ua.slice(0, 36)}…`
                          : v.ua
                        : '-'}
                    </TableCell>
                    <TableCell className="hidden max-w-[140px] truncate text-xs text-muted-foreground lg:table-cell">
                      {v.referrer || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">
                      {formatDateTime(v.visitedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
