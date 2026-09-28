# 九四班官网（Guanwang94）部署教程 · 保姆级

> 本教程手把手带你把九四班官网部署上线，最终域名 `guanwang94.saozi.cc.cd`，使用 Vercel（免费）+ Turso（免费 9GB SQLite 云数据库）+ Cloudflare DNS。
>
> 全程不需要服务器、不需要 Python、不需要 ZIP 上传。全部在浏览器里点点点完成。
>
> **预计耗时：30-45 分钟**

---

## 0. 部署架构总览

```
访客浏览器 → Cloudflare DNS → Vercel Edge CDN → Next.js App (Serverless)
                                                    ↓
                                                Turso (libsql SQLite 云数据库)
```

| 组件 | 平台 | 作用 | 免费额度 |
|---|---|---|---|
| 前端 + API | **Vercel** | 跑 Next.js，全球 CDN | 个人版永久免费 |
| 数据库 | **Turso** | SQLite 云数据库，Prisma 直连 | 9GB / 500 数据库 / 10 亿次读 |
| 域名 DNS | **Cloudflare**（你已有） | 把 `guanwang94.saozi.cc.cd` 指向 Vercel | 免费 |

**关键：同一份代码，沙箱预览和线上 Vercel 完全一致，只换一个 `DATABASE_URL` 环境变量。**

---

## 1. 前置准备（5 分钟）

确保你有以下账号，全部免费注册：

- ✅ **GitHub 账号**（https://github.com）— 用来托管代码
- ✅ **Vercel 账号**（https://vercel.com）— 用 GitHub 账号一键登录
- ✅ **Turso 账号**（https://turso.tech）— 用 GitHub 账号一键登录
- ✅ **Cloudflare 账号**（你已有，因为域名已托管）

> 你已有 Cloudflare，跳过那一步。

---

## 2. 把代码推到 GitHub（5 分钟）

### 2.1 在 GitHub 创建仓库

1. 登录 https://github.com/new
2. **Repository name** 填：`guanwang94`
3. **Visibility** 选 `Private`（班级站私密更安全）
4. **不要勾** "Add a README" / "Add .gitignore" / "Choose a license"（保持空仓库）
5. 点 **Create repository**
6. 复制页面上你的仓库地址，形如：`https://github.com/你的用户名/guanwang94.git`

### 2.2 在本机把项目推上去

> 本教程假设你电脑已装 Git。Windows 用 Git Bash，Mac/Linux 用终端。

在你的项目根目录（包含 `package.json` 的那个文件夹）依次执行：

```bash
# 初始化 git
git init
git add .
git commit -m "feat: 九四班官网初始化"

# 把下面这行里的 用户名 换成你的 GitHub 用户名
git remote add origin https://github.com/你的用户名/guanwang94.git

# 推送
git branch -M main
git push -u origin main
```

第一次推送时会让你登录 GitHub，按提示用浏览器授权即可。

**注意**：推送前请确认项目根目录的 `.gitignore` 包含以下内容（一般 Next.js 模板自带，检查一下）：

```
node_modules
.next
.env
.env.local
*.log
db/*.db
db/*.db-journal
```

这样不会把数据库文件、依赖、密钥推上去。

---

## 3. 创建 Turso 云数据库（5 分钟）

### 3.1 注册并登录

1. 打开 https://turso.tech
2. 右上角 **Sign in** → 用 GitHub 登录
3. 授权后跳到 https://app.turso.tech

### 3.2 创建数据库

1. 左侧菜单点 **Databases** → 右上角 **New database**
2. **Name** 填：`guanwang94`（全小写）
3. **Location** 选 `nrt`（东京，离中国最近）或 `hkg`（香港，如果可选）
4. 点 **Create**

### 3.3 获取连接信息

数据库创建好后，点数据库名进入详情页，你会看到三块信息：

| 字段 | 示例值 | 用途 |
|---|---|---|
| **Database URL** | `libsql://guanwang94-你的用户名.turso.io` | 待会填到 Vercel 的 `DATABASE_URL` |
| **Auth Token** | `eyJhbGciOiJF...一长串` | 待会填到 Vercel 的 `DATABASE_AUTH_TOKEN` |

把这两个值先复制到记事本备用。

> ⚠️ Auth Token 只显示一次。如果关掉了，可以在数据库详情页点 **Settings → Tokens** 重新生成。

---

## 4. 部署到 Vercel（10 分钟）

### 4.1 导入仓库

1. 打开 https://vercel.com → 右上角 **Log In** → 用 GitHub 登录
2. 登录后跳到 https://vercel.com/dashboard
3. 点 **Add New...** → **Project**
4. 在 "Import Git Repository" 列表里找到 `guanwang94` 仓库
5. 点 **Import**

### 4.2 配置项目

