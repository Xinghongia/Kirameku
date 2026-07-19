# 02 可运行基线修复执行报告

- 执行日期：2026-07-19
- 基线：`origin/main` @ `eb6b223d5090560daaba596327de97bc86d5daed`
- 执行分支：`fix/runnable-baseline`
- 环境：Windows PowerShell、Node.js `24.15.0`、pnpm `11.9.0`、Python `3.9.1`

## 1. 执行摘要

本次严格限定于可运行基线修复。前台和管理后台统一为 pnpm 11 单锁文件工作流，并通过逐包 `allowBuilds` 管理安装脚本。前台标准安装、生产构建和四个主要页面通过验证。FastAPI 补齐直接依赖，默认不自动建表，无 OSS 时可以启动；liveness、readiness、OSS 降级和最小管理员鉴权已有回归测试。管理后台补齐 `tippy.js`，移除无效 `optimizeDeps` 项，修复已知类型契约并通过 typecheck、build 和 dev 验证。

未进行页面个性化、全量前台 Lint 清理、框架大版本升级、数据库切换、Docker 或 CI 建设。未读取、修改或提交真实 `.env` 值；后端测试和运行验证显式使用 `PYTHON_DOTENV_DISABLED=1` 与临时测试变量。

## 2. 修改文件清单

| 范围 | 文件 | 变更 |
|---|---|---|
| 根文档 | `README.md` | 补充实测版本、pnpm、健康检查、数据库和 OSS 运行边界。 |
| 前台 | `Kirameku/package.json` | 声明 pnpm 11；跨平台清理；通过参数兼容脚本启动 Next。 |
| 前台 | `Kirameku/scripts/next-dev.mjs` | 兼容验收命令中 pnpm 11 透传的独立 `--`。 |
| 前台 | `Kirameku/pnpm-workspace.yaml` | 单包 workspace；逐包允许 `sharp`、`unrs-resolver`。 |
| 前台 | `Kirameku/package-lock.json` | 删除 npm 锁文件。 |
| 后端 | `Kirameku-backend/requirements.txt` | 增加 `python-dotenv==1.1.1`。 |
| 后端 | `Kirameku-backend/.env.example` | 增加 `AUTO_CREATE_TABLES`；标明 OSS 可选。 |
| 后端 | `Kirameku-backend/app/config.py` | 显式 dotenv 禁用守卫、自动建表开关、OSS 可选读取。 |
| 后端 | `Kirameku-backend/app/database.py` | 增加数据库 `SELECT 1` 检查。 |
| 后端 | `Kirameku-backend/app/main.py` | 条件建表和 `/api/health/ready`。 |
| 后端 | `Kirameku-backend/app/api/upload.py` | OSS 配置不完整时返回 503。 |
| 后端 | `Kirameku-backend/app/api/visitors.py` | 三个访客管理接口增加现有鉴权依赖。 |
| 后端 | `Kirameku-backend/app/api/dashboard.py` | dashboard 统计增加现有鉴权依赖。 |
| 后端 | `Kirameku-backend/app/utils/auth.py` | 缺 Token 返回 401；要求现有 Token 含 `admin: true`。 |
| 后端测试 | `Kirameku-backend/tests/test_runnable_baseline.py` | 10 项启动、健康检查、OSS、公开路由和鉴权回归测试。 |
| 后台包管理 | `Kirameku-backend/admin/package.json` | pnpm 11、`tippy.js`、`cross-env`、只读 Lint、跨平台脚本。 |
| 后台包管理 | `Kirameku-backend/admin/pnpm-workspace.yaml` | 显式允许或拒绝实际安装脚本依赖。 |
| 后台包管理 | `Kirameku-backend/admin/pnpm-lock.yaml` | 仅加入新增直接依赖及其必要锁定项。 |
| 后台包管理 | `Kirameku-backend/admin/package-lock.json` | 删除 npm 锁文件。 |
| 后台构建 | `Kirameku-backend/admin/build/optimize.ts` | 删除 21 个未声明且未使用的模板依赖项。 |
| 后台类型 | `admin/src/api/{user,comment}.ts`、`admin/src/utils/auth.ts` | 修复登录、日志、评论回复和过期时间契约。 |
| 后台类型 | `admin/src/views/account-settings/components/SecurityLog.vue` | 使用明确日志类型和分页默认值。 |
| 后台类型 | `admin/src/views/{album,bookmark,friend-link,project}/index.vue` | 修复上传处理器与 Element Plus 标签类型。 |
| 执行报告 | `docs/iterations/02-runnable-baseline-repair-report.md` | 本报告。 |

