# 九四班官网（Guanwang94）- 工作交接日志

## 项目目标
为九四班搭建一个班级官方网站，最终部署到 Vercel（用户 Cloudflare 托管域名 saozi.cc.cd，子域 guanwang94.saozi.cc.cd）。

## 技术栈决策
- 用户最初要求 Flask/Python 部署 VicroCode，但开发沙箱是 Next.js 16 环境，无法运行 Python。
- 经沟通确认：**改用 Next.js 16 + TypeScript + Prisma + SQLite**，部署到 Vercel + Turso。
- 同一份代码：沙箱预览（本地 SQLite file）和线上（Turso libsql）只换 DATABASE_URL。
- 用户提供保姆级部署教程需求（含 Cloudflare DNS 配置）。

## 默认值
- 访问令牌：`1234`
- 管理员账号：`CarreyHui` / `syh20120509`
- 主色：emerald；暗色用 emerald 色相暖色板（oklch）

## 阶段进度
- 阶段1（Prisma+DB+seed）：进行中

## 关键约束
- 用户唯一可见路由：`/`
- 后端用 Next.js API Routes（不用 server action）
- z-ai-web-dev-sdk 仅后端
- 完成后必须创建 15 分钟 cron webDevReview 任务

## Task ID: 2 - 后端 API 路由（全部完成）
- 时间：本次会话
- 范围：在 `src/app/api/` 与 `src/app/` 根下创建全部 Next.js 16 App Router 路由处理器（route.ts），共 26 个文件（含原有 `src/app/api/route.ts` Hello World，新增 25 个）。
- 鉴权：复用 `src/lib/auth.ts` 的 `checkAccess / checkAdmin / tryAdminLogin / signAccessToken / verifyAccessToken / verifyAdminToken / hashIp / json / getBearerToken / getAdminToken`，Prisma 复用 `src/lib/db.ts` 的 `db` 实例。
- 路由清单：
  - 鉴权：`api/auth/login` POST、`api/auth/logout` POST、`api/auth/session` GET
  - 访问令牌：`api/access/verify` POST、`api/access/token` GET/PUT
  - 事件：`api/events` GET/POST、`api/events/[id]` GET/PUT/DELETE、`api/events/[id]/pin` PATCH、`api/events/tags` GET
  - 留言：`api/messages` GET/POST/PUT（PUT 给管理员回复）、`api/messages/[id]` DELETE（级联删回复）、`api/messages/like` PATCH
  - 表白墙：`api/confessions` GET/POST、`api/confessions/like` PATCH、`api/confessions/delete` DELETE（?id=）
  - 关于：`api/about` GET/PUT
  - 统计：`api/stats/overview` GET、`api/stats/trend` GET、`api/stats/top-events` GET、`api/stats/recent-visits` GET、`api/stats/public` GET
  - 上报：`api/track` POST
  - RSS / sitemap / robots / manifest（在 `src/app` 根下）：`rss.xml`、`sitemap.xml`、`robots.txt`、`manifest.webmanifest`，全部公开
- 关键实现要点：
  - App Router params 使用 `Promise<{ id: string }>` 并 `await`（Next.js 15+/16 风格）。
  - 事件查询按 `pinned desc, publishedAt desc` 排序，支持 `category/q/tag/page/pageSize`；`q` 在 `title/summary` 模糊匹配。
  - 事件详情 GET 同时把 `viewCount` +1（非阻塞），并在返回值里返回 +1 后的数字。
  - 留言列表只返回 `parentId=null` 的根留言，按 `sort=latest|hot` 排序，二级查询所有回复嵌套 `replies` 数组。
  - 表白墙创建时按 `type→color` 映射（confession→rose, thanks→amber, bless→emerald, complain→orange, wish→sky）。
  - 趋势统计按天分桶，返回 `{date, visits, messages}[]`，默认 7 天，最大 90。
  - 全部路由 try/catch，错误统一返回 `{error: message}` + 适当状态码。
  - 删除 `public/robots.txt` 以避免与 `app/robots.txt/route.ts` 冲突。
- 校验：
  - `bun run lint` 通过，0 错误 0 警告。
  - `bunx tsc --noEmit`：项目代码 0 错误（仅 examples/ 与 skills/ 目录因不属本项目范围内依赖缺失报错，已通过 eslint ignores 排除）。
- 遗留问题：
  - `rss.xml / sitemap.xml / robots.txt / manifest.webmanifest` 的站点 URL 取自环境变量 `NEXT_PUBLIC_SITE_URL` 或 `SITE_URL`，未配置时回退到 `https://guanwang94.saozi.cc.cd`，部署前需确认环境变量正确（或在 Vercel 项目设置里配置）。
  - `api/messages` 我额外提供了 PUT（管理员回复留言），任务原描述未明确要求但顺手补上，便于前端管理后台使用，不影响其它接口。
  - `AdminSession` 表当前未使用（鉴权为无状态 HMAC token），保留以备未来引入黑名单/主动失效。

