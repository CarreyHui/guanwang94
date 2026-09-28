// 九四班官网 - iCal 日历文件生成工具
// 生成符合 RFC 5545 的 .ics 文件，可导入 Google Calendar / Apple Calendar / Outlook

import type { Event } from './types'

// 格式化时间为 iCal UTC 格式：YYYYMMDDTHHMMSSZ
function formatICalDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  )
}

// 转义 iCal 文本中的特殊字符
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

// 折行（iCal 规范每行最多 75 字符）
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  let i = 0
  while (i < line.length) {
    chunks.push((i === 0 ? '' : ' ') + line.slice(i, i + 74))
    i += 74
  }
  return chunks.join('\r\n')
}

export interface ICalEvent {
  uid: string
  title: string
  summary: string
  description: string
  start: Date
  end: Date
  location?: string
  url?: string
  categories?: string[]
}

export function generateICal(events: ICalEvent[], calendarName = '九四班官网'): string {
  const now = formatICalDate(new Date())
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Guanwang94//九四班官网//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    'X-WR-TIMEZONE:Asia/Shanghai',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  ]

  for (const ev of events) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${ev.uid}@guanwang94.saozi.cc.cd`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(`DTSTART:${formatICalDate(ev.start)}`)
    lines.push(`DTEND:${formatICalDate(ev.end)}`)
    lines.push(foldLine(`SUMMARY:${escapeICalText(ev.title)}`))
    lines.push(foldLine(`DESCRIPTION:${escapeICalText(ev.description)}`))
    if (ev.location) {
      lines.push(foldLine(`LOCATION:${escapeICalText(ev.location)}`))
    }
    if (ev.url) {
      lines.push(foldLine(`URL:${ev.url}`))
    }
    if (ev.categories && ev.categories.length > 0) {
      lines.push(foldLine(`CATEGORIES:${ev.categories.map(escapeICalText).join(',')}`))
    }
    lines.push('STATUS:CONFIRMED')
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

// 从 Event 模型转 ICalEvent（默认事件时长 1 小时）
export function eventToICal(ev: Event, siteUrl: string): ICalEvent {
  const start = new Date(ev.publishedAt)
  const end = new Date(start.getTime() + 60 * 60 * 1000) // 默认 1 小时
  const tags = ev.tags
    ? ev.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : []
  return {
    uid: ev.id,
    title: ev.title,
    summary: ev.summary,
    description: `${ev.summary}\n\n${ev.content.replace(/[#*`>_~]/g, '')}`,
    start,
    end,
    url: `${siteUrl}/?event=${ev.id}`,
    categories: [ev.category, ...tags].slice(0, 5),
  }
}
