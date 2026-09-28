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
  BarChart3,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
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