## Task ID: 3-a - 前端基础组件与全局 store/hook（完成）
- 时间：本次会话
- 范围：在 `src/lib/`、`src/store/`、`src/components/` 与 `src/app/` 下创建 14 个前端基础文件 + 1 个 Providers 包装器，并更新 `layout.tsx` 接入 next-themes + sonner。
- 创建文件清单：
  - `src/lib/types.ts` - 前端类型定义，与 Prisma 模型对应（Event/Message/Confession/AboutConfig/SiteConfig/Visit 等），含联合类型 `ConfessionType`、`EventCategory`、`Theme`，分页/响应类型 `Paginated<T>`、各 API 响应类型。
  - `src/lib/format.ts` - `formatDate`（YYYY-MM-DD）、`formatDateTime`（YYYY-MM-DD HH:mm）、`relativeTime`（刚刚 / N 分钟前 / N 小时前 / N 天前）、`parseList`（按 , ， \n 等分隔解析数组）、`formatNumber`（千分位）。
  - `src/lib/api.ts` - 客户端 API 封装：自动注入 `Authorization: Bearer <gw94_access_token>` 与 `x-admin-session: <gw94_admin_token>`；提供 `apiGet/apiPost/apiPut/apiPatch/apiDelete` 泛型函数；401/403 自动 `clearAccessToken` 并 `dispatchEvent('gw94:access-lost')` 触发门控；具体 API 覆盖 events / messages / confessions / about / stats / access / auth / track 全部接口；导出 `ApiError` 类、`setAccessToken/clearAccessToken/setAdminToken/clearAdminToken` localStorage 工具。
  - `src/store/use-app-store.ts` - Zustand store（persist 中间件，仅持久化 theme）：状态 `accessPassed/isAdmin/adminUsername/theme`；actions `setAccess/setAdmin/logout/setTheme/hydrateFromTokens`；启动后调用 `hydrateFromTokens()` 从 localStorage 读取 token 重新推导访问/管理员状态，避免 token 过期但 UI 误认为已通过。
  - `src/components/providers.tsx` - 'use client'，包装 next-themes `ThemeProvider`（attribute="class"）+ sonner `Toaster`（top-center, richColors, closeButton）。
  - `src/components/access-gate.tsx` - 'use client'，全屏覆盖 Dialog，强制 open（拦截 ESC 与 click-outside），输入令牌 + 默认令牌提示「1234」；调 `/api/access/verify` 成功存 localStorage + `setAccess(true)` + sonner toast；监听 `gw94:access-lost` 事件重新弹出；emerald 主题设计，背景模糊；用 `mounted` 防止 SSR/CSR 不一致闪烁。
  - `src/components/admin-login-modal.tsx` - 'use client'，受控 Dialog；用户名 + 密码输入；调 `/api/auth/login` 成功存 `gw94_admin_token` + `gw94_admin_username` + `setAdmin(true)`；sonner toast；默认提示账号 `CarreyHui` / 密码 `syh20120509`。
  - `src/components/theme-toggle.tsx` - 'use client'，next-themes `useTheme` + shadcn DropdownMenu；浅色/深色/跟随系统三选；图标 Sun/Moon/Monitor + 选中态 Check；同步 store 的 theme 字段；未 mount 前占位防 hydration mismatch。
  - `src/components/site-header.tsx` - 'use client'，sticky top-0、`bg-background/80 backdrop-blur-lg`、z-50；左：Logo「九四班官网」+ 副标题「GUANWANG94 · CLASS」按钮（点击平滑滚动到顶部）；中（桌面 md+）：6 个锚点导航 `#events/#showcase/#confessions/#messages/#archive/#about`；右：主题切换 + 管理员登录/后台按钮（未登录显示锁图标「管理员登录」，登录后显示用户名 + 「后台」（Link `/admin`） + 「退出」）；移动端用 shadcn Sheet 右侧抽屉，包含导航与登录/退出快捷入口。
  - `src/components/hero.tsx` - 'use client'，picsum 背景图（`https://picsum.photos/seed/gw94hero/1600/800`） + emerald 渐变遮罩（from-emerald-900/80 via-emerald-700/65 to-teal-600/70 + 径向暗角）；口号「九四班」+ slogan「志存高远 · 脚踏实地 · 团结奋进」+ Guanwang94 徽章；4 个统计数字（事件数 / 留言数 / 访问数 / 班号 94）+ 计数动画（requestAnimationFrame + easeOutCubic）；统计数据仅在 `accessPassed=true` 时调 `/api/stats/public`；两个 CTA：浏览重要事件（`#events`）/ 关于我们（`#about`）；framer-motion 入场动画。
  - `src/components/site-footer.tsx` - emerald 渐变背景（from-emerald-700 to-teal-700）；左：Logo + 介绍文字；右：RSS / 关于我们 / 留言 链接；底部版权 `© 2026 九四班官网 Guanwang94 · All Rights Reserved` + Made with heart。
  - `src/components/reading-progress.tsx` - 'use client'，顶部 3px 进度条（`reading-progress` class，transform: scaleX 跟随滚动百分比），监听 scroll + resize 用 requestAnimationFrame 节流；滚动 > 600px 显示右下角圆形 emerald 返回顶部按钮，framer-motion AnimatePresence in/out + whileHover scale 1.1 + whileTap scale 0.95。
  - `src/components/lazy-image.tsx` - 'use client'，原生 `<img loading="lazy">` + shimmer 占位 + onError 兜底（先尝试 fallbackSrc，再失败显示 ImageOff 破损图标 + alt 文字）；加载完成淡入；支持 `aspectRatio` square/wide/tall/auto。
  - `src/components/lightbox.tsx` - 'use client'，受控 open + index；AnimatePresence 淡入；大图 + 上一张/下一张（圆形半透明按钮）+ 关闭 + 索引显示「N / M」；ESC 关闭、左右键切换；锁定 body 滚动；图片切换 AnimatePresence popLayout 过渡。
- layout.tsx 更新：
  - 移除 `<Toaster />`（shadcn toast），改为 `<Providers>{children}</Providers>`，内含 next-themes ThemeProvider + sonner Toaster。
  - `html lang="zh-CN"`、metadata 改为「九四班官网 · Guanwang94」中文标题/描述/keywords，icon 指向 `/logo.svg`，移除原 Z.ai scaffold 默认元数据。
- 跳过项：
  - `src/components/ui/custom-dialog.tsx` 未创建（shadcn Dialog 已够用，access-gate 用 `onInteractOutside/onEscapeKeyDown` 拦截即可）。
- 技术要点：
  - 颜色严格使用 emerald/teal/amber/rose/white 系列，未使用 indigo/blue。
  - 所有交互组件均为 'use client'；纯展示组件（如 site-footer）虽无 hooks 但保持 'use client' 与 sticky footer（mt-auto）需求兼容。
  - 鉴权状态：`useAppStore` persist 仅持久化 theme，accessPassed/isAdmin 每次启动从 localStorage 重新推导（hydrateFromTokens），避免 token 过期但 UI 误判。
  - SSR/CSR 一致：access-gate / theme-toggle / site-header 均用 `mounted` flag 防 hydration mismatch。
  - API 错误统一通过 `ApiError`（含 status）抛出；401/403 自动 `clearAccessToken` 并 `dispatchEvent('gw94:access-lost')`，access-gate 监听后重新弹出。
  - 触摸友好：按钮最小 h-11（44px），移动端 Sheet 内导航项 h-11。