Vercel 会自动识别为 Next.js 项目，**保持默认即可**：

- **Framework Preset**: Next.js（自动检测）
- **Build Command**: `next build`（自动）
- **Output Directory**: `.next`（自动）
- **Install Command**: 自动

**先不要点 Deploy**，往下拉到 **Environment Variables**，添加以下 4 个变量：

| Name | Value | 说明 |
|---|---|---|
| `DATABASE_URL` | `libsql://guanwang94-你的用户名.turso.io` | 第 3 步复制的 Turso URL |
| `DATABASE_AUTH_TOKEN` | `eyJhbGciOiJF...` | 第 3 步复制的 Turso Auth Token |
| `ADMIN_USERNAME` | `CarreyHui` | 管理员账号（可改） |
| `ADMIN_PASSWORD` | `syh20120509` | 管理员密码（建议改成你自己的强密码） |
| `JWT_SECRET` | （点下面说明生成） | Token 签名密钥 |
| `NEXT_PUBLIC_SITE_URL` | `https://guanwang94.saozi.cc.cd` | 站点完整 URL（用于 RSS/sitemap/manifest） |

**生成 JWT_SECRET**：在终端跑这一行（任何机器都行），把输出复制：

```bash
openssl rand -hex 32
```

如果没有 openssl，用这个在线工具：https://generate-random.org/api/random-hex?length=64

> ⚠️ JWT_SECRET 一旦部署后**不要再改**，否则所有已登录用户和已通过门控的访客会被踢下线。

### 4.3 部署

填完环境变量后，点 **Deploy**。

Vercel 会自动 `bun install` + `next build`，约 60-90 秒完成。

部署成功后，你会看到 **"Congratulations"** 庆祝页面，并给你一个预览域名，形如：
```
guanwang94-你的用户名.vercel.app
```

**点这个域名打开**，应该能看到九四班官网首页 + 访问门控弹窗。输入 `1234` 进入官网。

🎉 到这一步，网站已经能访问了。下面绑你自己的域名。

---

## 5. 绑定自定义域名 `guanwang94.saozi.cc.cd`（10 分钟，含 Cloudflare DNS 配置）

### 5.1 在 Vercel 添加域名

1. 进入 https://vercel.com/dashboard → 点你刚部署的 `guanwang94` 项目
2. 顶部菜单点 **Settings** → 左侧 **Domains**
3. 输入框填：`guanwang94.saozi.cc.cd` → 点 **Add**
4. Vercel 会显示一段提示，告诉你需要添加什么 DNS 记录。**保持这个页面开着**，它会显示一个 **CNAME 值**，形如：
   ```
   cname.vercel-dns.com
   ```
   或者（如果你的主域 `saozi.cc.cd` 也是 Vercel 项目，可能提示 A 记录 `76.76.21.21`）。**记下 Vercel 显示给你的值**。

### 5.2 在 Cloudflare 配置 DNS

1. 登录 https://dash.cloudflare.com
2. 左侧选择你的域名 `saozi.cc.cd`
3. 顶部菜单点 **DNS** → **Records**
4. 点 **Add record**
5. 按以下填：

   | 字段 | 值 | 说明 |
   |---|---|---|
   | **Type** | `CNAME` | 选 CNAME |
   | **Name** | `guanwang94` | 只填子域前缀，不要填完整域名 |
   | **Target** | `cname.vercel-dns.com` | 第 5.1 步 Vercel 提示的值 |
   | **Proxy status** | ⚠️ **DNS only（灰色云朵）** | **重要！** 不要开橙色代理，否则 Vercel SSL 会冲突 |
   | **TTL** | Auto | 默认 |

6. 点 **Save**

> ⚠️ **Cloudflare 代理（橙色云朵）和 Vercel 的冲突**：
> - 如果你把云朵打开（橙色 / Proxied），Cloudflare 会接管 SSL，Vercel 拿不到真实访客 IP，且可能出现重定向循环。
> - **首次绑定请保持灰色云朵（DNS only）**。
> - 部署成功后，如果你坚持要 Cloudflare 代理（为了 WAF/DDoS 防护），可以再开橙色，但要在 Cloudflare SSL 设置里把模式改为 **Full (strict)**，并在 Rules 里关掉 "Always Use HTTPS" 由 Vercel 处理重定向。新手不建议。

### 5.3 回 Vercel 验证域名

1. 回到 Vercel 域名设置页（第 5.1 步那个页面）
2. 等 1-5 分钟（DNS 全球生效）
3. Vercel 会自动检测到 DNS 已生效，状态变为 **Valid Configuration** ✓
4. Vercel 会自动签发 SSL 证书（Let's Encrypt），约 1 分钟

### 5.4 测试访问

打开浏览器，访问：
```
https://guanwang94.saozi.cc.cd
```