## 3. 包管理迁移结果

- 两端均声明 `packageManager: pnpm@11.9.0`，保留唯一 `pnpm-lock.yaml`，删除 `package-lock.json`。
- 前台允许 `sharp`、`unrs-resolver`；管理后台允许 `@parcel/watcher`、`esbuild`，明确拒绝不提供本项目必需产物的 `es5-ext`、`typeit`。
- 管理后台增加 `tippy.js@6.3.7` 和 `cross-env@10.1.0`；锁文件只有相关必要变化。
- 两端均未使用 `dangerouslyAllowAllBuilds`。

## 4. 前台验证

| 命令 | 工作目录 | 退出码 | 状态 | 关键输出或失败原因 | 文件变化 |
|---|---|---:|---|---|---|
| `pnpm ignored-builds`（修复前） | `Kirameku/` | 0 | 成功 | 识别 `sharp`、`unrs-resolver` 为被拒绝脚本。 | 无 |
| `pnpm install --frozen-lockfile` | `Kirameku/` | 0 | 成功 | 冻结锁文件安装完成；允许的安装脚本正常执行。 | 仅忽略的 `node_modules/` 状态 |
| `pnpm lint` | `Kirameku/` | 1 | 失败（历史基线） | 833 项：159 errors、674 warnings；默认路径包含 `.next`。 | 无 |
| `pnpm exec eslint app components --max-warnings 0` | `Kirameku/` | 1 | 失败（历史基线） | 154 项：89 errors、65 warnings，与第一次审计源码口径一致。 | 无 |
| `pnpm build` | `Kirameku/` | 0 | 成功 | 39 个路由完成构建；后端未同时启动时 RSS 拉取出现已知 `ECONNREFUSED`，不影响构建。 | 生成忽略的 `.next/` |
| `node --check scripts/next-dev.mjs` | `Kirameku/` | 0 | 成功 | 启动参数兼容脚本语法有效。 | 无 |
| `pnpm dev -- --hostname 127.0.0.1 --port 3000` | `Kirameku/` | 0 | 成功 | pnpm 11 的独立 `--` 被兼容脚本过滤，Next dev 正常启动。 | 运行时更新忽略的 `.next/` |
| `Invoke-WebRequest` 请求 `/`、`/posts`、`/projects`、`/about` | 仓库根目录 | 0 | 成功 | 四个页面均为 HTTP 200。 | 无 |

前台业务页面源码未修改，因此未新增页面 Lint 问题；只增加启动参数兼容和包管理基线。

## 5. 后端验证