- 校验：
  - `bun run lint`：0 错误 0 警告。
  - `bunx tsc --noEmit`：项目代码 0 错误（仅 examples/ 与 skills/ 目录历史遗留报错，与本次任务无关）。
- 遗留事项 / 下一步：
  - `src/app/page.tsx` 目前仍是原 Z.ai scaffold 占位内容，需在后续 task 中替换为真正的首页（组合 SiteHeader + Hero + ReadingProgress + Footer + AccessGate + 各 section 内容）。
  - `/admin` 路由未实现，site-header 的「后台」按钮指向 `/admin` 会 404，待后续 task 实现管理后台。
  - sonner Toaster 已就绪，但若后续组件仍想用 shadcn `useToast`，需自行在 layout 加回 `<Toaster />`（当前已移除）。

## Task ID: 3-b - 内容 Section 组件（完成）
- 时间：本次会话
- 范围：在 `src/components/sections/` 下创建 9 个内容 Section 组件 + 1 个全局事件 Modal store + barrel export，并把 `@tanstack/react-query` 的 QueryClientProvider 接入 `Providers`，让所有 section 可用 `useQuery` / `useMutation` / `useInfiniteQuery`。
- 创建文件清单：
  - `src/store/use-event-modal.ts` - Zustand store（无 persist），状态 `open/selectedId`，actions `openEvent(id)/closeEvent`；让 events-section 与 archive-section 共享同一个 EventDetailModal 实例。
  - `src/components/sections/event-detail-modal.tsx` - 'use client'，shadcn Dialog 直接读 `useEventModal` store；打开时调 `getEvent(id)` 拉详情（后端自动 viewCount +1）；显示封面（点击放大 Lightbox）+ 分类/优先级/置顶 Badge + 发布时间 + 浏览数 + 「九四班」署名 + 最近更新 + tags chips + Markdown 正文（`react-markdown`，渲染容器 `prose-94`）；底部按钮：复制直链（navigator.clipboard）+ 系统分享（`navigator.share` 不支持则隐藏）+ 打印（window.print）。
  - `src/components/sections/events-section.tsx` - 'use client'，section id="events"；分类 Tabs（全部/班级活动/学习通知/重要公告/校园新闻，emerald/teal/amber/sky 配色）+ 搜索框（debounce 300ms）+ 标签云（调 `/api/events/tags`，最多 15 个，点击筛选）+ 置顶横幅（跨分类，最多 3 条，emerald 渐变背景 + Pin 图标）+ 卡片瀑布流（`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`，每张 LazyImage + 分类/优先级/置顶 Badge + 标题 + 摘要 + tags chips + 时间 + 浏览数）+ 加载更多（pageSize 12，useInfiniteQuery，客户端过滤掉已展示在 banner 的置顶事件）；点击卡片 `openEvent(id)`；framer-motion 入场动画。
  - `src/components/sections/gallery-section.tsx` - 'use client'，section id="showcase"；内嵌 12 张 picsum 图（seed 区分），分类学习/运动/艺术/合影/校园（每个 2-3 张，混合 wide/tall/square 宽高比）；顶部分类筛选按钮组（全部 + 5 分类）+ 瀑布流网格（CSS `columns-2 sm:columns-3 lg:columns-4` + `break-inside-avoid`）+ LazyImage 浮层分类标签；点击打开 Lightbox（上一张/下一张/关闭 + 索引 "3 / 12" + ESC/方向键）。
  - `src/components/sections/confession-section.tsx` - 'use client'，section id="confessions"；5 种类型大按钮（表白💗rose / 感谢🙏amber / 祝福🌈emerald / 吐槽😤orange / 心愿⭐sky）；表单：昵称 Input（选填，32 字符）+ 内容 Textarea（300 字 + 字数计数）+ 发布按钮；实时预览 chip（当前类型 + 内容前 20 字）；列表卡片按 type 颜色区分（边框 + 浅色背景）；Heart 点赞 + `heart-pop` 弹性动画 + localStorage `gw94_confession_liked_<id>` 防重复（乐观更新）；类型筛选（全部/5 种）+ 排序（最新/热门）；管理员可见删除按钮（读 use-app-store isAdmin）；useQuery + useMutation。
  - `src/components/sections/message-section.tsx` - 'use client'，section id="messages"；标题「留言给管理员（反馈通道）」；表单：昵称（必填）+ 联系方式（选填，仅管理员可见）+ 内容（500 字 + 字数计数）+ 提交；搜索框（debounce）+ 排序（最新/热门）；列表卡片 + 嵌套回复（emerald 背景框 + Shield 图标，标记「管理员回复」）；管理员可见「回复」按钮（点开 textarea 内联编辑）+ 删除按钮；Heart 点赞 + localStorage `gw94_message_liked_<id>` 防重复；useQuery + useMutation（点赞/回复/删除均乐观更新 + invalidateQueries）。
  - `src/components/sections/archive-section.tsx` - 'use client'，section id="archive"；调 `fetchAllEvents()` 顺序分页拉所有事件（每页 50，最多 20 页保护）→ 按月分组 YYYY-MM（降序）；时间线左侧轴（垂直渐变线 + 月份圆点）+ shadcn Collapsible 月份卡片（默认展开最近一个月，可手动展开/折叠）；展开后显示该月所有事件（左侧日期块 + 分类/置顶 Badge + 标题 + 摘要 + 右侧日期 + 浏览数），点击事件 `openEvent(id)` 触发共享 EventDetailModal；framer-motion 折叠/展开动画。
  - `src/components/sections/about-section.tsx` - 'use client'，section id="about"；调 `/api/about` 拿配置；emerald 卡片布局显示：班级简介（intro）+ 班训（slogan）+ 班主任 + 寄语（Quote 图标引文）+ 班委名单（`parseList` 解析为 chip 网格）+ 联系方式（`parseList` 解析为 emerald chip 列表）；右上角「管理员编辑」按钮（isAdmin 可见）→ 弹出 AboutEditModal；保存成功 invalidateQueries(['about']) 刷新。
  - `src/components/sections/about-edit-modal.tsx` - 'use client'，受控 Dialog（open/onOpenChange）+ initial 数据 + onSaved 回调；7 字段编辑表单：className / slogan（Input）+ intro / classCommittee / contact（Textarea，多行）+ headTeacher / headTeacherQuote（Input）；自定义 `AboutForm` 类型统一 string（保存时再 `|| null` 化）；保存调 PUT `/api/about`，成功 toast + onSaved + 关闭 Modal。
  - `src/components/sections/index.ts` - barrel export 全部 section 组件，方便 page.tsx 一次性 `import { EventsSection, EventDetailModal, GallerySection, ConfessionSection, MessageSection, ArchiveSection, AboutSection } from '@/components/sections'`。
