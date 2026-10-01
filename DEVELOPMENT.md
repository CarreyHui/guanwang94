# 九四班官网（Guanwang94）完整开发文档

> **版本**：2.0 · **最后更新**：2026-10-01 · **项目代号**：Guanwang94
> **技术栈**：Next.js 16 + TypeScript 5 + Prisma 6 + SQLite + Tailwind CSS 4 + shadcn/ui
> **部署平台**：Vercel（免费版）+ Turso（SQLite 云数据库）
> **域名**：guanwang94.saozi.cc.cd（Cloudflare DNS 托管）

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈详解](#2-技术栈详解)
3. [项目目录结构](#3-项目目录结构)
4. [数据模型（Prisma Schema）](#4-数据模型prisma-schema)
5. [API 接口文档（35 个路由）](#5-api-接口文档35-个路由)
6. [前端组件清单（80 个组件）](#6-前端组件清单80-个组件)
7. [鉴权机制](#7-鉴权机制)
8. [主题系统](#8-主题系统)
9. [PWA 离线支持](#9-pwa-离线支持)
10. [SEO 与 RSS](#10-seo-与-rss)
11. [手机端适配](#11-手机端适配)
12. [部署教程](#12-部署教程)
13. [环境变量](#13-环境变量)
14. [已知问题与风险](#14-已知问题与风险)
15. [开发命令速查](#15-开发命令速查)

---

## 1. 项目概述

### 1.1 项目目标
为九四班搭建一个班级官方网站，功能包括：
- 班级重要事件发布与管理
- 班级风采相册展示
- 表白墙互动（5 种类型 + emoji 反应）
- 留言给管理员（含管理员回复）
- 事件归档时间线
- 关于我们（可编辑）
- 趣味跳转磁贴（多网站跳转）
- 站点访问统计
- 管理员后台（7 个 Tab）
- PWA 离线支持
- 暗色主题
- 自定义主题色

### 1.2 用户角色

| 角色 | 权限 |
|---|---|
| 未通过门控访客 | 只看到访问门控 Modal |
| 普通访客（已通过门控） | 浏览全部内容 + 发帖 + 留言 + 点赞 |
| 管理员（已通过门控 + 登录） | 普通访客权限 + 后台管理（7 Tab） |

### 1.3 默认凭据
- 访问令牌：`1234`
- 管理员账号：`CarreyHui`
- 管理员密码：`syh20120509`

---

## 2. 技术栈详解

### 2.1 核心框架
| 技术 | 版本 | 用途 |
|---|---|---|
| Next.js | 16.1.3 | 全栈框架（App Router） |
| React | 19.0.0 | UI 库 |
| TypeScript | 5.x | 类型安全 |
| Tailwind CSS | 4.x | 原子化 CSS |
| shadcn/ui | New York | UI 组件库（基于 Radix UI） |

### 2.2 数据与状态
| 技术 | 版本 | 用途 |
|---|---|---|
| Prisma | 6.19.2 | ORM |
| SQLite | - | 数据库（开发用本地文件，部署用 Turso 云） |
| Zustand | 5.0.6 | 客户端全局状态 |
| @tanstack/react-query | 5.82.0 | 服务端状态管理 |

### 2.3 UI 与交互
| 技术 | 版本 | 用途 |
|---|---|---|
| lucide-react | 0.525.0 | 图标库 |
| framer-motion | 12.23.2 | 动画 |
| recharts | 2.15.4 | 图表（折线/柱状） |
| react-markdown | 10.1.0 | Markdown 渲染 |
| remark-gfm | 4.0.1 | GFM 扩展（表格/删除线/任务列表） |
| sonner | 2.0.6 | Toast 通知 |
| next-themes | 0.4.6 | 主题切换 |

### 2.4 其他
| 技术 | 用途 |
|---|---|
| date-fns | 日期格式化 |
| uuid | ID 生成 |
| next-intl | 国际化（预留） |

### 2.5 依赖清单（package.json 关键依赖）
```
"dependencies": {
  "next": "^16.1.1",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "prisma": "^6.11.1",
  "@prisma/client": "^6.11.1",
  "zustand": "^5.0.6",
  "@tanstack/react-query": "^5.82.0",
  "framer-motion": "^12.23.2",
  "lucide-react": "^0.525.0",
  "recharts": "^2.15.4",
  "react-markdown": "^10.1.0",
  "remark-gfm": "^4.0.1",
  "sonner": "^2.0.6",
  "next-themes": "^0.4.6",
  "tailwindcss": "^4",
  "date-fns": "^4.1.0",
  "uuid": "^11.1.0"
}
```

---

## 3. 项目目录结构

```
my-project/
├── prisma/
│   └── schema.prisma              # Prisma 数据模型（9 个 model）
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # 35 个 API 路由
│   │   │   ├── about/              # 关于我们 GET/PUT
│   │   │   ├── access/             # 访问令牌 + 站点配置 + 主题色
│   │   │   ├── auth/               # 管理员登录/登出/session
│   │   │   ├── confessions/        # 表白墙 CRUD + 点赞 + 反应 + 热榜
│   │   │   ├── events/             # 事件 CRUD + 置顶 + 标签 + iCal
│   │   │   ├── fun-links/          # 趣味跳转磁贴 CRUD
│   │   │   ├── messages/           # 留言 CRUD + 点赞
│   │   │   ├── stats/              # 统计 8 个子路由
│   │   │   ├── track/              # 访问上报
│   │   │   └── route.ts             # Hello World（健康检查）
│   │   ├── error.tsx               # 全局运行时错误边界
│   │   ├── globals.css            # 全局样式 + 主题变量 + 工具类
│   │   ├── layout.tsx             # 根布局 + generateMetadata
│   │   ├── loading.tsx            # 路由级 loading
│   │   ├── manifest.webmanifest/  # PWA manifest
│   │   ├── not-found.tsx          # 品牌化 404
│   │   ├── page.tsx               # 唯一用户可见路由 /
│   │   ├── robots.txt/            # SEO robots
│   │   ├── rss.xml/               # RSS 订阅
│   │   └── sitemap.xml/           # Sitemap
│   ├── components/                # 80 个组件
│   │   ├── admin/                 # 后台 7 个 Tab 组件
│   │   ├── sections/              # 前台 8 个 Section 组件
│   │   ├── ui/                    # shadcn/ui 基础组件（48 个）
│   │   ├── access-gate.tsx        # 访问门控 Modal
│   │   ├── admin-login-modal.tsx  # 管理员登录 Modal
│   │   ├── admin-panel.tsx        # 后台主面板（Dialog）
│   │   ├── empty-state.tsx        # 空状态 + 骨架屏
│   │   ├── hero.tsx               # Hero 区
│   │   ├── lazy-image.tsx         # 懒加载图片
│   │   ├── lightbox.tsx           # 图片 Lightbox
│   │   ├── providers.tsx          # next-themes + react-query + sonner
│   │   ├── reading-progress.tsx   # 阅读进度条 + 返回顶部
│   │   ├── scroll-reveal.tsx      # 滚动渐显动画
│   │   ├── site-footer.tsx        # Footer
│   │   ├── site-header.tsx        # Header（sticky + 移动端 Sheet）
│   │   ├── sw-register.tsx        # Service Worker 注册
│   │   ├── theme-color-applier.tsx # 主题色应用器
│   │   └── theme-toggle.tsx       # 主题切换
│   ├── lib/                        # 工具库
│   │   ├── api.ts                 # 前端 API 封装（所有接口）
│   │   ├── auth.ts                # 鉴权工具（HMAC token + checkAccess/Admin）
│   │   ├── db.ts                  # Prisma Client 单例
│   │   ├── format.ts              # 日期/时间格式化 + 阅读时间 + TOC
│   │   ├── ical.ts                # iCal 日历生成
│   │   ├── seed.ts                # 种子数据脚本
│   │   ├── types.ts               # 前端类型定义
│   │   ├── ua.ts                  # UA 解析（浏览器/OS/设备）
│   │   └── utils.ts               # cn() 工具
│   └── store/                     # Zustand 状态
│       ├── use-admin-panel.ts     # 后台面板开关 + Tab + 编辑事件
│       ├── use-app-store.ts       # 全局状态（accessPassed/isAdmin/theme）
│       └── use-event-modal.ts     # 事件详情 Modal 全局状态
├── public/                        # 静态资源
│   ├── favicon.svg                # 站点图标
│   ├── logo.svg                   # Logo
│   ├── offline.html               # PWA 离线兜底页
│   └── sw.js                      # Service Worker
├── prisma/
│   └── schema.prisma              # 数据模型
├── .env                           # 环境变量
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── Caddyfile                      # 沙箱网关配置
└── DEPLOY.md                      # 部署教程
```

---

## 4. 数据模型（Prisma Schema）

### 4.1 完整 Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// 班级事件
model Event {
  id          String   @id @default(cuid())
  title       String
  summary     String
  content     String                    // Markdown 正文
  coverImage  String?                   // 封面图 URL
  category    String   @default("班级活动")  // 班级活动/学习通知/重要公告/校园新闻
  priority    String   @default("normal")  // normal/high
  pinned      Int      @default(0)
  tags        String   @default("")       // 逗号分隔
  publishedAt DateTime @default(now())
  viewCount   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
  @@index([pinned])
  @@index([publishedAt])
}

// 留言
model Message {
  id        String   @id @default(cuid())
  nickname  String
  content   String
  contact   String?                     // 联系方式（仅管理员可见）
  ipHash    String?
  likes     Int      @default(0)
  parentId  String?                     // 回复的父留言 ID
  replyRole String   @default("user")    // user/admin
  createdAt DateTime @default(now())

  @@index([parentId])
}

// 表白墙
model Confession {
  id        String   @id @default(cuid())
  nickname  String   @default("匿名同学")
  content   String
  type      String   @default("confession") // confession/thanks/bless/complain/wish
  color     String   @default("rose")       // rose/amber/emerald/orange/sky
  likes     Int      @default(0)
  ipHash    String?
  createdAt DateTime @default(now())

  reactions ConfessionReaction[]

  @@index([type])
}

// 表白墙 emoji 反应
model ConfessionReaction {
  id           String   @id @default(cuid())
  confessionId String
  emoji        String                     // 👍❤️🎉🚀😢😮
  ipHash       String?
  createdAt    DateTime @default(now())

  confession Confession @relation(fields: [confessionId], references: [id], onDelete: Cascade)

  @@unique([confessionId, ipHash, emoji])
  @@index([confessionId])
}

// 访问记录
model Visit {
  id        String   @id @default(cuid())
  path      String?
  ipHash    String?
  ua        String?                     // User-Agent
  referrer  String?
  visitedAt DateTime @default(now())

  @@index([visitedAt])
}

// 站点配置
model SiteConfig {
  id                 String   @id @default("default")
  accessToken        String   @default("1234")
  siteTitle          String   @default("九四班官网 · Guanwang94")
  siteDescription    String   @default("志存高远 · 脚踏实地 · 团结奋进")
  logoUrl            String?
  ogImageUrl         String?
  themeColor         String   @default("emerald")  // emerald/teal/rose/amber/sky/violet
  customPrimaryColor String?                     // 自定义 hex 颜色
  updatedAt          DateTime @updatedAt
}

// 趣味跳转磁贴
model FunLink {
  id          String   @id @default(cuid())
  title       String
  url         String
  description String?
  icon        String   @default("Sparkles")  // 18 种 lucide icon
  color       String   @default("amber")     // 7 色
  order       Int      @default(0)
  enabled     Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([enabled, order])
}

// 关于我们配置
model AboutConfig {
  id               String   @id @default("default")
  className        String   @default("九四班")
  slogan           String   @default("志存高远 · 脚踏实地 · 团结奋进")
  intro            String?
  headTeacher      String?
  headTeacherQuote String?
  classCommittee   String?  // 逗号/换行分隔
  contact          String?  // 逗号/换行分隔
  updatedAt        DateTime @updatedAt
}

// 管理员会话（预留，当前用无状态 HMAC token）
model AdminSession {
  token     String   @id
  username  String
  createdAt DateTime @default(now())
  expiresAt DateTime
}
```

### 4.2 表关系图

```
Event (8 fields) ── 无关联
Message (8 fields) ── parentId 自关联（留言→回复）
Confession (8 fields) ──< ConfessionReaction (5 fields)
Visit (6 fields) ── 无关联
SiteConfig (9 fields) ── 单行配置
FunLink (9 fields) ── 无关联
AboutConfig (9 fields) ── 单行配置
AdminSession (4 fields) ── 预留
```

---

## 5. API 接口文档（35 个路由）

### 5.1 鉴权

| 方法 | 路径 | 权限 | 用途 |
|---|---|---|---|
| POST | `/api/auth/login` | 公开 | 管理员登录，返回 admin token |
| POST | `/api/auth/logout` | 已登录 | 登出 |
| GET | `/api/auth/session` | 公开 | 查询当前 admin + access 状态 |
| POST | `/api/access/verify` | 公开 | 校验访问令牌，返回 signed access token |
| GET | `/api/access/token` | 管理员 | 取当前访问令牌 |
| PUT | `/api/access/token` | 管理员 | 修改访问令牌 |
| GET | `/api/access/site-config` | 管理员 | 取完整站点配置（标题/描述/Logo/OG/主题色） |
| PUT | `/api/access/site-config` | 管理员 | 更新站点配置 |
| GET | `/api/access/theme-color` | access | 取当前主题色 + 自定义 hex |

### 5.2 事件

| 方法 | 路径 | 权限 | 用途 |
|---|---|---|---|
| GET | `/api/events` | access | 事件列表（category/q/tag/priority/sort/pinnedOnly/page/pageSize） |
| POST | `/api/events` | 管理员 | 创建事件 |
| GET | `/api/events/[id]` | access | 事件详情（viewCount +1） |
| PUT | `/api/events/[id]` | 管理员 | 更新事件 |
| DELETE | `/api/events/[id]` | 管理员 | 删除事件 |
| PATCH | `/api/events/[id]/pin` | 管理员 | 切换置顶 |
| GET | `/api/events/tags` | access | 标签云（去重 + 计数，最多 15） |
| GET | `/api/events/ical` | access | iCal 日历文件下载 |

### 5.3 留言

| 方法 | 路径 | 权限 | 用途 |
|---|---|---|---|
| GET | `/api/messages` | access | 留言列表（q/sort/page/pageSize，含嵌套回复） |
| POST | `/api/messages` | access | 创建留言 |
| PUT | `/api/messages` | 管理员 | 管理员回复留言 |
| DELETE | `/api/messages/[id]` | 管理员 | 删除留言（级联删回复） |
| PATCH | `/api/messages/like` | access | 点赞 +1 |

### 5.4 表白墙

| 方法 | 路径 | 权限 | 用途 |
|---|---|---|---|
| GET | `/api/confessions` | access | 列表（type/sort/page/pageSize，含 reactionCounts） |
| POST | `/api/confessions` | access | 发布表白 |
| PATCH | `/api/confessions/like` | access | 点赞 +1 |
| PATCH | `/api/confessions/react` | access | 切换 emoji 反应（6 种） |
| DELETE | `/api/confessions/delete` | 管理员 | 删除（?id=） |
| GET | `/api/confessions/top` | access | 热榜（days/limit/type/sort） |

### 5.5 趣味跳转

| 方法 | 路径 | 权限 | 用途 |
|---|---|---|---|
| GET | `/api/fun-links` | access | 磁贴列表（enabled=1，按 order） |
| POST | `/api/fun-links` | 管理员 | 创建磁贴 |
| PUT | `/api/fun-links/[id]` | 管理员 | 更新磁贴 |
| DELETE | `/api/fun-links/[id]` | 管理员 | 删除磁贴 |

### 5.6 关于我们

| 方法 | 路径 | 权限 | 用途 |
|---|---|---|---|
| GET | `/api/about` | access | 取配置 |
| PUT | `/api/about` | 管理员 | 更新（7 字段） |

### 5.7 统计

| 方法 | 路径 | 权限 | 用途 |
|---|---|---|---|
| GET | `/api/stats/overview` | 管理员 | 总览（事件/访问/留言/今日访问） |
| GET | `/api/stats/trend` | 管理员 | 近 N 天趋势（visits/messages） |
| GET | `/api/stats/top-events` | 管理员 | 浏览量 Top N 事件 |
| GET | `/api/stats/recent-visits` | 管理员 | 最近 N 条访问记录 |
| GET | `/api/stats/public` | access | 公开统计（事件/留言/访问数） |
| GET | `/api/stats/hourly` | 管理员 | 24 小时分布 + 7×24 热力图 |
| GET | `/api/stats/top-paths` | 管理员 | 热门路径 Top N |
| GET | `/api/stats/top-referrers` | 管理员 | 热门来源 Top N |
| GET | `/api/stats/visitor-types` | 管理员 | 新访客 vs 回访 |
| GET | `/api/stats/weekly-comparison` | 管理员 | 本周 vs 上周同比 |

### 5.8 上报 + SEO

| 方法 | 路径 | 权限 | 用途 |
|---|---|---|---|
| POST | `/api/track` | access | 上报访问（path/ipHash/ua/referrer） |
| GET | `/rss.xml` | 公开 | RSS 2.0（最近 20 条事件） |
| GET | `/sitemap.xml` | 公开 | Sitemap（首页 + 事件直链） |
| GET | `/robots.txt` | 公开 | Robots |
| GET | `/manifest.webmanifest` | 公开 | PWA manifest |

### 5.9 鉴权 Header 规范

```
# 普通访客（access）
Authorization: Bearer <signed-access-token>

# 管理员（admin）
x-admin-session: <signed-admin-token>

# 两者可共存（管理员也是访客）
Authorization: Bearer <access>
x-admin-session: <admin>
```

---

## 6. 前端组件清单（80 个组件）

### 6.1 前台 Section 组件（src/components/sections/）

| 组件 | 功能 |
|---|---|
| `FunLinksSection` | 趣味跳转磁贴网格（2/3/4 列响应式） |
| `EventsSection` | 重要事件区（分类 Tabs + 搜索 + 标签云 + 高级筛选 + 置顶横幅 + 卡片瀑布流 + 无限加载） |
| `EventDetailModal` | 事件详情 Modal（Markdown GFM + TOC + 阅读时间 + 相关推荐 + 翻页 + QR 分享 + iCal 下载 + 打印） |
| `GallerySection` | 班级相册（12 图 + 分类筛选 + 瀑布流 + Lightbox） |
| `ConfessionSection` | 表白墙（5 类型 + 表单 + emoji 反应 + 防重复 + 无限加载） |
| `ConfessionTopBar` | 表白墙热榜（时间维度切换 + 类型筛选 + 排序切换 + Top 3 奖牌） |
| `MessageSection` | 留言（表单 + 搜索 + 高亮 + 嵌套回复 + 无限加载） |
| `ArchiveSection` | 事件归档时间线（按月分组 + 折叠 + iCal 下载） |
| `AboutSection` | 关于我们（7 字段 + 管理员编辑按钮） |
| `AboutEditModal` | 关于我们编辑 Modal（7 字段表单） |

### 6.2 后台 Tab 组件（src/components/admin/）

| 组件 | 功能 |
|---|---|
| `DashboardTab` | 数据看板（4 数字卡 + 同比 + 趋势折线 + Top10 柱状 + 热力图 + 最佳时段 + UA 分布 + 热门路径 + 热门来源 + 新访客 vs 回访 + 最近访问表格） |
| `PublishFormTab` | 发布/编辑事件表单（9 字段 + 标签预览 + 封面预览） |
| `ManageEventsTab` | 管理事件（表格 + 全选 + 6 种批量操作 + 分页） |
| `ManageMessagesTab` | 管理留言（表格 + 内联回复 + 删除） |
| `ManageConfessionsTab` | 管理表白墙（表格 + 删除） |
| `FunLinksTab` | 趣味跳转管理（磁贴 CRUD + 编辑 Dialog + 删除确认） |
| `TokenSettingsTab` | 站点配置（访问令牌 + SEO 配置 + 主题色 6 选 1 + 自定义 hex + Logo/OG 预览） |

### 6.3 全局组件

| 组件 | 功能 |
|---|---|
| `SiteHeader` | 顶部导航（sticky + 滚动阴影 + 桌面导航 + 移动端 Sheet + 主题切换 + 管理员登录/后台/退出） |
| `Hero` | Hero 区（视差背景 + 浮动光晕 + 网格装饰 + 4 统计数字计数动画 + 2 CTA） |
| `SiteFooter` | Footer（emerald 渐变 + 装饰光晕 + 渐变装饰条 + RSS/关于/留言链接） |
| `ReadingProgress` | 顶部 3px 渐变进度条 + 返回顶部圆形按钮 |
| `AccessGate` | 访问门控全屏 Modal（不可 ESC/外部关闭） |
| `AdminLoginModal` | 管理员登录 Modal |
| `AdminPanel` | 后台主面板（Dialog 全屏覆盖 + 左侧 7 Tab 导航 + 右侧内容滚动） |
| `Providers` | next-themes + react-query QueryClientProvider + sonner Toaster |
| `ThemeColorApplier` | 主题色应用器（6 预设 + 自定义 hex 混合模式 + MutationObserver 监听 dark/light） |
| `ThemeToggle` | 主题切换下拉（浅色/深色/跟随系统） |
| `LazyImage` | 懒加载图片（shimmer 占位 + onError 兜底 + 加载淡入） |
| `Lightbox` | 图片 Lightbox（上一张/下一张/关闭 + 键盘 + 索引显示） |
| `EmptyState` | 空状态（5 种 icon）+ 骨架屏（EventCard/PinnedBanner/Row/Card） |
| `ScrollReveal` | 滚动渐显动画（useInView + motion） |
| `SWRegister` | Service Worker 注册器（仅生产环境 + 新版本检测） |

### 6.4 shadcn/ui 基础组件（48 个）

accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input-otp, input, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle-group, toggle, tooltip

### 6.5 工具库（src/lib/）

| 文件 | 功能 |
|---|---|
| `api.ts` | 前端 API 封装（所有接口的 TypeScript 函数） |
| `auth.ts` | 鉴权工具（HMAC-SHA256 签名/验证 + checkAccess/checkAdmin + hashIp） |
| `db.ts` | Prisma Client 单例（避免开发模式热重载创建多实例） |
| `format.ts` | 日期格式化 + 相对时间 + 阅读时间 + TOC 提取 + parseList |
| `ical.ts` | iCal RFC 5545 生成器 + eventToICal 转换 |
| `seed.ts` | 种子数据脚本（8 事件 + 6 表白 + 4 留言 + 30 访问） |
| `types.ts` | 前端类型定义（Event/Message/Confession/AboutConfig 等） |
| `ua.ts` | UA 解析（12 浏览器 + 11 OS + 3 设备 + bot 检测 + breakdownUA 聚合） |
| `utils.ts` | cn() 类名合并工具 |

### 6.6 状态管理（src/store/）

| Store | 功能 |
|---|---|
| `useAppStore` | 全局状态（accessPassed/isAdmin/adminUsername/theme + persist theme） |
| `useAdminPanel` | 后台面板开关 + activeTab（7 种）+ editingEventId |
| `useEventModal` | 事件详情 Modal 全局状态（open/selectedId + openEvent/closeEvent） |

---

## 7. 鉴权机制

### 7.1 双重校验

```
访客请求 → Authorization: Bearer <signed-access-token> → checkAccess()
管理员请求 → x-admin-session: <signed-admin-token> → checkAdmin()
```

### 7.2 Token 签名

- 算法：HMAC-SHA256
- 密钥：环境变量 `JWT_SECRET`（默认 fallback 值在代码里）
- Access token TTL：30 天
- Admin session TTL：7 天
- Payload：`{ token/username, exp, role? }` → base64url + signature

### 7.3 Token 存储

| Token | localStorage Key | 用途 |
|---|---|---|
| access token | `gw94_access_token` | 门控通过后存储 |
| admin token | `gw94_admin_token` | 管理员登录后存储 |
| admin username | `gw94_admin_username` | 显示用户名 |
| theme color | `gw94_theme_color` | 主题色缓存 |
| custom color | `gw94_custom_color` | 自定义 hex 缓存 |
| 点赞防重复 | `gw94_confession_liked_<id>` / `gw94_message_liked_<id>` | localStorage 软防刷 |

### 7.4 Token 失效处理

- 401/403 → `api.ts` 自动 `clearAccessToken()` + `dispatchEvent('gw94:access-lost')`
- `AccessGate` 监听 `gw94:access-lost` 事件重新弹出

---

## 8. 主题系统

### 8.1 三层主题

1. **暗色/浅色**：next-themes（attribute="class" + html.dark）
2. **预设主题色**：6 种（emerald/teal/rose/amber/sky/violet），通过 CSS 变量
3. **自定义 hex**：管理员可输入任意 hex 颜色覆盖 primary/ring/chart-1

### 8.2 CSS 变量

```css
:root {
  --primary: oklch(0.62 0.17 162);      /* emerald-600 */
  --ring: oklch(0.62 0.17 162);
  --accent: oklch(0.93 0.05 165);
  --chart-1: oklch(0.62 0.17 162);
  /* ... */
}

.dark {
  --background: oklch(0.16 0.012 165);  /* emerald 色相暖色暗色板 */
  --primary: oklch(0.72 0.16 162);
  /* ... */
}
```

### 8.3 ThemeColorApplier 逻辑

```
1. 启动时读 localStorage 缓存应用（避免闪烁）
2. fetch /api/access/theme-color 拿最新
3. 有 customHex → 覆盖 primary/ring/chart-1（accent 仍用预设保证对比度）
4. 无 customHex → 全用预设调色板
5. MutationObserver 监听 html class 变化（dark/light 切换时重新应用 dark 调色板）
```

---

## 9. PWA 离线支持

### 9.1 Service Worker（public/sw.js）

| 资源类型 | 缓存策略 |
|---|---|
| 静态资源（_next/static/图片/css） | Cache First + stale-while-revalidate |
| API GET 请求 | Network First，失败回退缓存 |
| HTML 页面 | Network First，失败回退 /offline.html |
| 外链（picsum.photos） | Cache First 不阻塞 |
| POST/PUT/DELETE | 不缓存，直接放行 |

### 9.2 离线兜底页（public/offline.html）

emerald 主题 + 在线检测自动重载 + 重试按钮 + 回首页按钮

### 9.3 SW 注册器（src/components/sw-register.tsx）

- 仅生产环境注册（避免 HMR 干扰）
- `updatefound` 检测新版本 → toast 提示刷新

---

## 10. SEO 与 RSS

### 10.1 动态 Metadata（layout.tsx）

```typescript
export const revalidate = 3600; // ISR 1 小时

export async function generateMetadata(): Promise<Metadata> {
  // 从 DB 读 SiteConfig → 动态返回 title/description/OG/twitter/robots
}
```

### 10.2 JSON-LD 结构化数据

Organization + WebSite（含 SearchAction）+ WebPage schema，注入 `<script type="application/ld+json">`

### 10.3 RSS（/rss.xml）

RSS 2.0 XML，最近 20 条事件，Content-Type: application/rss+xml

### 10.4 Sitemap（/sitemap.xml）

首页 + 所有事件直链（最多 100 条）

### 10.5 Robots（/robots.txt）

```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://guanwang94.saozi.cc.cd/sitemap.xml
```

---

## 11. 手机端适配

### 11.1 响应式断点

| 断点 | 宽度 | 典型设备 |
|---|---|---|
| 默认 | < 640px | 手机（375px iPhone X） |
| sm | ≥ 640px | 大手机 / 小平板 |
| md | ≥ 768px | 平板 |
| lg | ≥ 1024px | 桌面 |

### 11.2 关键适配

| 组件 | 手机端 | 桌面端 |
|---|---|---|
| Header 导航 | Sheet 抽屉 | 水平导航 |
| Hero | min-h-[60vh] | min-h-[78vh] |
| 事件卡片 | 1 列 | 3 列 |
| 相册 | 2 列 | 4 列 |
| 表白墙 | 1 列 | 2 列 |
| 趣味跳转磁贴 | 2 列 | 4 列 |
| 后台 Dialog | max-h-[85vh] | max-h-[90vh] |
| 后台导航 | 横向滚动 | 垂直侧栏 |
| 触摸目标 | 最小 44px（h-11） | - |

---

## 12. 部署教程

### 12.1 部署架构

```
访客浏览器 → Cloudflare DNS → Vercel Edge CDN → Next.js App (Serverless)
                                                    ↓
                                                Turso (libsql SQLite 云数据库)
```

### 12.2 前置准备

1. **GitHub 账号**：https://github.com
2. **Vercel 账号**：https://vercel.com（用 GitHub 登录）
3. **Turso 账号**：https://turso.tech（用 GitHub 登录）
4. **Cloudflare 账号**（你已有，域名托管在这里）

### 12.3 推代码到 GitHub

```bash
cd my-project
git init
git add .
git commit -m "feat: 九四班官网初始化"
git remote add origin https://github.com/你的用户名/guanwang94.git
git branch -M main
git push -u origin main
```

### 12.4 创建 Turso 云数据库

1. 打开 https://app.turso.tech
2. **Databases** → **New database**
3. Name: `guanwang94`
4. Location: `nrt`（东京）或 `hkg`（香港）
5. 创建后复制：
   - **Database URL**：`libsql://guanwang94-你的用户名.turso.io`
   - **Auth Token**：`eyJhbGciOiJF...`

### 12.5 部署到 Vercel

1. 打开 https://vercel.com/dashboard
2. **Add New...** → **Project**
3. 找到 `guanwang94` 仓库 → **Import**
4. **Environment Variables** 填 6 个：

| Name | Value |
|---|---|
| `DATABASE_URL` | `libsql://guanwang94-你的用户名.turso.io` |
| `DATABASE_AUTH_TOKEN` | Turso Auth Token |
| `ADMIN_USERNAME` | `CarreyHui` |
| `ADMIN_PASSWORD` | `syh20120509`（建议改成强密码） |
| `JWT_SECRET` | `openssl rand -hex 32` 生成 32 位 hex |
| `NEXT_PUBLIC_SITE_URL` | `https://guanwang94.saozi.cc.cd` |

5. 点 **Deploy** → 90 秒后完成

### 12.6 初始化数据库

```bash
# 本地临时指向 Turso
export DATABASE_URL="libsql://guanwang94-你的用户名.turso.io"
export DATABASE_AUTH_TOKEN="你的 Turso Auth Token"

# 推 schema
bun run db:push

# 灌种子数据
bun run src/lib/seed.ts
```

### 12.7 绑定自定义域名

1. Vercel → 项目 → **Settings** → **Domains**
2. 输入 `guanwang94.saozi.cc.cd` → **Add**
3. Vercel 显示 CNAME 值：`cname.vercel-dns.com`

### 12.8 Cloudflare DNS 配置

1. https://dash.cloudflare.com → `saozi.cc.cd`
2. **DNS** → **Records** → **Add record**
3. Type: `CNAME`，Name: `guanwang94`，Target: `cname.vercel-dns.com`
4. Proxy status: **DNS only（灰色云朵）** ← 重要！
5. 保存 → 等 1-5 分钟 Vercel 自动签发 SSL

### 12.9 访问验证

打开 `https://guanwang94.saozi.cc.cd` → 输入 `1234` → 进入官网

---

## 13. 环境变量

| 变量 | 必填 | 默认值 | 用途 |
|---|---|---|---|
| `DATABASE_URL` | ✅ | `file:./db/custom.db` | 数据库连接（本地 file: / Turso libsql:） |
| `DATABASE_AUTH_TOKEN` | Turso 时必填 | - | Turso Auth Token |
| `ADMIN_USERNAME` | 可选 | `CarreyHui` | 管理员账号 |
| `ADMIN_PASSWORD` | 可选 | `syh20120509` | 管理员密码 |
| `JWT_SECRET` | 可选 | 代码内 fallback | Token 签名密钥（**生产环境必须改**） |
| `NEXT_PUBLIC_SITE_URL` | 可选 | `https://guanwang94.saozi.cc.cd` | 站点完整 URL（RSS/sitemap/OG） |

---

## 14. 已知问题与风险

| 问题 | 影响 | 解决方案 |
|---|---|---|
| 沙箱 Turbopack 编译 API 极慢 | 开发体验 | 用 `bun x next dev -p 3000 --webpack` |
| 事件详情翻页最多 250 条 | 超过 250 事件翻页不完整 | 班级站量小无影响 |
| 新访客 vs 回访基于 ipHash | 同 IP 不同设备判为回访 | 班级站场景合理 |
| QR 码用第三方服务 | 离线不可用 | 班级站在线场景 |
| 主题色 Applier 仅客户端 | SSR 首屏可能短暂闪烁 | localStorage 缓存缓解 |
| 批量操作 Promise.all | 事件多时打满连接池 | 班级站量小无影响 |
| 后台 listFunLinks 仅 enabled=1 | admin 看不到 disabled 磁贴 | 可加 admin 专用 list all |
| Service Worker 仅生产注册 | 开发模式无法验证 SW | sw.js 文件可访问 |
| 动态 metadata revalidate=3600 | 1 小时内修改不立即反映 | ISR 缓存策略 |
| 热力图移动端可能横向滚动 | 窄屏 | 已加 overflow-x-auto |

---

## 15. 开发命令速查

```bash
# 安装依赖
bun install

# 启动开发服务器（webpack 模式，避免 Turbopack 慢）
bun x next dev -p 3000 --webpack

# 启动开发服务器（Turbopack 模式，不推荐）
bun run dev

# 代码检查
bun run lint

# 类型检查
bunx tsc --noEmit

# 推 schema 到数据库
bun run db:push

# 重新生成 Prisma Client
bun run db:generate

# 运行种子数据
bun run src/lib/seed.ts

# 安装新依赖
bun add <package-name>

# 生产构建（不要在沙箱跑）
bun run build

# 启动生产服务器
bun run start
```

---

## 附录 A：管理员后台 7 个 Tab

| Tab | 图标 | 功能 |
|---|---|---|
| 数据看板 | LayoutDashboard | 4 数字卡 + 同比 + 趋势 + Top10 + 热力图 + 最佳时段 + UA + 路径 + 来源 + 新回访 + 访问表 |
| 发布事件 | Megaphone | 9 字段表单（标题/摘要/正文/封面/分类/优先级/标签/时间/置顶） |
| 管理事件 | ListChecks | 表格 + 全选 + 6 批量操作（置顶/取消/删除/改分类/改优先级/改时间/改标签） |
| 管理留言 | MessageSquare | 表格 + 内联回复 + 删除 |
| 管理表白墙 | Heart | 表格 + 删除 |
| 趣味跳转 | Sparkles | 磁贴 CRUD + 编辑 Dialog + 启用开关 + 删除确认 |
| 站点配置 | Settings | 访问令牌 + SEO 配置 + 主题色 6 选 1 + 自定义 hex + Logo/OG |

## 附录 B：趣味跳转磁贴配置

| 字段 | 说明 |
|---|---|
| 标题 | 磁贴显示名称（≤50 字符） |
| 跳转网址 | 必须 http/https 开头 |
| 描述 | 选填（≤200 字符） |
| 图标 | 18 种 lucide icon 可选 |
| 颜色 | 7 色渐变可选 |
| 顺序 | 数字越小越靠前 |
| 启用 | 开关控制显示/隐藏 |

## 附录 C：表白墙 5 种类型

| 类型 | emoji | 颜色 | 说明 |
|---|---|---|---|
| 表白 | 💗 | rose | 表达心意 |
| 感谢 | 🙏 | amber | 感谢他人 |
| 祝福 | 🌈 | emerald | 祝福班级 |
| 吐槽 | 😤 | orange | 吐槽不满 |
| 心愿 | ⭐ | sky | 许下心愿 |

## 附录 D：表白墙 6 种 emoji 反应

```
👍 ❤️ 🎉 🚀 😢 😮
```

防重复：localStorage `gw94_confession_liked_<id>` + `@@unique([confessionId, ipHash, emoji])`

---

## 附录 E：事件高级筛选

| 参数 | 值 | 说明 |
|---|---|---|
| `category` | 全部/班级活动/学习通知/重要公告/校园新闻 | 分类筛选 |
| `q` | 任意文本 | 搜索标题/摘要 |
| `tag` | 标签名 | 标签筛选 |
| `priority` | all/high/normal | 优先级筛选 |
| `sort` | default/latest/oldest/popular/pinned | 排序方式 |
| `pinnedOnly` | 0/1 | 仅看置顶 |

URL hash 持久化：`#events?c=...&q=...&t=...&p=...&s=...&pi=1`

---

## 附录 F：后台批量操作（6 种）

| 操作 | 图标 | 颜色 | 说明 |
|---|---|---|---|
| 批量置顶 | Pin | emerald | 切换为置顶状态 |
| 取消置顶 | PinOff | 默认 | 切换为非置顶 |
| 批量删除 | Trash2 | rose | AlertDialog 确认 |
| 批量改分类 | FolderEdit | sky | Select 4 分类 |
| 批量改优先级 | Flag | amber | Select 高/普通 |
| 批量改时间 | CalendarClock | violet | datetime-local + 3 快捷按钮 |
| 批量改标签 | Tags | teal | Input + 覆盖/追加模式 + 预览 |

---

## 附录 G：访问统计 Dashboard 组件

| 组件 | 数据源 | 显示 |
|---|---|---|
| 4 数字卡 | `/api/stats/overview` | 总事件/总访问/总留言/今日访问 |
| 本周 vs 上周同比 | `/api/stats/weekly-comparison` | 双数字卡 + 同比 badge + 进度条 |
| 趋势折线图 | `/api/stats/trend` | recharts LineChart（visits + messages） |
| 事件浏览量 Top10 | `/api/stats/top-events` | recharts 垂直 BarChart |
| 最佳发布时段 | `/api/stats/hourly` | 连续 2 小时窗口之和最大 |
| 24 小时柱状图 | `/api/stats/hourly` | emerald→teal 渐变柱 |
| 一周×24 热力图 | `/api/stats/hourly` | 7×24 格子 + 5 级色阶 |
| 设备/浏览器/OS 分布 | `/api/stats/recent-visits` | UA 解析 + 颜色条形图 |
| 热门路径 Top10 | `/api/stats/top-paths` | emerald→teal 渐变进度条 |
| 热门来源 Top10 | `/api/stats/top-referrers` | amber→rose 渐变进度条 |
| 新访客 vs 回访 | `/api/stats/visitor-types` | 双数字卡 + 双色比例条 |
| 最近 20 条访问 | `/api/stats/recent-visits` | Table（path/ipHash/UA/referrer/time） |

---

## 附录 H：iCal 日历导出

### API

```
GET /api/events/ical?category=&tag=&limit=50
→ Content-Type: text/calendar
→ Content-Disposition: attachment; filename="guanwang94-events.ics"
```

### 单事件下载

事件详情 Modal「加入日历」按钮 → 生成单个 .ics 文件 → Blob + a.download

### 归档 section「订阅日历」

下载全部事件 .ics 文件

### iCal 格式（RFC 5545）

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Guanwang94//九四班官网//CN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:九四班官网 - 重要事件
X-WR-TIMEZONE:Asia/Shanghai
BEGIN:VEVENT
UID:<event-id>@guanwang94.saozi.cc.cd
DTSTAMP:20260928T153821Z
DTSTART:20260926T134427Z
DTEND:20260926T144427Z
SUMMARY:2026 春季运动会
DESCRIPTION:...
CATEGORIES:班级活动,运动会,体育
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

---

## 附录 I：二维码分享

事件详情 Modal「二维码」按钮 → Dialog 显示 200×200 QR 图

```
QR 生成服务：https://api.qrserver.com/v1/create-qr-code/
参数：size=200x200&data=<url>&color=10b981&bgcolor=ffffff
```

分享 URL：`origin/?event=<event-id>` → 前端监听 ?event= query 自动打开事件详情

---

## 附录 J：globals.css 工具类

| 类名 | 用途 |
|---|---|
| `.shimmer` | 骨架屏闪光动画 |
| `.heart-pop` | 点赞 Heart 弹性动画 |
| `.animate-in-fade` | 淡入上移动画 |
| `.count-up` | 数字等宽（tabular-nums） |
| `.reading-progress` | 阅读进度条渐变（emerald→teal→amber） |
| `.prose-94` | Markdown 渲染样式（h1-h3/p/ul/ol/a/blockquote/code/pre/img/table） |

---

## 文档结束

> 本文档由 Z.ai Code 生成，涵盖九四班官网全部技术细节。
> 如有疑问请查阅源码或联系管理员。
> © 2026 九四班官网 · Guanwang94