| 命令 | 工作目录 | 退出码 | 状态 | 关键输出或失败原因 | 文件变化 |
|---|---|---:|---|---|---|
| `venv\Scripts\python.exe -m pip config debug` | `Kirameku-backend/` | 0 | 成功 | 无 pip 配置文件；输出未写入报告原文。 | 无 |
| `venv\Scripts\python.exe -c "import ssl, sys; ..."` | `Kirameku-backend/` | 0 | 成功 | Python 3.9.1、OpenSSL 1.1.1w。 | 无 |
| `venv\Scripts\python.exe -m pip index versions psycopg2-binary` | `Kirameku-backend/` | 1 | 阻塞 | PyPI TLS 握手 `SSLEOFError`。 | 无 |
| `venv\Scripts\python.exe -m pip install -r requirements.txt`（首次） | `Kirameku-backend/` | 1 | 阻塞 | 同一 TLS 问题阻止下载 `psycopg2-binary`。 | venv 可能有 pip 临时状态；仓库无变化 |
| 官方 PyPI JSON 元数据、SHA256 校验、下载 wheel 后本地 `pip install <wheel>` | 仓库外临时目录 / `Kirameku-backend/` | 0 | 成功 | 安装锁定版本 `psycopg2-binary==2.9.10`、`python-dotenv==1.1.1`；未关闭 TLS 校验。 | 变更忽略的 `venv/`；临时 wheel 已删除 |
| `venv\Scripts\python.exe -m pip install -r requirements.txt`（复验） | `Kirameku-backend/` | 0 | 成功 | 所有 requirements 已满足；pip 自检仍记录 PyPI TLS 警告。 | 仅忽略的 `venv/` 状态 |
| `venv\Scripts\python.exe -m compileall app tests` | `Kirameku-backend/` | 0 | 成功 | 应用与测试均可编译。 | 生成忽略的 `__pycache__/` |
| `venv\Scripts\python.exe -m unittest tests.test_runnable_baseline -v` | `Kirameku-backend/` | 0 | 成功 | 10/10 通过。 | 仅忽略的缓存 |
| `venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000` | `Kirameku-backend/` | 0 | 成功 | 使用禁用 dotenv、测试数据库 URL、测试密钥、无 OSS 的临时环境；进程正常启停。 | 仅运行日志，随后删除 |
| `Invoke-RestMethod http://127.0.0.1:8000/api/health` | 仓库根目录 | 0 | 成功 | HTTP 200；未访问数据库或 OSS。 | 无 |
| `Invoke-WebRequest http://127.0.0.1:8000/docs` | 仓库根目录 | 0 | 成功 | HTTP 200。 | 无 |
| `Invoke-WebRequest http://127.0.0.1:8000/openapi.json` | 仓库根目录 | 0 | 成功 | HTTP 200。 | 无 |
| `Invoke-WebRequest http://127.0.0.1:8000/api/health/ready` | 仓库根目录 | 0 | 成功 | HTTP 503 符合无 PostgreSQL 预期；响应不泄露连接串或堆栈，应用保持存活。 | 无 |
| 无 Token 请求访客列表、单删、清空、dashboard | 仓库根目录 | 0 | 成功 | 四个管理接口均返回 HTTP 401。 | 无 |
| 使用无 `admin: true` 的有效签名测试 Token 请求管理接口 | 仓库根目录 | 0 | 成功 | HTTP 403；GitHub OAuth 用户 Token 不能越权进入管理员 API。 | 无 |
| `Invoke-WebRequest http://127.0.0.1:8000/admin/` | 仓库根目录 | 0 | 成功 | 后台已构建时 HTTP 200。 | 无 |

数据库可用时 readiness 200 由回归测试中的成功分支覆盖。本机没有 PostgreSQL 服务，因此没有用真实数据库执行 readiness 200 或业务 API 联调。

受限 wheel 安装使用官方 PyPI JSON 返回的工件 URL 和 SHA256，等价 PowerShell 流程如下；实际临时目录位于仓库外并已删除：

```powershell
$metadata = Invoke-RestMethod "https://pypi.org/pypi/<package>/<version>/json"
$artifact = $metadata.urls | Where-Object { $_.filename -eq "<locked-wheel>" }
Invoke-WebRequest -Uri $artifact.url -OutFile $target
(Get-FileHash -Algorithm SHA256 $target).Hash -eq $artifact.digests.sha256
.\venv\Scripts\python.exe -m pip install $target
```

## 6. 管理后台验证

| 命令 | 工作目录 | 退出码 | 状态 | 关键输出或失败原因 | 文件变化 |
|---|---|---:|---|---|---|
| `pnpm install --frozen-lockfile`（修复前） | `Kirameku-backend/admin/` | 1 | 失败 | 823 包落盘后被 pnpm 11 ignored-builds 阻止。 | 忽略的 `node_modules/` |
| `vue-tsc --noEmit --skipLibCheck`（修复前） | `Kirameku-backend/admin/` | 1 | 失败 | 21 个已知类型错误。 | 无 |
| `pnpm install --lockfile-only` | `Kirameku-backend/admin/` | 0 | 成功 | 只为新增直接依赖更新锁文件。 | `pnpm-lock.yaml` |
| `pnpm install --frozen-lockfile` | `Kirameku-backend/admin/` | 0 | 成功 | `@parcel/watcher` 与三版 `esbuild` 脚本成功；`es5-ext`、`typeit` 明确拒绝。 | 仅忽略的 `node_modules/` 状态 |
| `pnpm typecheck`（第一轮） | `Kirameku-backend/admin/` | 1 | 失败 | 剩余 5 个 Vue 模板 `Promise` 解析错误。 | 无 |
| `pnpm typecheck`（最终） | `Kirameku-backend/admin/` | 0 | 成功 | TypeScript/Vue 类型检查通过。 | 无 |
| `pnpm lint:check`（脚本建立后） | `Kirameku-backend/admin/` | 1 | 失败（历史基线） | 352 项：269 errors、83 warnings；命令只读并能完整结束。 | 无 |
| `pnpm lint:check`（本轮文件格式化后） | `Kirameku-backend/admin/` | 1 | 失败（历史基线） | 250 项：167 errors、83 warnings；剩余为范围外历史问题。 | 无 |
| 本轮修改文件只读 ESLint | `Kirameku-backend/admin/` | 1 | 失败（warning 门槛） | 0 errors、45 个既有 Tailwind 类名 warning；`--max-warnings 0` 返回 1。 | 无 |
| `pnpm build` | `Kirameku-backend/admin/` | 0 | 成功 | 3349 模块；无 tippy 解析错误。 | 生成忽略的 `dist/` 与 version 文件 |
| `pnpm dev -- --host 127.0.0.1 --port 8848` | `Kirameku-backend/admin/` | 0 | 成功 | Vite dev 正常启动。 | 仅运行日志，随后删除 |
| `Invoke-WebRequest http://127.0.0.1:8848/admin/` | 仓库根目录 | 0 | 成功 | HTTP 200，页面含 app mount。 | 无 |
| dev 日志扫描 tippy / optimizeDeps 错误 | 仓库根目录 | 0 | 成功 | `tippy` 解析错误 0；`Failed to resolve dependency` 0。 | 无 |