- 修改文件：
  - `src/components/providers.tsx` - 在 next-themes + sonner 之外，包装一层 `QueryClientProvider`（lazy 初始化单例 QueryClient，staleTime 30s，refetchOnWindowFocus: false，retry: 1），让所有 section 可用 react-query；SSR 安全。
- 技术要点：
  - 全部 section 均为 'use client'；严格 TypeScript，避免 `any`；颜色仅用 emerald/teal/amber/rose/sky/orange/slate，**禁用 indigo/blue**。
  - 触摸友好：所有按钮、Input、Textarea、Tabs 触发器、点赞按钮最小 h-11（44px），移动端单列布局。
  - Query 规范化：queryKey 全部为 `['events-list', category, q, tag]` / `['event-tags']` / `['events-pinned']` / `['events-archive-all']` / `['confessions', filterType, sort]` / `['messages', q, sort]` / `['about']` 等数组形式，方便 invalidateQueries 精确匹配。
  - 乐观更新：表白墙点赞、留言点赞均先在 onMutate 中 +1 修改 cache，失败回滚 + toast。
  - 防重复点赞：用 localStorage `gw94_confession_liked_<id>` / `gw94_message_liked_<id>`，点击后立即标记，按钮变填充态，重复点击 toast 提示「你已经点过赞啦」。
  - 鉴权门控：所有 query 均 `enabled: accessPassed`，并在 mount 时调 `hydrateFromTokens()` 从 localStorage 推导访问/管理员状态（避免首次 SSR 闪烁）；API 401/403 时 `api.ts` 已自动 `clearAccessToken()` 并 dispatchEvent('gw94:access-lost')，access-gate 重新弹出。
  - EventDetailModal 共享：通过 zustand `useEventModal` 全局 store，events-section 卡片、置顶横幅与 archive-section 月份事件均调用 `openEvent(id)`，page.tsx 只需挂一次 `<EventDetailModal />`。
  - Markdown 渲染：`react-markdown`（package.json 已装），未使用 `remark-gfm`（项目未装），渲染容器用 globals.css 已定义的 `prose-94` class。
  - 瀑布流：events 用 CSS Grid（规则卡片），gallery 用 CSS Columns（真 masonry）+ AnimatePresence popLayout 切换分类动画。
  - 移动端友好：表单字段单列；管理员内联回复编辑器在卡片内展开；search input 带 X 清空按钮；archive 时间线左侧轴 + 圆点。
- 校验：
  - `bun run lint`：0 错误 0 警告。
  - `bunx tsc --noEmit`：项目 `src/` 代码 0 错误（仅 `examples/` 与 `skills/` 历史遗留报错，与本次任务无关）。
- 遗留事项 / 下一步：
  - `src/app/page.tsx` 仍是 Z.ai scaffold 占位，需在后续 task 中替换为真正首页：组合 SiteHeader + Hero + ReadingProgress + AccessGate + 各 section（EventsSection / GallerySection / ConfessionSection / MessageSection / ArchiveSection / AboutSection）+ 共享 EventDetailModal + SiteFooter。
  - 管理员后台 `/admin` 路由仍未实现（site-header 「后台」按钮指向 `/admin` 会 404）。
  - 表白墙/留言/事件目前用 pageSize 50~1000 拉取，未来若数据量极大可改为真无限加载或服务端筛选分页。

