// 九四班官网 - 客户端 Providers：next-themes + sonner Toaster + @tanstack/react-query
// 在 layout.tsx 的 <body> 内包裹 children

'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  // 单例 QueryClient，避免每次 render 重建；SSR 安全（lazy 初始化）
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>
        {children}
        <SonnerToaster position="top-center" richColors closeButton />
      </QueryClientProvider>
    </NextThemesProvider>
  )
}
