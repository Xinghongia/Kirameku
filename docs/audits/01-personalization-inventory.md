# 01 个性化与原作者信息清单

审计日期：2026-07-18  
边界：本文件只记录位置、类型、分类和建议；不修改任何个人化内容，不记录真实 secret 值。

## 原作者信息与部署配置

| 文件 | 位置/字段 | 当前内容类型 | 分类 | 建议 | 是否必须修改 |
|---|---|---|---|---|---|
| `Kirameku/siteConfig.ts` | `title`、`authorName` | 原作者站点名/作者名 | 原作者个人身份信息 | 下一阶段替换为当前站点身份 | 是 |
| `Kirameku/siteConfig.ts` | `url` | 原作者站点域名 | 原作者部署配置 | 替换或环境化 | 是 |
| `Kirameku/siteConfig.ts` | `avatarUrl` | `/images/hong.jpg` 头像路径 | 原作者个人身份信息/素材 | 替换头像素材或配置项 | 是 |
| `Kirameku/siteConfig.ts` | `cloudMusicPlaylistId` | 网易云歌单 ID | 原作者个人内容 | 替换为自有歌单或关闭音乐模块 | 是 |
| `Kirameku/siteConfig.ts` | `social.github`、`social.gitee` | 上游 GitHub/Gitee 链接 | 原作者身份/上游归属混合 | GitHub 源仓库可在许可证/致谢保留；社交入口应替换 | 是 |
| `Kirameku/siteConfig.ts` | `social.google`、`email`、`qq`、`wechat` | 邮箱/QQ/微信占位和个人联系入口 | 原作者/示例身份信息 | 替换或隐藏 | 是 |
| `Kirameku/siteConfig.ts` | `icpConfig`、`moeIcpConfig` | 备案号 | 原作者部署配置 | 生产部署必须替换或删除展示 | 是 |
| `Kirameku/next.config.ts` | `images.remotePatterns` | 原作者静态域名和 OSS 域名 | 原作者部署配置 | 替换为自有图片域名；保留第三方通用域名需评估 | 是 |
| `Kirameku/components/layout/Navbar.tsx` | Logo 彩蛋文案 | 原作者站点名 | 原作者个人身份信息 | 个性化时替换 | 是 |
| `Kirameku-backend/app/config.py` | CORS 默认值 | 默认含原作者域名 | 原作者部署配置 | 改为环境变量必填或本地默认 | 是 |
| `Kirameku-backend/app/api/github_auth.py` | `FRONTEND_ORIGIN` 默认值 | 原作者站点域名 | 原作者部署配置 | 必须环境化并设置当前前台域名 | 是 |
| `DEPLOY_NOTES.md`、`nginx-cache-debug.md` | 部署排障示例 | 原作者域名、部署经历 | 示例/部署历史 | 可保留为历史笔记，也可迁移到私有知识库后精简 | 可改 |
| `README.md` | 上游项目描述和截图/徽章 | 项目说明 | 上游项目归属/普通说明 | 个性化 README 时区分许可证归属和站点身份 | 可改 |
| `LICENSE` | MIT | 许可证 | 上游项目归属、许可证 | 不得删除；如 fork 需保留许可 | 否 |

## 演示数据与素材

| 文件/目录 | 内容类型 | 分类 | 建议 | 是否必须修改 |
|---|---|---|---|---|
| `Kirameku/public/images/hong.jpg` | 头像图片 | 原作者个人素材 | 替换为当前站点头像 | 是 |
| `Kirameku/public/images/*.webp`、`default-cover.jpg`、`photo-wall.jpg` | 背景/封面/照片墙素材 | 示例/演示内容 | 梳理版权和用途，替换个人照片 | 是/可改 |
| `Kirameku/public/live2d/` | Live2D 模型、动作、音频 | 第三方素材/可选功能 | 单独核查授权；不确定时默认关闭或替换 | 可改，需谨慎 |
| `项目图片/` | 项目图片素材 | 示例/演示内容 | 核对是否属于当前项目可公开素材 | 可改 |
| `Kirameku/app/projects/projectsData.ts` | 项目 fallback 数据 | 示例/演示内容 | 替换为当前项目或改为纯后端数据 | 是 |
| `Kirameku/app/about/about.md` | 关于页内容 | 原作者/示例内容 | 个性化替换 | 是 |
| `Kirameku-backend/init_db.sql` | 默认管理员、初始站点配置、演示数据 | 示例/演示内容 | 上线前重置管理员和演示数据；不要在本任务修改 | 是 |
| `Kirameku-backend/DATABASE.md`、`fancy-meandering-rain.md` | 数据库说明/模型笔记 | 文档/示例 | 与真实模型同步后再保留 | 可改 |
| `Kirameku-backend/admin/src/assets/user.jpg`、login assets | 后台模板素材 | Pure Admin 模板素材 | 区分模板版权与个人头像，按品牌替换 | 可改 |
| `Kirameku-backend/admin/build/static/*` | 已跟踪后台构建产物 | 构建产物/模板残留 | 后续考虑是否从仓库移除或明确用途；本次不删除 | 可改 |