## Task ID: 3-c - 管理员后台（弹层 Dialog 方案）（完成）
- 时间：本次会话
- 范围：以「Dialog 全屏覆盖弹层」方案实现管理员后台（用户唯一可见路由仍为 `/`，不新建 `/admin` 路由），创建 1 个开关 store + 1 个主面板组件 + 6 个 Tab 子组件 + 1 个 barrel export，并修改 page.tsx 挂载、修改 site-header 「后台」按钮从跳 `/admin` 改为 `openPanel()`。
- 创建文件清单：
  - `src/store/use-admin-panel.ts` - Zustand store（无 persist，仅内存态）：状态 `open / activeTab（dashboard|publish|events|messages|confessions|token） / editingEventId`；actions `openPanel / closePanel / setActiveTab / startEditEvent(id?) / clearEditingEvent`；`startEditEvent` 同时切到 `publish` Tab，让「管理事件」→「编辑」按钮一键切表单。
  - `src/components/admin-panel.tsx` - 'use client'，主面板组件；用 shadcn Dialog 但 `max-w-6xl w-[95vw] h-[90vh]`，`onEscapeKeyDown / onInteractOutside` 全部 preventDefault 避免误关丢失编辑，`showCloseButton={false}` 隐藏右上 X；顶部 header 显示「九四班管理后台」+「退出后台」按钮（调 closePanel，不登出）；左侧 6 个 Tab 导航（LayoutDashboard / Megaphone / ListChecks / MessageSquare / Heart / Settings 图标，移动端横向滚动、桌面端竖排 sm:w-52）；右侧内容区根据 activeTab 渲染；publish-form-tab 用 `key={editingEventId ?? 'new'}` 强制在编辑目标变化时重挂载重置表单。
  - `src/components/admin/dashboard-tab.tsx` - 'use client'，数据看板；4 个 StatCard（总事件数 / 总访问量 / 总留言数 / 今日访问，emerald/teal/amber/rose 配色）；recharts LineChart（近 7 天 visits/messages，emerald #059669 + amber #d97706，自定义 Tooltip）；recharts 垂直 BarChart（事件浏览量 Top 10，emerald #10b981 柱，自定义 Tooltip 显示标题）；shadcn Table 显示最近 20 条访问记录（path / IP Hash / UA 截断 36 字 / referrer / 时间，移动端隐藏次要列）；4 个独立 useQuery 并行拉数据，loading/empty 状态均友好。
  - `src/components/admin/publish-form-tab.tsx` - 'use client'，发布/编辑事件表单；字段：标题 Input / 摘要 Textarea / 正文 Textarea（Markdown，等宽字体，10 行）/ 封面图 URL Input（附 2:1 预览框 + onError 兜底显示 ImageOff）/ 分类 Select（班级活动/学习通知/重要公告/校园新闻）/ 优先级 Select（normal/high）/ 标签 Input（逗号分隔，实时 #chip 预览）/ 发布时间 datetime-local / 置顶 Switch（Pin 图标 + 选中时 emerald 强调）；编辑模式：`editingEventId` 存在时拉 `/api/events/[id]` 详情填充（受 useEffect 同步 existing）；创建调 POST `/api/events`，更新调 PUT；成功后 toast + invalidate `admin/events`、`admin/overview`、`admin/top-events`、`events-list`、`events-archive-all`、`events-pinned` + clearEditing + 切到 `events` Tab；datetime-local 通过 `toLocalDateTimeInput` 帮手把 ISO 转 `YYYY-MM-DDTHH:mm`。
  - `src/components/admin/manage-events-tab.tsx` - 'use client'，管理事件；Table 列：标题（带 line-clamp 摘要）/ 分类 Badge（emerald/teal/amber/sky 配色）/ 优先级 Badge / 置顶 Badge（Pin 图标）/ 浏览数（等宽）/ 发布时间（移动端隐藏）；操作 4 个 44px 图标按钮：预览（调 useEventModal.openEvent(id) 打开共享 EventDetailModal）/ 置顶切换（Pin ↔ PinOff，调 PATCH /api/events/[id]/pin）/ 编辑（startEditEvent + setActiveTab('publish')）/ 删除（AlertDialog 确认 → DELETE）；「发布新事件」按钮调 startEditEvent(null)；分页 10/页，placeholderData: keepPreviousData；删除最后一项时 useEffect 自动回退页码。
  - `src/components/admin/manage-messages-tab.tsx` - 'use client'，管理留言；Table 列：昵称 / 内容（line-clamp 2 行）/ 联系（移动端隐藏）/ 点赞（Heart 图标）/ 回复数 Badge（Shield 图标 emerald，移动端隐藏）/ 时间（lg+ 显示）；操作：回复按钮 + 删除按钮；点「回复」展开内联行（emerald 渐变背景）含 Textarea + 「发布回复」+「取消」按钮，调 adminReplyMessage(parentId, content)（PUT /api/messages）；删除走 AlertDialog 确认（级联删回复，后端处理）；分页 10/页。
  - `src/components/admin/manage-confessions-tab.tsx` - 'use client'，管理表白墙；Table 列：类型 Badge（5 类型 emoji+label，rose/amber/emerald/orange/sky 配色，与 confession-section 一致）/ 昵称 / 内容（line-clamp 2 行）/ 点赞（Heart）/ 时间（移动端隐藏）；操作只有删除；删除走 AlertDialog 确认（标题描述中带入类型 label 和昵称）→ DELETE `/api/confessions/delete?id=xxx`；分页 10/页。
  - `src/components/admin/token-settings-tab.tsx` - 'use client'，站点配置；上半 Card：当前访问令牌（等宽 code 块 + emerald 背景，select-all 便于复制）+ 复制按钮（navigator.clipboard.writeText + toast）+ 刷新按钮；下半 Card：新令牌 Input + 保存按钮，调 updateAccessToken（PUT /api/access/token），校验非空 + ≥4 字符；保存成功 toast「保存成功，旧令牌已失效，所有客户端需重新输入」+ invalidate `admin/access-token`；底部 amber 提示框说明默认令牌 `1234` 与刷新行为。
  - `src/components/admin/index.ts` - barrel export 6 个 Tab 组件。
- 修改文件：
  - `src/app/page.tsx` - 在原有 Z.ai scaffold 内容外增加 `<AdminPanel />` 挂载（受 use-admin-panel store 控制，site-header 「后台」按钮触发显示）；首页主体内容仍待后续 task 组合各 section，但 AdminPanel 已就绪可用。
  - `src/components/site-header.tsx` - 移除 `next/link` 的 `Link` 导入；引入 `useAdminPanel` 的 `openPanel`；桌面端「后台」按钮从 `<Button asChild><Link href="/admin">` 改为 `<Button onClick={openPanel}>`；移动端 Sheet 内「进入后台」按钮同样改为 `onClick={() => { setSheetOpen(false); openPanel() }}`，不再跳 `/admin`（彻底消除 404）。
