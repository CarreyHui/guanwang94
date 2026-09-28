// 九四班官网 - 格式化工具集

/**
 * 将 ISO 时间字符串/Date 格式化为 `YYYY-MM-DD`
 */
export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return ''
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 将 ISO 时间字符串/Date 格式化为 `YYYY-MM-DD HH:mm`
 */
export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return ''
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return ''
  const date = formatDate(d)
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${date} ${h}:${min}`
}

/**
 * 相对时间：刚刚 / N 分钟前 / N 小时前 / N 天前，再久回退到 YYYY-MM-DD
 */
export function relativeTime(iso: string | Date | null | undefined): string {
  if (!iso) return ''
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 0) return '刚刚' // 时间倒退视为刚刚（极少出现）
  if (sec < 60) return '刚刚'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  const day = Math.floor(h / 24)
  if (day < 30) return `${day} 天前`
  const month = Math.floor(day / 30)
  if (month < 12) return `${month} 个月前`
  return formatDate(d)
}

/**
 * 把逗号/换行/分号/顿号分隔的字符串解析为数组，自动去空白和空项
 */
export function parseList(str: string | null | undefined): string[] {
  if (!str) return []
  return str
    .split(/[,，\n\r;；、]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * 数字千分位（用于展示访问量等较大数字）
 */
export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '0'
  return n.toLocaleString('zh-CN')
}

/**
 * 估算阅读时间（中文按 400 字/分钟，英文按 200 词/分钟混合估算）
 * 返回 "约 N 分钟"
 */
export function readingTime(markdown: string | null | undefined): string {
  if (!markdown) return '约 1 分钟'
  // 去掉 markdown 标记
  const text = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~\-]/g, '')
    .replace(/\s+/g, '')
  // 中文字符数
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  // 英文词数（剩余非空白段）
  const enWords = (text.replace(/[\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter(Boolean)).length
  const minutes = Math.max(1, Math.ceil(cjk / 400 + enWords / 200))
  return `约 ${minutes} 分钟`
}

export interface TocItem {
  level: 1 | 2 | 3
  text: string
  id: string
}

/**
 * 从 Markdown 提取 h1/h2/h3 标题作为目录
 */
export function extractToc(markdown: string | null | undefined): TocItem[] {
  if (!markdown) return []
  const lines = markdown.split('\n')
  const items: TocItem[] = []
  let inCodeBlock = false
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue
    const m = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/)
    if (!m) continue
    const level = m[1].length as 1 | 2 | 3
    const text = m[2].replace(/[`*_~]/g, '').trim()
    if (!text) continue
    const id = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\u4e00-\u9fa5]+/gu, '-')
      .replace(/^-+|-+$/g, '')
    items.push({ level, text, id })
  }
  return items
}