应该看到九四班官网 + 访问门控。

🎉 **域名绑定完成！**

---

## 6. 首次使用 & 初始化数据库（重要！）

Vercel 部署的 Next.js 是 Serverless，**没有本地文件数据库**，所以 Turso 数据库现在是空的。需要执行一次种子初始化。

### 6.1 方案 A：本地脚本初始化 Turso（推荐）

在你的本机项目目录执行：

```bash
# 1. 临时把 DATABASE_URL 指向 Turso（仅本次执行）
export DATABASE_URL="libsql://guanwang94-你的用户名.turso.io"
export DATABASE_AUTH_TOKEN="你的Turso Auth Token"

# 2. 推 schema 到 Turso
bun run db:push

# 3. 跑种子脚本（写入 8 条示例事件 + 表白墙/留言/配置）
bun run src/lib/seed.ts
```

看到输出：
```
Seeding database...
Seed completed!
- Events: 8
- Confessions: 6
- Messages: 4
- Visits: 30
```

表示种子成功。

### 6.2 方案 B：用 Turso CLI（如果你装了）

```bash
# 安装 Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 登录
turso auth login

# 切到你的数据库
turso db shell guanwang94

# 在 shell 里把 prisma/schema.prisma 转成 SQL 粘贴执行
# （或者用 prisma migrate，方案 A 更简单）
```

### 6.3 重新访问验证

回到 `https://guanwang94.saozi.cc.cd`：
1. 刷新页面（Ctrl+Shift+R 强制刷新清缓存）
2. 输入访问令牌 `1234` 进入官网
3. 应该能看到 8 条示例事件、6 条表白墙、4 条留言、班级介绍等

---

## 7. 管理员使用指南

### 7.1 登录管理员

1. 进入官网（先过访问门控）
2. 右上角点 **管理员登录**（锁图标）
3. 输入第 4.2 步配置的 `ADMIN_USERNAME` / `ADMIN_PASSWORD`
4. 登录后，右上角出现 **后台** + **退出** 按钮

### 7.2 进入后台管理

点 **后台** 按钮，弹出 6 Tab 管理面板：

| Tab | 功能 |
|---|---|
| **数据看板** | 总事件数/总访问量/总留言数/今日访问 + 7 天趋势折线图 + Top10 事件柱状图 + 最近 20 条访问记录 |
| **发布事件** | 填写标题/摘要/Markdown 正文/封面图/分类/优先级/标签/发布时间/置顶 → 点发布 |
| **管理事件** | 列表 + 预览/置顶切换/编辑/删除（确认弹窗） |
| **管理留言** | 列表 + 回复（内联展开 textarea）/删除 |
| **管理表白墙** | 列表 + 删除 |
| **站点配置** | 修改访问令牌（保存后旧令牌失效，所有客户端需重新输入） |

### 7.3 修改关于我们

1. 在官网首页底部找到 **关于我们** 区
2. 右上角点 **管理员编辑**（仅管理员可见）
3. 弹出 Modal，可改 7 个字段：班级名/班训/简介/班主任/班主任寄语/班委名单/联系方式
4. 保存后前台立即生效

---

## 8. 日常维护

### 8.1 更新代码后自动部署

只要你 `git push` 到 GitHub 的 `main` 分支，Vercel 会自动重新部署。**不需要手动操作**。

### 8.2 改管理员密码

1. 去 https://vercel.com → 你的项目 → **Settings** → **Environment Variables**
2. 改 `ADMIN_PASSWORD` 的值
3. 保存（会自动触发 redeploy）或手动 **Redeploy**
4. 旧密码失效，新密码生效

### 8.3 备份数据库

Turso 支持导出 SQL：

```bash
turso db shell guanwang94 ".dump" > backup-$(date +%Y%m%d).sql
```

建议每月备份一次，存到你的网盘。

### 8.4 查看访问日志

后台 → 数据看板 → 最近 20 条访问记录，可以看到 path/IP Hash/UA/来源/时间。

### 8.5 监控

Vercel 免费版有基本监控：https://vercel.com/dashboard → 你的项目 → **Analytics** / **Logs**。
能看到访问量、状态码、错误日志。

---

## 9. 常见问题（FAQ）

### Q1: 部署后页面显示 "需要访问令牌"，但输入 1234 提示"令牌已失效"

**原因**：Turso 数据库是空的，没有 site_config 记录。
**解决**：执行第 6 步初始化数据库（`bun run db:push` + `bun run src/lib/seed.ts`）。

### Q2: 部署成功但访问 500 错误

**原因**：环境变量没填全，或 Turso 连接失败。
**解决**：
1. Vercel → 项目 → Settings → Environment Variables，确认 6 个变量都填了
2. Vercel → 项目 → Deployments → 最新部署 → 点 **Logs** 看具体错误
3. 常见错误：`DATABASE_AUTH_TOKEN` 错了 → 去 Turso 重新生成

