# 01 项目基线审计报告

审计日期：2026-07-18  
执行分支：`chore/project-baseline-audit`  
基线分支：`main`  
基线提交：`f11ff3c docs: add project baseline audit design`  
远程：`origin https://github.com/wan719/Kirameku-li.git`，`upstream https://github.com/Xinghongia/Kirameku.git`

## 执行摘要

本次审计只进行只读检查、运行验证和文档建设，未进行个性化、依赖升级、功能删除或业务重构。任务开始时 `git status --short` 为空；但 ignored 状态中已存在本地 `Kirameku/node_modules`、`Kirameku/.next`、`Kirameku-backend/venv`、后端 `__pycache__`，并且 `Kirameku-backend/.env` 存在于本地但未跟踪。本次未读取该 `.env` 的值。

仓库由 Next.js 前台、FastAPI 后端、Vue/Pure Admin 管理后台、文档/部署笔记和项目图片组成。当前主线能够完成前台生产构建，前台开发服务器可启动并访问主要页面；但前台 lint 存在 React Hooks、`any`、未使用变量和 `<img>` 警告。后端 Python 语法编译通过，但依赖安装被 PyPI SSL/索引问题阻塞，且既有 venv 缺 `psycopg2`，导致 FastAPI 无法导入启动。管理后台依赖安装被 pnpm 11 ignored-builds 策略阻塞，直接 typecheck 存在类型错误，直接 Vite build 因缺少 `tippy.js` CSS 依赖失败，dev server 可监听但页面预转换同样报缺依赖。

## 模块结构

| 模块 | 技术栈 | 启动入口 | 构建入口 | 依赖 | 产物/职责 | 定位 |
|---|---|---|---|---|---|---|
| `Kirameku/` | Next.js 16.2.4、React 19.2.4、TypeScript、Tailwind 4、Framer Motion | `next dev` | `next build` | FastAPI `/api`、uploads、reader 服务、外部图片/音乐/API | 博客前台、工具页、小说阅读、RSS | 核心 |
| `Kirameku-backend/` | FastAPI 0.115.6、SQLModel、PostgreSQL、JWT、OSS | `uvicorn app.main:app` | 无独立 build | PostgreSQL、OSS、GitHub OAuth | REST API、uploads 静态目录、挂载管理后台 | 核心 |
| `Kirameku-backend/admin/` | Vue 3.5、Vite 8、Pure Admin、Element Plus、Pinia、Axios | `vite` / `pnpm dev` | `vite build` / `pnpm build` | FastAPI `/api`、Token Cookie/localStorage | 管理后台，理论产物 `dist/` 由 FastAPI `/admin` 挂载 | 核心管理能力 |
| `docs/` | Markdown | 无 | 无 | 无 | 审计设计和本次报告 | 文档 |
| `项目图片/` | 静态图片 | 无 | 无 | 无 | 项目素材 | 可选素材 |
| 可选阅读服务 | README 提到 reader-master，根 `.gitignore` 忽略 `reader-master/` | `java -jar reader-master.jar` | 外部构建 | 端口 8085，经 `/reader3` 代理 | 小说搜索/章节/阅读 | 可选 |

## 三端验证结论

| 目标 | 结果 | 证据摘要 |
|---|---|---|
| 前台依赖安装 | 阻塞/不完整 | `pnpm install --frozen-lockfile` 首次 125s 超时；后续由 pnpm 状态检查安装依赖，但以 `ERR_PNPM_IGNORED_BUILDS` 失败，涉及 `sharp`、`unrs-resolver`。 |
| 前台 lint | 失败 | `eslint app components --max-warnings 0` 返回 154 problems：89 errors、65 warnings。代表性问题在 `app/garden/color/page.tsx`、`app/garden/python/page.tsx`、多个 toolbox game 组件。 |
| 前台 build | 成功 | `next build` 退出 0，生成 39 个 app routes；构建日志提示 RSS generation 因 `127.0.0.1:8000` 未启动而 `ECONNREFUSED`，但未导致构建失败。 |
| 前台 dev/page | 可启动，主要页面可访问 | `next dev --hostname 127.0.0.1 --port 3000` Ready；`/`、`/posts`、`/projects`、`/about` HTTP 200。日志有后端未启动导致的 `fetch failed ECONNREFUSED`。 |
| 后端 venv | 成功 | `python -m venv venv` 退出 0，使用既有 venv。 |
| 后端 pip install | 失败 | `pip install -r requirements.txt` 在 `psycopg2-binary==2.9.10` 因 PyPI SSL EOF/无可用版本失败。 |
| 后端 compileall | 成功 | `python -m compileall app` 退出 0。 |
| 后端启动/health/docs | 阻塞 | 使用 `PYTHON_DOTENV_DISABLED=1` 和哑变量启动，导入 `app.database` 时 `ModuleNotFoundError: No module named 'psycopg2'`。因此 `/api/health`、`/docs`、OpenAPI 未能验证。 |
| 管理后台 install | 超时/失败 | `pnpm install --frozen-lockfile` 244s 超时；随后 pnpm 依赖状态检查以 `ERR_PNPM_IGNORED_BUILDS` 失败，并提示 `package.json` 的 `pnpm` 字段不再读取。 |
| 管理后台 typecheck | 失败 | `vue-tsc --noEmit --skipLibCheck` 报 `RefreshTokenResult` 未导出、`expires` 类型不匹配、评论 `replies` 类型缺失、UploadRequestHandler 返回值等问题。 |
| 管理后台 lint | 阻塞 | `pnpm lint` 会执行 `--fix`/`--write`，不适合本次只读审计；直接 `eslint --max-warnings 0 src mock build` 运行 184s 超时。 |
| 管理后台 build | 失败 | `pnpm build` 先被 pnpm ignored-builds 阻塞；直接 `vite build` 最终因 `src/main.ts` 中 `tippy.js/dist/tippy.css` / `tippy.js/themes/light.css` 无法解析失败。 |
| 管理后台 dev/page | 部分可启动但页面不可完整转换 | `vite --host 127.0.0.1 --port 8848` 可监听；日志显示 optimizeDeps 多个模板依赖缺失，并因 `tippy.js` CSS 无法解析报 pre-transform error。 |