## 功能保留、关闭、删除或配置化建议

| 功能 | 当前位置 | 初步建议 | 理由 |
|---|---|---|---|
| 首页、文章、分类、标签 | 前台 `/`、`/posts`，后端 posts/categories/tags | 核心保留 | 个人博客基础能力。 |
| 评论、留言、GitHub OAuth | `/posts/[slug]`、`/messages`、`github_auth.py` | 配置化开关 | 需要 OAuth 配置和审核，公开写入接口需安全复查。 |
| 说说 | `/moments`、`chatters.py` | 可选保留 | 个人内容模块，可作为短动态。 |
| 收藏夹 | `/bookmark`、`bookmarks.py` | 可选保留/配置化 | 有价值，但演示数据和 favicon 依赖需清理。 |
| 项目展示 | `/projects`、`projects.py` | 核心保留 | 适合作为个人站点核心页面。 |
| 友链 | `/friends`、`friend_links.py` | 可选保留 | 需要审核流程和头像资源清理。 |
| 照片墙/相册 | `/photowall`、`albums.py` | 可选保留 | 依赖个人素材和 OSS 上传。 |
| 时间线/归档 | `/timeline` | 核心保留 | 文章归档能力。 |
| 音乐播放器 | `/music`、`siteConfig.cloudMusicPlaylistId` | 建议配置化开关 | 依赖第三方音乐服务和个人歌单 ID。 |
| 小说阅读 | `/novel`、`/reader3` rewrite | 建议配置化开关 | 依赖独立 reader 服务，非核心博客能力。 |
| Live2D | `public/live2d`、布局组件 | 建议配置化开关 | 体积、版权和个性化风险较高。 |
| Garden/工具箱 | `/garden/*`、`components/widgets/toolbox` | 可选保留/分组开关 | 功能丰富但 lint 问题集中，依赖大量外部 API。 |
| 管理后台 | `Kirameku-backend/admin` | 核心保留，但先修基线 | 当前 typecheck/build/dev 均有阻塞，需要先建立可运行基线。 |
| 访客统计 | `VisitorTracker`、`visitors.py` | 配置化并安全复查 | 涉及 IP、地理位置和公开删除接口风险。 |

## 必改、可改、暂缓、不得删除

必改：

- 站点名、作者名、头像、关于页、备案号、个人社交链接、原作者域名、OSS 域名、音乐歌单 ID。
- 后端 `FRONTEND_ORIGIN`、CORS 默认域名、部署配置中的原作者域名。
- 默认管理员和演示数据上线前治理。

可改：

- Live2D、音乐、小说、工具箱、访客统计等非核心模块改成配置开关。
- 后台模板素材、Pure Admin 未使用页面和 optimizeDeps 模板残留。
- 部署排障文档可归档到私有知识库，公开仓库保留精简版。

暂缓：

- 删除功能、删除素材、大规模重构、依赖升级、CI/Docker 新增。
- 数据库迁移体系设计应在可运行基线稳定后单独做。

不得删除：

- `LICENSE`。
- 合法必须保留的上游归属、第三方版权和模板许可证。
- 仍被页面引用但尚未替换的素材，需先完成引用清单和替换方案。

## 敏感文件与 Secret 审计结论

已跟踪文件中未发现真实 `.env`；但以下内容需要注意：

- `Kirameku-backend/.env.example` 和 `Kirameku/.env.example` 仅为示例变量。
- `Kirameku-backend/admin/.env.development/.env.production/.env.staging` 被跟踪，但内容是 Vite public path/router/CDN/compression 等公开配置，不含 secret。
- `Kirameku-backend/admin/mock/login.ts`、`mock/refreshToken.ts` 含模板 JWT 样式字符串，归类为 mock 示例，不应当作真实 secret。
- `Kirameku-backend/init_db.sql` 明确包含默认管理员和默认密码说明，必须在上线前单独处理。
- 本地 `Kirameku-backend/.env` 存在但未跟踪，本次未读取值，不应提交。
