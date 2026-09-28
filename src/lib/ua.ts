// 九四班官网 - UA（User-Agent）解析工具
// 轻量级纯字符串解析，不依赖第三方库，避免增加 bundle size

export interface ParsedUA {
  browser: string
  browserVersion: string
  os: string
  device: 'desktop' | 'mobile' | 'tablet'
  bot: boolean
}

export function parseUA(ua: string | null | undefined): ParsedUA {
  const s = (ua || '').toLowerCase()
  const result: ParsedUA = {
    browser: '其他',
    browserVersion: '',
    os: '其他',
    device: 'desktop',
    bot: false,
  }

  // Bot
  if (/bot|crawler|spider|slurp|baidu|bing|googlebot|yandex/.test(s)) {
    result.bot = true
  }

  // OS
  if (/windows nt 10/.test(s)) result.os = 'Windows 10+'
  else if (/windows nt 6\.3/.test(s)) result.os = 'Windows 8.1'
  else if (/windows nt 6\.2/.test(s)) result.os = 'Windows 8'
  else if (/windows nt 6\.1/.test(s)) result.os = 'Windows 7'
  else if (/windows/.test(s)) result.os = 'Windows'
  else if (/mac os x|macintosh|iphone|ipad/.test(s)) {
    if (/ipad/.test(s)) result.os = 'iPadOS'
    else if (/iphone/.test(s)) result.os = 'iOS'
    else result.os = 'macOS'
  }
  else if (/android/.test(s)) result.os = 'Android'
  else if (/linux/.test(s)) result.os = 'Linux'
  else if (/cros/.test(s)) result.os = 'ChromeOS'

  // Device
  if (/ipad|tablet|kindle|silk/.test(s)) result.device = 'tablet'
  else if (/mobile|iphone|android.*mobile|windows phone/.test(s)) result.device = 'mobile'
  else result.device = 'desktop'

  // Browser
  // 顺序很重要：先匹配特征明显的
  if (/edg\//.test(s)) {
    result.browser = 'Edge'
    result.browserVersion = extractVersion(s, /edg\/([\d.]+)/)
  } else if (/opr\/|opera/.test(s)) {
    result.browser = 'Opera'
    result.browserVersion = extractVersion(s, /opr\/([\d.]+)/) || extractVersion(s, /opera\/([\d.]+)/)
  } else if (/firefox|fxios/.test(s)) {
    result.browser = 'Firefox'
    result.browserVersion = extractVersion(s, /firefox\/([\d.]+)/) || extractVersion(s, /fxios\/([\d.]+)/)
  } else if (/chrome|crios/.test(s) && !/chromium/.test(s)) {
    result.browser = 'Chrome'
    result.browserVersion = extractVersion(s, /chrome\/([\d.]+)/) || extractVersion(s, /crios\/([\d.]+)/)
  } else if (/safari/.test(s) && !/chrome/.test(s)) {
    result.browser = 'Safari'
    result.browserVersion = extractVersion(s, /version\/([\d.]+)/) || extractVersion(s, /safari\/([\d.]+)/)
  } else if (/wechat|micromessenger/.test(s)) {
    result.browser = '微信内置'
    result.browserVersion = extractVersion(s, /micromessenger\/([\d.]+)/)
  } else if (/qq\//.test(s)) {
    result.browser = 'QQ 浏览器'
    result.browserVersion = extractVersion(s, /qqbrowser\/([\d.]+)/)
  } else if (/ucbrowser|ucweb/.test(s)) {
    result.browser = 'UC 浏览器'
    result.browserVersion = extractVersion(s, /ucbrowser\/([\d.]+)/)
  } else if (/baidu/.test(s)) {
    result.browser = '百度浏览器'
  } else if (/sogou/.test(s)) {
    result.browser = '搜狗浏览器'
  }

  if (result.bot) {
    result.browser = '爬虫/机器人'
  }

  return result
}

function extractVersion(s: string, re: RegExp): string {
  const m = s.match(re)
  return m && m[1] ? m[1] : ''
}

// 聚合 visit 列表，返回按维度分组的计数
export interface UABreakdown {
  byDevice: { name: string; count: number; color: string }[]
  byBrowser: { name: string; count: number; color: string }[]
  byOS: { name: string; count: number; color: string }[]
}

const DEVICE_COLOR: Record<string, string> = {
  desktop: '#10b981', // emerald-500
  mobile: '#f59e0b', // amber-500
  tablet: '#0ea5e9', // sky-500
}

const BROWSER_COLOR: Record<string, string> = {
  Chrome: '#10b981',
  Edge: '#0ea5e9',
  Safari: '#14b8a6',
  Firefox: '#f59e0b',
  Opera: '#f43f5e',
  '微信内置': '#22c55e',
  'QQ 浏览器': '#06b6d4',
  'UC 浏览器': '#f97316',
  '百度浏览器': '#3b82f6',
  '搜狗浏览器': '#eab308',
  '爬虫/机器人': '#64748b',
  其他: '#94a3b8',
}

const OS_COLOR: Record<string, string> = {
  Windows: '#10b981',
  'Windows 10+': '#059669',
  'Windows 8.1': '#0d9488',
  'Windows 8': '#0f766e',
  'Windows 7': '#115e59',
  macOS: '#14b8a6',
  iOS: '#0ea5e9',
  iPadOS: '#06b6d4',
  Android: '#f59e0b',
  Linux: '#f43f5e',
  ChromeOS: '#64748b',
  其他: '#94a3b8',
}

export function breakdownUA(
  visits: { ua: string | null }[],
): UABreakdown {
  const deviceMap = new Map<string, number>()
  const browserMap = new Map<string, number>()
  const osMap = new Map<string, number>()

  for (const v of visits) {
    const p = parseUA(v.ua)
    deviceMap.set(p.device, (deviceMap.get(p.device) || 0) + 1)
    browserMap.set(p.browser, (browserMap.get(p.browser) || 0) + 1)
    osMap.set(p.os, (osMap.get(p.os) || 0) + 1)
  }

  const toList = (m: Map<string, number>, colors: Record<string, string>) =>
    Array.from(m.entries())
      .map(([name, count]) => ({
        name,
        count,
        color: colors[name] || '#94a3b8',
      }))
      .sort((a, b) => b.count - a.count)

  return {
    byDevice: toList(deviceMap, DEVICE_COLOR),
    byBrowser: toList(browserMap, BROWSER_COLOR),
    byOS: toList(osMap, OS_COLOR),
  }
}