## 外部依赖

| 外部依赖 | 使用模块 | 是否核心 | 本地是否必需 | 失败降级 |
|---|---|---|---|---|
| PostgreSQL | 后端 SQLModel、所有业务 API | 是 | 后端启动需要可用驱动和数据库连接 | 当前启动前被缺 `psycopg2` 阻塞；即使驱动齐全，`init_db()` 会在 lifespan 连接数据库。 |
| 阿里云 OSS | `/api/upload/image`、后台上传 | 管理侧核心 | 上传功能必需 | 缺变量会在 `app.config` 导入阶段失败，不是单功能降级。 |
| GitHub OAuth | 前台评论/留言登录、后端 `/api/auth/github/*` | 可选互动能力 | 非核心浏览可不用 | 未配置 `GITHUB_CLIENT_ID` 时登录接口 500。 |
| reader 服务 | 前台 `/novel`，Next rewrite `/reader3` | 可选 | 小说功能必需 | 默认代理到 `http://localhost:8085`，服务缺失时小说搜索/阅读失败。 |
| 网易云/Meting | 前台音乐页 | 可选 | 音乐功能必需 | 歌单 ID 保留在 `siteConfig.ts`，依赖外部服务可用性。 |
| 远程图片域名 | Next image remotePatterns | 可选/展示相关 | 远程图片展示必需 | 原作者域名仍在白名单中。 |
| `v2.xxapi.cn`、`uapis.cn`、`api.db-ip.com` | 工具箱、访客定位 | 可选 | 对应工具页必需 | 调用失败影响单个工具，不应阻塞核心博客。 |

## 测试、部署、安全和工程风险

| 类别 | 现状 | 风险 |
|---|---|---|
| 测试 | 未发现前台单元/E2E、后端 pytest、后台测试配置。 | 主要依赖 lint/typecheck/build，回归保护弱。 |
| 包管理 | 前台和后台均同时存在 `pnpm-lock.yaml` 与 `package-lock.json`；后台 `packageManager` 缺失，pnpm 11 不再读取旧 `pnpm` 字段。 | 新环境安装行为不稳定，ignored-builds 会阻塞脚本。 |
| 后端配置 | `app.config` 对数据库、JWT、OSS 使用 `os.environ[...]` 强制读取。 | 缺任一变量即启动失败；`/api/health` 无法作为纯健康探针。 |
| 数据库 | `init_db.sql` 与 SQLModel 大体同表；未发现迁移工具；存在默认管理员和演示数据。 | 生产变更缺迁移路径；默认账号需要上线前单独治理。 |
| 鉴权 | 多数管理写接口使用 `Depends(get_current_user)`；访客删除接口未见鉴权依赖。 | 部分写/删接口需复查授权边界。 |
| 上传 | 上传接口依赖 OSS，未见本次范围内的文件大小/类型白名单详审。 | 上传安全和错误处理需下一阶段单独检查。 |
| 部署 | 根目录有 `DEPLOY_NOTES.md`、`nginx-cache-debug.md`，后台有 Dockerfile；未发现 compose/GitHub Actions。 | 部署知识分散，CI/CD 和备份策略缺失。 |
| 静态资源 | 前台 `public/live2d` 和图片资源较大；后台跟踪 `admin/build/static` 产物。 | 仓库体积、版权归属、构建产物污染风险。 |

## 阻塞问题

1. pnpm 11 ignored-builds 阻塞前台和后台的标准 `pnpm` 脚本状态检查。
2. 后端 requirements 安装因 PyPI SSL/索引访问失败，且既有 venv 缺 `psycopg2-binary`。
3. 后端配置强制要求数据库、JWT、OSS 全部存在，导致健康检查不能独立启动。
4. 后台缺 `tippy.js` 直接依赖或依赖解析配置，Vite build/dev 预转换失败。
5. 后台 typecheck 存在多处接口类型与视图类型不一致。
6. 前台 lint 存在大量 React Hooks 新规则和 TypeScript 规则问题。

## 下一阶段建议

下一阶段应先做“可运行基线修复”设计，再做个性化。建议顺序：固定包管理策略和 pnpm ignored-builds 配置；补齐后端驱动安装/本地数据库 runbook；将后端 health 与可选 OSS/GitHub 配置解耦；补齐后台缺失依赖和类型契约；最后依据 `01-personalization-inventory.md` 清理原作者站点信息。