## 7. 最小安全门禁验证

- 四个管理接口无 Token 均为 401；签名有效但无 `admin: true` 的 Token 为 403；管理员 claim 回归测试通过。
- `GET /api/visitors/count`、`GET /api/visitors/location`、`POST /api/visitors/record` 保持公开路由，不依赖管理员鉴权。
- readiness 503 不包含连接串、密码或异常堆栈。
- OSS 配置不完整时返回 `503 OSS storage is not configured`，不会创建空配置客户端。
- `AUTO_CREATE_TABLES=false` 时 lifespan 不调用 `init_db()`。
- 未加入 `dangerouslyAllowAllBuilds`、`@ts-ignore`，未关闭类型检查，也未通过新增显式 `any` 掩盖问题。
- 本地 `.env` 保持未跟踪。锁定的 python-dotenv 1.1.1 不会自行识别 `PYTHON_DOTENV_DISABLED`，因此应用配置增加了显式守卫；验证过程中没有输出真实环境值。

## 8. 未完成事项

1. 前台源码口径仍有 154 个历史 Lint 问题，不在本轮清理范围。
2. 管理后台只读 Lint 仍有 250 个历史问题，不在本轮全量格式化或规则治理范围。
3. 本机没有 PostgreSQL，未进行真实 readiness 200 和数据库业务 API 联调。
4. GitHub OAuth、真实 OSS 上传和 reader 服务按设计未联调。

## 9. 环境阻塞与用户处理

- PostgreSQL：如需验证真实 readiness 200 和数据库业务接口，需要本地开发数据库；不得使用生产凭据。
- Python TLS：当前 Python 3.9.1/OpenSSL 1.1.1w 访问 PyPI 出现 `SSLEOFError`。建议检查企业代理、系统证书链或 Python 安装。本任务没有关闭证书校验，也没有写入 pip 全局配置；新的干净 venv 仍可能在首次安装时遇到该环境阻塞。

## 10. Git 状态与后续

- 分支从最新 `origin/main` 创建：`fix/runnable-baseline`。
- 只提交并推送该任务分支，不合并 `main`。
- 提交和推送后的 branch tracking、工作区状态、最近提交及 `origin/main...HEAD` diff stat 在最终交付中记录。
- 下一阶段先由 ChatGPT 复查本提交，再决定是否开展后续任务；复查前不得合并。

## 11. 建议沉淀到 Obsidian

- `03_Projects/kirameku-li/项目启动命令.md`：三端最终命令、端口和健康检查。
- `03_Projects/kirameku-li/第二次任务-可运行基线修复.md`：本轮决策与验证证据。
- `02_Knowledge/pnpm-11-allowBuilds.md`：逐包审批、true/false 判断与双锁治理。
- `02_Knowledge/FastAPI-liveness-readiness.md`：外部依赖分层与安全错误摘要。
- `02_Knowledge/Vite-optimizeDeps-template-residue.md`：模板残留依赖的静态核对方法。
