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
