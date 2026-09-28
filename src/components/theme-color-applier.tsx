// 九四班官网 - 主题色应用器
// 启动时调 /api/access/theme-color 拿当前主色调，动态修改 CSS 变量
// 主色调选项：emerald / teal / rose / amber / sky / violet
// 同时持久化到 localStorage，下次访问先应用本地缓存避免闪烁

'use client'

import { useEffect } from 'react'

export type ThemeColorKey = 'emerald' | 'teal' | 'rose' | 'amber' | 'sky' | 'violet'

const STORAGE_KEY = 'gw94_theme_color'

// 每个主题色的完整调色板（light + dark）
const PALETTES: Record<ThemeColorKey, {
  light: { primary: string; ring: string; accent: string; chart1: string }
  dark: { primary: string; ring: string; accent: string; chart1: string }
}> = {
  emerald: {
    light: { primary: 'oklch(0.62 0.17 162)', ring: 'oklch(0.62 0.17 162)', accent: 'oklch(0.93 0.05 165)', chart1: 'oklch(0.62 0.17 162)' },
    dark: { primary: 'oklch(0.72 0.16 162)', ring: 'oklch(0.72 0.16 162)', accent: 'oklch(0.3 0.03 165)', chart1: 'oklch(0.72 0.16 162)' },
  },
  teal: {
    light: { primary: 'oklch(0.6 0.13 200)', ring: 'oklch(0.6 0.13 200)', accent: 'oklch(0.93 0.04 200)', chart1: 'oklch(0.6 0.13 200)' },
    dark: { primary: 'oklch(0.7 0.13 200)', ring: 'oklch(0.7 0.13 200)', accent: 'oklch(0.3 0.025 200)', chart1: 'oklch(0.7 0.13 200)' },
  },
  rose: {
    light: { primary: 'oklch(0.65 0.21 15)', ring: 'oklch(0.65 0.21 15)', accent: 'oklch(0.93 0.06 15)', chart1: 'oklch(0.65 0.21 15)' },
    dark: { primary: 'oklch(0.7 0.2 15)', ring: 'oklch(0.7 0.2 15)', accent: 'oklch(0.3 0.035 15)', chart1: 'oklch(0.7 0.2 15)' },
  },
  amber: {
    light: { primary: 'oklch(0.7 0.18 70)', ring: 'oklch(0.7 0.18 70)', accent: 'oklch(0.93 0.06 70)', chart1: 'oklch(0.7 0.18 70)' },
    dark: { primary: 'oklch(0.75 0.17 70)', ring: 'oklch(0.75 0.17 70)', accent: 'oklch(0.3 0.035 70)', chart1: 'oklch(0.75 0.17 70)' },
  },
  sky: {
    light: { primary: 'oklch(0.62 0.17 230)', ring: 'oklch(0.62 0.17 230)', accent: 'oklch(0.93 0.05 230)', chart1: 'oklch(0.62 0.17 230)' },
    dark: { primary: 'oklch(0.7 0.15 230)', ring: 'oklch(0.7 0.15 230)', accent: 'oklch(0.3 0.03 230)', chart1: 'oklch(0.7 0.15 230)' },
  },
  violet: {
    light: { primary: 'oklch(0.6 0.2 290)', ring: 'oklch(0.6 0.2 290)', accent: 'oklch(0.93 0.06 290)', chart1: 'oklch(0.6 0.2 290)' },
    dark: { primary: 'oklch(0.7 0.18 290)', ring: 'oklch(0.7 0.18 290)', accent: 'oklch(0.3 0.035 290)', chart1: 'oklch(0.7 0.18 290)' },
  },
}

function applyThemeColor(color: ThemeColorKey, customHex?: string) {
  const palette = PALETTES[color] || PALETTES.emerald
  const isDark = document.documentElement.classList.contains('dark')
  const variant = isDark ? palette.dark : palette.light

  const root = document.documentElement
  // accent 始终用预设（保证对比度）
  root.style.setProperty('--accent', variant.accent)

  // 如果有自定义 hex，覆盖 primary/ring/chart-1（混合模式）
  if (customHex && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(customHex)) {
    root.style.setProperty('--primary', customHex)
    root.style.setProperty('--ring', customHex)
    root.style.setProperty('--chart-1', customHex)
    root.setAttribute('data-theme-color', 'custom')
    root.setAttribute('data-custom-color', customHex)
    return
  }

  // 无自定义 hex，全用预设
  root.style.setProperty('--primary', variant.primary)
  root.style.setProperty('--ring', variant.ring)
  root.style.setProperty('--chart-1', variant.chart1)
  root.setAttribute('data-theme-color', color)
  root.removeAttribute('data-custom-color')
}

export function ThemeColorApplier() {
  useEffect(() => {
    // 1. 先用 localStorage 缓存应用，避免闪烁
    const cached = localStorage.getItem(STORAGE_KEY) as ThemeColorKey | null
    const cachedCustom = localStorage.getItem('gw94_custom_color') || ''
    if (cached && cached in PALETTES) {
      applyThemeColor(cached, cachedCustom || undefined)
    }

    // 2. 拉取最新主题色
    const token = localStorage.getItem('gw94_access_token') || ''
    if (!token) return

    fetch('/api/access/theme-color', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const color = data?.themeColor as ThemeColorKey | undefined
        const custom = (data?.customPrimaryColor as string | undefined) || ''
        if (color && color in PALETTES) {
          applyThemeColor(color, custom || undefined)
          localStorage.setItem(STORAGE_KEY, color)
          if (custom) {
            localStorage.setItem('gw94_custom_color', custom)
          } else {
            localStorage.removeItem('gw94_custom_color')
          }
        }
      })
      .catch(() => {
        // 静默失败，用默认 emerald
      })

    // 3. 监听主题切换（dark/light）时重新应用（因为 dark 调色板不同）
    const observer = new MutationObserver(() => {
      const cur = localStorage.getItem(STORAGE_KEY) as ThemeColorKey | null
      const custom = localStorage.getItem('gw94_custom_color') || ''
      if (cur && cur in PALETTES) {
        applyThemeColor(cur, custom || undefined)
      }
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  return null
}

export const THEME_COLOR_OPTIONS: { value: ThemeColorKey; label: string; swatch: string }[] = [
  { value: 'emerald', label: '翡翠绿', swatch: 'oklch(0.62 0.17 162)' },
  { value: 'teal', label: '青蓝', swatch: 'oklch(0.6 0.13 200)' },
  { value: 'rose', label: '玫瑰红', swatch: 'oklch(0.65 0.21 15)' },
  { value: 'amber', label: '琥珀黄', swatch: 'oklch(0.7 0.18 70)' },
  { value: 'sky', label: '天空蓝', swatch: 'oklch(0.62 0.17 230)' },
  { value: 'violet', label: '紫罗兰', swatch: 'oklch(0.6 0.2 290)' },
]