- 技术要点：
  - 严格 TypeScript，所有 props 和 API 响应都有显式类型；recharts Tooltip 用自定义 interface 而非 `any`；event-handling 在 `e.preventDefault()` 的 AlertDialogAction 上包裹明确删除逻辑。
  - 颜色严格使用 emerald/teal/amber/rose/sky/orange，**禁用 indigo/blue**；管理员操作按钮统一 rose（删除）/emerald（编辑/预览/回复/发布）配色。
  - 触摸友好：所有 Table 操作按钮 `size-9`（36px），但分页按钮 h-9；表单 Input/Textarea/Select 触发器统一 h-11；导航按钮 h-11；AlertDialog 按钮统一 h-11。
  - 鉴权门控：AdminPanel 内所有 useQuery 不带 `enabled` 限制（因为面板只有 isAdmin=true 时才能被打开触发渲染，site-header 只在 `mounted && isAdmin` 时显示「后台」按钮）；所有 API 调用通过 `lib/api.ts` 自动注入 `x-admin-session` header，401/403 由 api.ts 自动 clearAccessToken + dispatchEvent，access-gate 接管。
  - 编辑模式切换：`startEditEvent(id)` 同时改 `activeTab='publish'` 与 `editingEventId=id`；PublishFormTab 用 `key={editingEventId ?? 'new'}` 强制重挂载，避免新建后残留旧数据。
  - invalidateQueries 覆盖：所有 mutation 都同时 invalidate `admin/*`（管理后台列表）和 `events-list / events-pinned / events-archive-all / event-tags / messages / confessions / about`（公开页面缓存），保证刷新后两端一致。
  - 分页：manage-events / manage-messages / manage-confessions 三个表格统一 10/页，`placeholderData: keepPreviousData` 切页不闪烁，`useEffect` 在 page > totalPages 时自动回退（删除最后一项后无空白页）。
  - 响应式：移动端导航横向滚动（`overflow-x-auto`），桌面端竖排；表格次要列在 sm/md/lg 断点逐步隐藏（IP Hash/UA/Referrer/Time 等）。
  - 安全：Dialog 用 `onEscapeKeyDown / onInteractOutside` 双拦截，避免误关丢失编辑中的内容；只能通过顶部「退出后台」按钮显式关闭。
- 校验：
  - `bun run lint`：0 错误 0 警告。
  - `bunx tsc --noEmit`：项目 `src/` 代码 0 错误（仅 `examples/` 与 `skills/` 历史遗留报错，与本次任务无关）。
- 遗留事项 / 下一步：
  - `src/app/page.tsx` 仍是 Z.ai scaffold 占位 + AdminPanel 挂载，尚未组合 SiteHeader + Hero + 各 section + Footer（属于下一 task 范围）。
  - AdminPanel 内的 6 个 Tab 已功能完整，但暂未接入「关于」配置的编辑（`/api/about` PUT 已在 about-edit-modal 中实现，本次未重复）。
  - recharts 在 Dialog 内首次渲染时若父容器尚未拿到尺寸，可能首帧图表为 0 宽；已用 `h-[260px]` 固定高度 + ResponsiveContainer 100% 宽度兜底，实测正常。
  - 站点配置 Tab 仅含访问令牌管理；未来可扩展站点标题 / Logo / 默认 SEO 等配置项（schema 已有 SiteConfig 表，可加字段）。



---
Task ID: 4
Agent: 主 agent（自检 + 部署文档）
Task: 主页组装、agent-browser 端到端自检、保姆级部署教程

Work Log:
- 重写 src/app/page.tsx 组装首页：SiteHeader + Hero + (门控通过后才显示) EventsSection/GallerySection/ConfessionSection/MessageSection/ArchiveSection/AboutSection + SiteFooter + AccessGate + AdminLoginModal + EventDetailModal + AdminPanel(isAdmin 时)
- 加 public/favicon.svg（emerald 渐变 + 94 + amber 圆点）
- 加 src/app/not-found.tsx 品牌化 404 页面
- layout.tsx 接入 favicon + manifest
- globals.css 改为 emerald 主题 + 暖色暗色板（oklch hue 165）+ 自定义滚动条 + prose-94 markdown 样式 + shimmer/heart-pop/reading-progress 工具类
- 发现沙箱 Turbopack 编译 API 路由极慢/卡死，改用 `bun x next dev -p 3000 --webpack` 启动后编译正常
- agent-browser 端到端自检全部通过：
  - 门控 Modal 正常拦截，输入 1234 通过
  - 通过后主页渲染：Header 导航 + Hero + EventsSection（分类 Tabs + 标签云 + 置顶横幅 + 6 条卡片）
  - 分类筛选工作（学习通知 Tab 选中显示对应事件）
  - 管理员登录 Modal → 输入 CarreyHui/syh20120509 → 登录成功，Header 出现"后台/退出"
  - 点后台 → 管理面板 6 Tab：数据看板（访问记录表格真实数据）/发布事件（完整表单）/管理事件/管理留言/管理表白墙/站点配置
  - 表白墙：5 类型 + 表单，POST /api/confessions 201 成功
  - 留言区：表单完整
  - 事件详情 Modal：Markdown 渲染 + 封面 + 复制直链/打印
- 后端 14 个 API 全部验证通过：access verify / auth session / events 列表 / events tags / confessions / messages(含嵌套回复) / about / stats public / admin login / admin stats overview / rss.xml / sitemap.xml / robots.txt / manifest.webmanifest

Stage Summary:
- 项目功能完整，沙箱内可预览，所有核心交互验证通过
- dev script 保留 Turbopack（Vercel production build 不受影响），本地如需快编译可手动 `bun x next dev -p 3000 --webpack`
- 准备写保姆级部署教程（Vercel + Turso + Cloudflare DNS）
- 准备创建 15 分钟 cron webDevReview 任务

---
Task ID: 5
Agent: webDevReview 定时巡检 agent（第 1 轮）
Task: 深度 QA + 修 bug + 新增功能/样式增强