### Q3: 域名访问显示"重定向次数过多"

**原因**：Cloudflare 代理（橙色云朵）和 Vercel SSL 冲突。
**解决**：
- 方案 1（推荐新手）：Cloudflare DNS 把该记录改为 **DNS only（灰色云朵）**
- 方案 2（坚持要 CF 代理）：Cloudflare → SSL/TLS → 模式改为 **Full (strict)**；Cloudflare → Rules → 关掉 "Always Use HTTPS"（让 Vercel 处理）

### Q4: 部署后图片显示不出

**原因**：相册图片用 `https://picsum.photos/seed/xxx/800/600`，需要外网访问。
**解决**：picsum 是公共服务，偶尔慢。如果想稳定，可换成：
- 七牛云/阿里云 OSS 图床
- 或在 `src/components/sections/gallery-section.tsx` 里把图片 URL 换成你自己的图床

### Q5: 我能不能不用 Turso，用 Vercel Postgres？

可以，但需要改 `prisma/schema.prisma` 的 `provider` 从 `sqlite` 改成 `postgresql`，并改 `db.ts` 适配。免费额度：Vercel Postgres 60 小时/月计算 + 256MB 存储。班级站够用，但配置比 Turso 复杂。**新手建议用 Turso**。

### Q6: 怎么把访问令牌从 1234 改成自定义？

登录管理员 → 后台 → **站点配置** Tab → 输入新令牌 → 保存。
**注意**：保存后所有已通过门控的访客会被踢出，需要重新输入新令牌。

### Q7: 部署后想加新功能怎么改？

1. 本地改代码
2. `git add . && git commit -m "xxx" && git push`
3. Vercel 自动部署，1-2 分钟后线上生效
4. 如果改了数据库 schema（`prisma/schema.prisma`），需要本地执行 `bun run db:push` 同步到 Turso

### Q8: Vercel 免费版限制？

- 100GB 流量/月（班级站足够）
- 100GB-Hours Serverless 函数执行
- 每次请求最长 10 秒（首页/API 都在 1 秒内，够用）
- 不支持 cron jobs（免费版）

如果你站点流量很大，可考虑升级 Pro 版（$20/月）。班级站免费版够用。

### Q9: 能不能本地运行（不上线）？

可以。本地：
```bash
bun install
bun run db:push  # 用本地 SQLite
bun run src/lib/seed.ts  # 灌种子数据
bun run dev  # 启动开发服务器
# 访问 http://localhost:3000
```

### Q10: 部署后想彻底删除？

1. Vercel → 项目 → Settings → Advanced → Delete Project
2. Turso → 数据库 → Delete
3. GitHub → 仓库 → Settings → Delete repository
4. Cloudflare → DNS → 删除 `guanwang94` 那条 CNAME 记录

---

## 10. 最终验收清单

部署完成后，逐项确认：

- [ ] 访问 `https://guanwang94.saozi.cc.cd` 显示访问门控
- [ ] 输入 `1234` 进入官网，看到 8 条示例事件
- [ ] 点事件卡片打开详情 Modal，Markdown 正文正常渲染
- [ ] 点相册图片打开 Lightbox，可上一张/下一张
- [ ] 表白墙选类型 + 输内容 + 发布成功
- [ ] 留言区填表 + 提交成功
- [ ] 右上角管理员登录 → `CarreyHui` / `syh20120509` → 成功
- [ ] 后台 6 Tab 全部能打开
- [ ] 发布一条新事件 → 前台立即显示
- [ ] 修改访问令牌 → 旧令牌失效
- [ ] 切换暗色主题 → 全站变暗
- [ ] `/rss.xml` 返回 RSS XML
- [ ] `/sitemap.xml` 返回 sitemap
- [ ] `/robots.txt` 返回 robots
- [ ] 手机打开（375×812）布局正常
- [ ] console 无错误

全部 ✓ 即部署成功！

---

## 11. 紧急联系方式

| 问题类型 | 联系 |
|---|---|
| Vercel 部署问题 | https://vercel.com/help |
| Turso 数据库问题 | https://docs.turso.tech |
| Cloudflare DNS 问题 | https://developers.cloudflare.com/dns |
| Prisma 问题 | https://www.prisma.io/docs |
| Next.js 问题 | https://nextjs.org/docs |

---

## 🎉 恭喜！

你的九四班官网已经上线，可以分享给同学、家长、校友使用了！

把 `https://guanwang94.saozi.cc.cd` 和访问令牌（建议改成自定义）发到班级群里，大家输入令牌即可浏览。

—— Made with 💗 by 九四班