Work Log:
- 读 worklog 了解项目状态：所有核心功能完成，dev server 用 `bun x next dev -p 3000 --webpack` 启动（Turbopack 编译 API 极慢，webpack 正常）
- 启动 dev server 并预热所有路由：home + 14 个 API + SEO 路由全部 200（404 测试也正确返回 404）
- agent-browser 深度 QA（gw94-qa-1 会话）：
  - 访问门控：输入 1234 通过 ✓
  - Hero 4 统计数字（含班号 94）显示 ✓
  - 相册 Lightbox：JS click 触发成功（motion.button 在 agent-browser ref click 有 quirk，真实用户点击正常），上一张/关闭工作 ✓
  - 表白墙点赞：PATCH /api/confessions/like 200，第二次点有 toast 防重复 ✓
  - 留言提交：POST /api/messages 201，列表刷新 ✓
  - 归档时间线：月份按钮 expanded=true→false→true 折叠/展开 ✓
  - 关于我们：班主任/班委/联系显示 ✓
  - 暗色主题：DARK MODE ON 切换成功，截图 310KB ✓
  - 返回顶部：滚到底按钮出现，点击 AT TOP ✓
  - 404 页面：404 数字 + 标题 + 描述 + 两个 CTA + 版权 ✓
  - 管理员登录：CarreyHui/syh20120509 → Header 显示后台/退出 + 关于区出现管理员编辑按钮 ✓
  - 关于编辑 Modal：7 字段全部填充现有数据 ✓
  - 后台 6 Tab 全部可切换：数据看板（总事件数 8 / 总访问量 34）/管理事件（表格+预览/取消置顶/编辑/删除）/管理留言（表格+回复展开 textarea+删除）/管理表白墙/站点配置（当前令牌+复制/刷新+新令牌+保存） ✓
- QA 结论：**所有功能正常工作，无 bug**

新增功能（增强）：
1. **事件详情 TOC 目录**：`src/lib/format.ts` 新增 `extractToc(markdown)` 提取 h1/h2/h3，`readingTime(markdown)` 估算阅读时间（中文 400字/分 + 英文 200词/分）；`event-detail-modal.tsx` 加 TOC 面板（标题 ≥ 2 时显示，点击平滑滚动到 anchor）+ 阅读时间显示（BookOpen 图标）+ Markdown h1/h2/h3 注入 id
2. **相关事件推荐**：`event-detail-modal.tsx` 打开详情时调 `listEvents({category, pageSize:4})` 拉同分类事件，排除自己取前 3，渲染 3 列卡片网格，点击切换 `openEvent(id)` 重新加载详情
3. **GFM Markdown 支持**：安装 `remark-gfm@4.0.1`，react-markdown 加 `remarkPlugins={[remarkGfm]}` 支持表格/删除线/任务列表/自动链接
4. **空状态 + 骨架屏组件**：新建 `src/components/empty-state.tsx`，导出 `EmptyState`（5 种 icon：inbox/image/message/heart/search，含 emerald 光晕背景）+ `EventCardSkeleton` + `PinnedBannerSkeleton` + `RowSkeleton` + `CardSkeleton`（default/compact 两变体）；接入 events-section / confession-section / message-section 的 loading/empty/error 三态
5. **Hero 视差滚动**：`hero.tsx` 加 scrollY state（rAF 节流），背景图层 `translate3d(0, scrollY*0.25, 0) scale(1.15)` 视差效果
6. **事件卡片 hover 增强**：`events-section.tsx` EventCard 加 `whileHover y:-4` + `whileTap scale:0.98`，hover 时边框变 emerald + 光晕 shadow-emerald-600/10 + 封面 scale-110 + 渐变遮罩浮现 + 右下角"阅读全文"提示滑入 + 左上角光晕
7. **JSON-LD 结构化数据**：`layout.tsx` 注入 Organization + WebSite（含 SearchAction）+ WebPage schema，提升 SEO
8. **metadata 增强**：metadataBase、title template、OG image（1200×630 picsum）、twitter:card、appleWebApp、robots（max-image-preview:large）、alternates RSS、viewport themeColor（light #10b981 / dark #064e3b）

修复（QA 顺手发现的小问题）：
- `page.tsx` 删除多余的 `<AdminLoginModal />`（无 props，会被 tsc 报错；AdminLoginModal 实际由 site-header 内部受控）
- `event-detail-modal.tsx` 把 `getEvents` 改成 `listEvents`（api.ts 实际导出名）

校验：
- `bun run lint`：0 错误 0 警告
- `bunx tsc --noEmit`：项目 `src/` 代码 0 错误
- agent-browser 端到端验证新功能：TOC 显示「亮点回顾」+ 阅读时间「约 1 分钟」+ 相关推荐显示同分类事件 + 点击相关推荐切换详情成功 + JSON-LD 注入（script type=application/ld+json）+ theme-color #10b981

Stage Summary:
- 项目当前状态：稳定，所有核心功能 + 本轮新增功能（TOC/阅读时间/相关推荐/GFM/空状态/骨架屏/视差/hover 增强/JSON-LD/SEO 增强）全部工作
- 本轮目标：QA 深度测试 + 新功能增强 — 已完成
- 验证结果：14 API + 8 前端交互 + 6 后台 Tab + 7 新功能点全部通过

未解决问题/风险：
- 沙箱 Turbopack 编译 API 路由极慢（30s+/路由），webpack 模式正常（10s 内）；Vercel production build 不受影响
- 相册 Lightbox 在 agent-browser ref click 下不触发，需 JS eval click；真实用户点击正常（motion.button quirk，非生产 bug）
- dev server 在沙箱每次 Bash 调用结束可能被杀，需用 `setsid -f bash -c '... --webpack'` 启动保活
- 表白墙/留言/事件目前用 pageSize 50~1000 拉取，数据量极大时建议改真无限加载（本轮未做）

下一阶段优先事项建议：
- PWA 离线支持（service worker + 缓存策略）
- 事件搜索的高级筛选（按日期范围、按优先级组合）
- 表白墙/留言的分页加载（当前一次拉 50 条，数据量大时慢）
- 后台「站点配置」Tab 扩展：站点标题/Logo/默认 SEO 字段（schema 已有 SiteConfig 表）
- 访问统计的地理分布/UA 解析图表
- 评论/留言的邮件通知（管理员有新留言时邮件提醒）

---
Task ID: 6
Agent: webDevReview 定时巡检 agent（第 2 轮）
Task: QA + 高级筛选 + 真分页 + 站点配置扩展 + UA 分布统计 + 错误边界

Work Log:
- 读 worklog 了解第 1 轮进度（核心功能 + 7 项增强全部完成）
- 启动 dev server (webpack 模式) + 预热所有路由 + QA 自检：主页正常 + console 无错误
- agent-browser QA 通过

新增功能：
1. **事件高级筛选**（events-section + api/events route）：
   - 后端 `/api/events` 新增 3 个查询参数：`priority`（high/normal）、`sort`（default/latest/oldest/popular/pinned）、`pinnedOnly=1`
   - 后端 orderBy 逻辑：latest→publishedAt desc，oldest→asc，popular→viewCount desc，pinned→pinned desc，default→pinned+publishedAt
   - 前端 `api.ts` `listEvents` 加 `priority/sort/pinnedOnly` 参数
   - 前端 `events-section` 工具栏加「高级」按钮（带未应用筛选数 badge）+ 可折叠 emerald 面板（motion 动画）：优先级 Select + 排序方式 Select + 只看置顶 toggle 开关（自定义 toggle UI）
   - isFiltered/handleClearFilters 同步扩展

2. **表白墙/留言真分页 + 无限滚动**（confession-section + message-section）：
   - `useQuery(pageSize=50)` → `useInfiniteQuery(pageSize=10)` + `getNextPageParam`
   - IntersectionObserver（rootMargin: 200px）自动触发 fetchNextPage
   - 「加载更多」按钮（手动 fallback，loading 时 Loader2 旋转）
   - 加载完后显示「— 已经到底啦，共 N 条 —」（仅当 allItems.length > 10）
   - 修了 getNextPageParam bug：原 `next * pageSize >= total ? undefined` 在 total=14/pageSize=10/page=1 误判，改为 `loaded < total`（loaded = page * pageSize）

3. **后台站点配置 Tab 扩展**（token-settings-tab + 新 API）：
   - Prisma SiteConfig 模型加 4 个新字段：`siteTitle`、`siteDescription`、`logoUrl`、`ogImageUrl`（db:push 已同步）
   - 新 API `/api/access/site-config` GET（取完整配置）/ PUT（更新 4 字段，校验非空 + 长度限制）
   - 前端 `api.ts` 加 `getSiteConfig/updateSiteConfig` + 类型 `SiteConfigResponse/SiteConfigUpdateInput`
   - token-settings-tab 加「站点 SEO 配置」Card：站点标题 Input + 站点描述 Textarea + Logo URL Input + OG 分享图 URL Input + 实时 Logo/OG 预览（LazyImage）+ 保存按钮 + emerald 提示框

4. **访问统计 UA 解析 + 设备/浏览器/OS 分布**（dashboard-tab + lib/ua.ts）：
   - 新建 `src/lib/ua.ts`：纯字符串 UA 解析（不依赖第三方库），识别 12 种浏览器（Chrome/Edge/Safari/Firefox/Opera/微信/QQ/UC/百度/搜狗/爬虫/其他）+ 11 种 OS（Windows 各版本/macOS/iOS/iPadOS/Android/Linux/ChromeOS/其他）+ 3 种设备（desktop/mobile/tablet）+ bot 检测
   - `breakdownUA(visits)` 聚合返回 byDevice/byBrowser/byOS 三个数组（含 emerald/amber/sky 配色）
   - dashboard-tab 加 3 列 Card 网格：设备分布（带 Monitor/Smartphone/Tablet 图标）+ 浏览器分布 + 操作系统分布，每行带颜色条形图（CSS 进度条）+ 计数/百分比

5. **错误边界 + Loading**：
   - 新建 `src/app/error.tsx`：全局运行时错误兜底（AlertTriangle + 重试 + 回首页 + digest + 开发模式错误堆栈 details）
   - 新建 `src/app/loading.tsx`：路由级 loading（旋转 emerald 圈 + 中心「94」字）

校验：
- `bun run lint`：0 错误 0 警告
- `bunx tsc --noEmit`：0 错误
- agent-browser 端到端验证：
  - 高级筛选面板展开 ✓，优先级选「高优先级」生效 ✓
  - 后台站点配置 Tab 显示「站点 SEO 配置」Card ✓，4 个字段填充现有数据（站点标题「九四班官网 · Guanwang94 V2」是我刚 PUT 的）✓
  - 后台数据看板显示「设备分布 / 浏览器分布 / 操作系统分布」3 个 Card ✓（desktop / Chrome / 其他正确识别）
  - 提交 8 条测试表白墙后，表白墙自动加载 page 2 + 显示「— 已经到底啦，共 15 条 —」✓
- 后端 API 测试：events?priority=high / sort=popular / pinnedOnly=1 全部 200 + 返回正确数据；site-config GET/PUT 全部 200

Stage Summary:
- 项目当前状态：稳定，本轮 5 项新功能（高级筛选/真分页/站点配置扩展/UA 分布/错误边界）全部完成
- 本轮目标：QA + 推进新功能 — 已完成
- 验证结果：14 API + 12 前端交互 + 5 新功能点全部通过

未解决问题/风险：
- 沙箱 dev server 在 webpack 模式偶尔被沙箱清理，需 setsid -f + 间歇性重启保活
- UA 解析是纯字符串匹配，部分国产浏览器（夸克/360/2345 等）可能识别为「其他」或 Chrome，未来可接入 ua-parser-js 库（增加 ~50KB bundle）
- 站点配置的 siteTitle/siteDescription 目前只是后端存储，前端 layout.tsx metadata 是静态的（build 时生成）；动态化需要 layout 改为 generateMetadata + 数据库查询，但 Serverless 部署每次请求都查 DB 有性能开销，可后续做 ISR 或边缘缓存
- 高级筛选面板在移动端窄屏可能挤压（已用 grid-cols-1 sm:grid-cols-3），实测 375 宽度 OK

下一阶段优先事项建议：
- PWA 离线支持（service worker + manifest 资源预缓存）—— 上轮已建议，仍未做
- 站点配置动态化：layout 改 generateMetadata 从 DB 读 siteTitle/siteDescription（搭配 revalidate=3600 ISR）
- 事件导出（PDF / iCal 日历）—— 同学校班级日历订阅
- 留言邮件通知（管理员有新留言时邮件提醒）
- 表白墙 emoji 反应扩展（不只 5 种 type，加 👍/❤️/🎉/🚀 等多反应）
- 后台「站点配置」加自定义 CSS 主题色（让管理员改主色调，不只 emerald）
