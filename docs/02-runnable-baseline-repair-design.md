# 02 Kirameku-li 可运行基线修复设计文档

- 文档状态：待执行
- 创建日期：2026-07-19
- 任务类型：工程基线修复、最小安全门禁、运行验证
- 推荐分支：`fix/runnable-baseline`
- 执行者：Codex
- 复查者：ChatGPT
- 基线提交：以执行时最新 `origin/main` 为准

## 1. 背景

第一次项目审计已经完成，并生成：

```text
docs/audits/01-project-baseline-audit-report.md
docs/audits/01-environment-and-runbook.md
docs/audits/01-api-and-data-inventory.md
docs/audits/01-personalization-inventory.md
```

审计确认：

- Next.js 前台能够构建和启动，但标准 pnpm 安装流程被 pnpm 11 构建脚本审批规则阻塞，Lint 仍有大量历史问题。
- FastAPI 后端能够通过 `compileall`，但依赖安装、应用启动、健康检查和 OpenAPI 尚未跑通。
- Vue 管理后台存在 pnpm 11 配置不兼容、缺少 `tippy.js`、模板 optimizeDeps 残留和类型错误，导致 typecheck/build 失败。
- 访客管理与后台仪表盘存在未鉴权管理接口，需要在继续开发前加入最小安全门禁。

因此第二次任务先建立“可安装、可启动、可构建、可验证”的开发基线，再进行原作者信息清理和页面个性化。

## 2. 本次目标

1. 明确前台和管理后台统一使用 pnpm，并让 pnpm 11 的标准安装命令稳定通过。
2. 让前台标准 `pnpm build` 和开发启动继续通过。
3. 补齐后端直接依赖，使 FastAPI 在没有 OSS、没有可用数据库连接时仍可启动 liveness 和 OpenAPI。
4. 将数据库自动建表改为显式配置，避免应用启动必然连接数据库。
5. 增加数据库 readiness 检查，区分“应用存活”和“数据库可用”。
6. 让管理后台 `pnpm typecheck`、`pnpm build` 和开发启动通过。
7. 为访客管理接口和后台仪表盘增加最小管理员鉴权。
8. 形成经过真实命令验证的本地运行手册和执行报告。

## 3. 非目标

本任务不允许主动完成：

- 不修改站点名、作者名、头像、背景、关于页、备案和社交信息。
- 不清理原作者演示数据和素材。
- 不重构页面布局和视觉风格。
- 不修复前台全部 89 errors / 65 warnings。
- 不升级 Next.js、React、Vue、FastAPI、SQLModel、Vite 等大版本。
- 不把数据库从 PostgreSQL 改成 MySQL、SQLite 或其他数据库。
- 不新增 Docker、Docker Compose、GitHub Actions、Nginx 或正式部署配置。
- 不新增完整数据库迁移体系。
- 不实现 OAuth、OSS 和 reader 服务的真实联调。
- 不提交 `.env`、真实密码、Token、API Key、数据库凭据或私钥。

发现范围外问题时记录到执行报告，不顺带修复。

## 4. Git 工作流要求

第一次审计提交已经同时出现在 `main` 和任务分支上。本次必须恢复标准流程：

```text
main
→ 创建独立任务分支
→ Codex 修改和验证
→ 推送任务分支
→ ChatGPT 复查
→ 用户确认
→ PR 合并 main
```

开始前执行：

```powershell
git fetch origin
git switch main
git pull --ff-only origin main
git status --short
git switch -c fix/runnable-baseline
```

完成后只能推送任务分支：

```powershell
git push -u origin fix/runnable-baseline
```

不得执行：

```powershell
git push origin HEAD:main
git push origin main
```

最终报告必须包含：

```powershell
git branch -vv
git status --short
git log --oneline --decorate -5
git diff --stat origin/main...HEAD
```

在 ChatGPT 复查前不要合并到 `main`。

## 5. 包管理统一方案

### 5.1 总体原则

前台和管理后台统一使用 pnpm。

本任务使用当前本机已经安装的 pnpm `11.9.0`，在两个 `package.json` 中增加：

```json
"packageManager": "pnpm@11.9.0"
```

不得通过以下方式绕过安装脚本安全检查：

```yaml
dangerouslyAllowAllBuilds: true
```

必须显式核对并允许或拒绝每个具有安装脚本的依赖。

### 5.2 pnpm 11 配置迁移

pnpm 11 不再读取旧的：

- `onlyBuiltDependencies`
- `ignoredBuiltDependencies`
- `neverBuiltDependencies`
- `ignoreDepScripts`

应迁移为各项目目录下 `pnpm-workspace.yaml` 中的 `allowBuilds`。

建议分别维护：

```text
Kirameku/pnpm-workspace.yaml
Kirameku-backend/admin/pnpm-workspace.yaml
```

每个文件都是单包 workspace：

```yaml
packages:
  - "."

allowBuilds:
  package-name: true-or-false
```

执行步骤：

1. 运行安装或 `pnpm ignored-builds`，取得真实待审批依赖。
2. 检查依赖用途、来源和是否需要其安装产物。
3. 只把项目确实需要的依赖设为 `true`。
4. 已明确不需要执行脚本的依赖设为 `false`。
5. 不接受未知依赖的批量审批。

已知审计线索：

- 前台出现 `sharp`、`unrs-resolver`。
- 管理后台旧配置曾允许 `@parcel/watcher`、`core-js`、`es5-ext`、`esbuild`、`typeit`、`vue-demi`，拒绝 `@tailwindcss/oxide`、`vue3-danmaku`。

以上只是迁移输入，Codex仍需根据实际依赖图和安装结果核对，不能机械复制。

### 5.3 锁文件策略

两个项目当前均同时存在 `pnpm-lock.yaml` 和 `package-lock.json`。

执行顺序：

1. 先完成 pnpm 配置迁移。
2. 使用 pnpm 安装、构建和启动验证。
3. 确认未依赖 npm 特有锁定结果。
4. 再删除对应 `package-lock.json`。
5. 重新执行 `pnpm install --frozen-lockfile`。

本任务结束后，每个前端项目只保留 `pnpm-lock.yaml`。

不得无理由重建或大范围刷新 pnpm 锁文件。若锁文件必须变化，报告必须解释原因和变更范围。

## 6. Next.js 前台修复

目录：`Kirameku/`

### 6.1 允许修改

- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`，仅在依赖或配置实际需要时
- 删除 `package-lock.json`
- 必要的跨平台脚本调整
- 本任务报告

### 6.2 具体要求

1. 增加 `packageManager`。
2. 建立 pnpm 11 `allowBuilds` 配置。
3. 解决标准 pnpm 命令在运行脚本前被依赖状态检查阻塞的问题。
4. 保证 `pnpm build` 仍通过。
5. 保证 `pnpm dev -- --hostname 127.0.0.1 --port 3000` 可启动。
6. 验证 `/`、`/posts`、`/projects`、`/about`。
7. `dev:clean` 当前使用 `rm -rf`，可改为跨平台方案；不得为此引入大型工具。

### 6.3 Lint 边界

本任务不修复全部前台 Lint。

执行：

```powershell
pnpm lint
```

记录新的错误和警告数量，与第一次审计基线比较。

只有本任务修改的源代码出现新 Lint 问题时才必须修复；历史 154 个问题作为后续专项任务，不得在本任务中大范围改动页面。

### 6.4 前台验收

```powershell
cd Kirameku
pnpm install --frozen-lockfile
pnpm build
pnpm dev -- --hostname 127.0.0.1 --port 3000
```

必须满足：

- install 退出 0。
- build 退出 0。
- 四个主要页面 HTTP 200。
- 不产生未解释的锁文件重写。
- `package-lock.json` 已删除。

## 7. FastAPI 后端修复

目录：`Kirameku-backend/`

### 7.1 补齐直接依赖

`app/config.py` 直接使用：

```python
from dotenv import load_dotenv
```

但 `requirements.txt` 未声明 `python-dotenv`。

当前基线是 Python 3.9.1，本任务不得顺带升级 Python。增加兼容 Python 3.9 的明确版本：

```text
python-dotenv==1.1.1
```

保留：

```text
psycopg2-binary==2.9.10
```

该版本存在 CPython 3.9 Windows x64 wheel。若安装仍失败，应诊断 pip registry、代理、证书和网络环境，不得误判为该包不支持当前平台，也不得使用关闭 TLS 校验的长期方案。

诊断命令：

```powershell
.\venv\Scripts\python.exe -m pip config debug
.\venv\Scripts\python.exe -c "import ssl, sys; print(sys.version); print(ssl.OPENSSL_VERSION)"
.\venv\Scripts\python.exe -m pip index versions psycopg2-binary
```

报告不得记录代理密码或私有仓库凭据。

### 7.2 配置分层

保持以下配置必需：

- `DATABASE_URL`
- `SECRET_KEY`

将 OSS 配置改为可选读取：

- `OSS_ACCESS_KEY_ID`
- `OSS_ACCESS_KEY_SECRET`
- `OSS_BUCKET_NAME`
- `OSS_ENDPOINT`
- `OSS_CUSTOM_DOMAIN`
- `OSS_PREFIX`

缺少 OSS 配置时：

- FastAPI 应能启动。
- `/api/health` 和 `/docs` 应可访问。
- 上传接口应返回明确的 `503 Service Unavailable` 或等价业务错误。
- 不得使用空字符串创建真实 OSS 客户端并产生难理解异常。

更新 `.env.example`，只记录变量名、说明和安全示例，不写真实值。

### 7.3 数据库启动策略

当前 lifespan 无条件执行：

```python
init_db()
```

新增布尔配置，例如：

```text
AUTO_CREATE_TABLES=false
```

行为：

- 默认 `false`：应用启动时不自动建表、不主动连接数据库。
- 显式 `true`：开发环境可执行当前 `init_db()`。
- 生产环境默认不得依赖自动建表替代迁移。

这允许在数据库暂不可用时验证 FastAPI liveness 和 OpenAPI，但不会伪装业务数据库已经可用。

### 7.4 健康检查分层

保留：

```text
GET /api/health
```

作为 liveness：

- 不访问数据库。
- 不访问 OSS。
- 正常返回 200。

新增：

```text
GET /api/health/ready
```

作为 readiness：

- 执行最小数据库 `SELECT 1`。
- 数据库可用返回 200。
- 数据库不可用返回 503，并给出不泄露凭据的错误摘要。
- 不返回完整连接串、密码或堆栈。

### 7.5 上传接口降级

在创建 OSS Bucket 前验证配置完整性。

缺少配置时返回：

```text
503 OSS storage is not configured
```

或清晰的中文等价信息。

现有文件类型、大小限制和鉴权保持不变；本任务不扩展上传安全审计。

### 7.6 后端最小安全门禁

以下管理能力必须增加现有管理员鉴权依赖：

- `GET /api/visitors`
- `DELETE /api/visitors/{visitor_id}`
- `DELETE /api/visitors`
- `GET /api/dashboard/stats`

保持公开：

- `GET /api/visitors/count`
- `GET /api/visitors/location`
- `POST /api/visitors/record`

使用项目现有 `get_current_user`，不得新建第二套鉴权逻辑。

验证：

- 未携带合法 Token 的管理接口返回 401。
- 公共访客接口仍可按原设计访问。

### 7.7 后端验证

使用未跟踪的临时环境变量，不读取或提交真实 `.env`：

```powershell
cd Kirameku-backend
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m compileall app
```

使用：

- 测试用 `DATABASE_URL`
- 随机本地 `SECRET_KEY`
- `AUTO_CREATE_TABLES=false`
- 不设置 OSS 变量

启动：

```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

验证：

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
Invoke-WebRequest http://127.0.0.1:8000/docs
Invoke-WebRequest http://127.0.0.1:8000/openapi.json
Invoke-WebRequest http://127.0.0.1:8000/api/health/ready
```

预期：

- health 200。
- docs 200。
- openapi 200。
- 数据库未运行时 ready 503，但应用不能退出。
- 数据库可用时 ready 200。

若 `psycopg2-binary` 仍因本机 SSL 环境无法安装，必须保留完整错误摘要并继续完成不依赖该安装结果的代码审查；但任务不能宣称后端运行基线已经完全通过。

## 8. Vue 管理后台修复

目录：`Kirameku-backend/admin/`

### 8.1 pnpm 配置

1. 增加 `packageManager: pnpm@11.9.0`。
2. 将旧 `package.json.pnpm` 配置迁移到 `pnpm-workspace.yaml` 的 `allowBuilds`。
3. 删除失效的旧 `pnpm` 字段。
4. pnpm 验证成功后删除 `package-lock.json`。

### 8.2 缺失依赖

`src/main.ts` 直接导入：

```text
tippy.js/dist/tippy.css
tippy.js/themes/light.css
```

但 `package.json` 未声明 `tippy.js`。

处理原则：

- 如果当前应用实际使用 `vue-tippy` 和这些样式，增加兼容版本的 `tippy.js` 直接依赖。
- 如果该功能完全未使用，应删除无效导入和相关初始化。
- 不得只通过 Vite alias 指向不存在文件绕过。

优先保留现有功能并补齐直接依赖。

### 8.3 optimizeDeps 清理

`build/optimize.ts` 包含大量 Pure Admin 模板依赖，但当前 `package.json` 未声明其中多项。

逐项处理：

1. 搜索该依赖是否被 `src/`、`mock/` 或 `build/` 的实际代码导入。
2. 实际使用：补齐直接依赖，或确认已由明确依赖提供且无需 direct dependency。
3. 只出现在 optimizeDeps、项目未使用：从 include 删除。
4. 不得为了保留模板清单而一次性安装所有未使用包。

目标是让 Vite dev 的依赖预扫描不再因为不存在的包报错。

### 8.4 TypeScript 类型修复

修复第一次审计确认的类型问题，至少包括：

- `RefreshTokenResult` 未导出或导入契约不一致。
- `expires` 的 `string` / `Date` 类型不一致。
- 评论 `replies` 字段类型缺失。
- `UploadRequestHandler` 返回类型不匹配。

处理原则：

- 以真实 API 响应和组件调用方式为依据。
- 优先修正共享类型和 API 契约。
- 不使用大范围 `any`、`@ts-ignore` 或关闭 TypeScript 检查。
- 不重构无关页面。

最终要求：

```powershell
pnpm typecheck
```

退出 0。

### 8.5 跨平台脚本

当前开发脚本使用 Windows `set`，构建脚本使用 POSIX `NODE_OPTIONS=...`，风格不一致。

统一为 Windows、Linux、CI 均可执行的方案，例如引入轻量 `cross-env`：

```json
"dev": "cross-env NODE_OPTIONS=--max-old-space-size=4096 vite",
"build": "rimraf dist && cross-env NODE_OPTIONS=--max-old-space-size=8192 vite build && generate-version-file"
```

必须实际在 Windows PowerShell 验证。

### 8.6 只读 Lint

保留现有自动修复脚本，同时新增不写文件的检查脚本，例如：

```json
"lint:check": "eslint --max-warnings 0 src mock build"
```

本任务不要求修复所有管理后台 Lint 问题，但命令应能够正常结束并输出完整结果，不应因脚本包含 `--fix` 或超时而无结论。

### 8.7 管理后台验收

```powershell
cd Kirameku-backend/admin
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm dev -- --host 127.0.0.1 --port 8848
```

必须满足：

- install 退出 0。
- typecheck 退出 0。
- build 退出 0，生成 `dist/`。
- dev server 正常启动。
- 登录页可打开。
- 不再出现 `tippy.js` CSS 无法解析。
- 不再因 optimizeDeps 中不存在的模板依赖而中断预转换。
- FastAPI 启动且 `dist/` 存在时，`/admin` 能返回管理后台页面。
- `package-lock.json` 已删除。

## 9. README 与运行手册更新

只更新与本次可运行基线直接相关的内容：

- 明确 Node、pnpm、Python 版本基线。
- 明确前台和管理后台统一使用 pnpm。
- 明确后端 liveness/readiness 区别。
- 明确 `AUTO_CREATE_TABLES` 的用途。
- 明确 OSS 未配置时只有上传不可用，不阻止应用启动。
- 明确 PostgreSQL 未启动时哪些功能不可用。

不得在本任务中重写整个 README 或个性化项目介绍。

## 10. 预期修改范围

允许涉及：

```text
Kirameku/package.json
Kirameku/pnpm-workspace.yaml
Kirameku/pnpm-lock.yaml
Kirameku/package-lock.json                  # 删除
Kirameku 中必要的跨平台清理脚本

Kirameku-backend/requirements.txt
Kirameku-backend/.env.example
Kirameku-backend/app/config.py
Kirameku-backend/app/main.py
Kirameku-backend/app/database.py
Kirameku-backend/app/api/upload.py
Kirameku-backend/app/api/visitors.py
Kirameku-backend/app/api/dashboard.py

Kirameku-backend/admin/package.json
Kirameku-backend/admin/pnpm-workspace.yaml
Kirameku-backend/admin/pnpm-lock.yaml
Kirameku-backend/admin/package-lock.json    # 删除
Kirameku-backend/admin/build/optimize.ts
Kirameku-backend/admin/src/main.ts
管理后台中与当前 vue-tsc 错误直接相关的类型/API/组件文件

docs/iterations/02-runnable-baseline-repair-report.md
README 或运行手册中的小范围更新
```

超出该范围前必须说明原因，不能擅自扩大。

## 11. 验收标准

### Git

- [ ] 从最新 `origin/main` 创建 `fix/runnable-baseline`。
- [ ] 只推送任务分支。
- [ ] ChatGPT 复查前没有合并到 `main`。
- [ ] 最终工作区无未解释文件。

### 前台

- [ ] 统一为 pnpm，增加 `packageManager`。
- [ ] pnpm 11 build scripts 使用显式 `allowBuilds`。
- [ ] `pnpm install --frozen-lockfile` 退出 0。
- [ ] `pnpm build` 退出 0。
- [ ] 四个主要页面 HTTP 200。
- [ ] 删除前台 `package-lock.json`。
- [ ] Lint 历史数量已记录，未引入新增问题。

### 后端

- [ ] `requirements.txt` 声明 `python-dotenv==1.1.1`。
- [ ] FastAPI 不依赖 OSS 配置即可导入和启动。
- [ ] `AUTO_CREATE_TABLES=false` 时不在启动阶段连接数据库。
- [ ] `/api/health` 返回 200。
- [ ] `/docs`、`/openapi.json` 返回 200。
- [ ] `/api/health/ready` 正确返回 200 或 503，不导致进程退出。
- [ ] OSS 未配置时上传接口明确返回 503。
- [ ] 访客管理和 dashboard 接口需要鉴权。
- [ ] 公共访客计数、定位和记录接口保持可用。

### 管理后台

- [ ] 统一为 pnpm，迁移 pnpm 11 配置。
- [ ] `pnpm install --frozen-lockfile` 退出 0。
- [ ] `pnpm typecheck` 退出 0。
- [ ] `pnpm build` 退出 0。
- [ ] dev server 和登录页可访问。
- [ ] 不再报 `tippy.js` CSS 缺失。
- [ ] optimizeDeps 不再引用无效未安装模板依赖。
- [ ] 增加只读 `lint:check`。
- [ ] 删除后台 `package-lock.json`。

### 范围与安全

- [ ] 未进行个性化。
- [ ] 未升级大版本。
- [ ] 未切换数据库类型。
- [ ] 未提交 `.env` 或真实凭据。
- [ ] 未使用 `dangerouslyAllowAllBuilds`。
- [ ] 未通过 `any`、`@ts-ignore` 或关闭检查掩盖类型问题。

## 12. 验证记录要求

Codex 必须为每条命令记录：

- 命令。
- 工作目录。
- 退出码。
- 成功、失败或阻塞。
- 关键输出摘要。
- 失败原因。
- 是否产生文件变化。

至少记录：

```text
前台 install / lint / build / dev / HTTP 页面
后端 pip install / compileall / uvicorn / health / ready / docs / OpenAPI
后台 install / typecheck / lint:check / build / dev / 登录页 / FastAPI admin mount
Git status / diff stat / branch tracking
```

## 13. 任务产物

创建：

```text
docs/iterations/02-runnable-baseline-repair-report.md
```

报告包含：

1. 执行摘要。
2. 修改文件清单。
3. 包管理迁移结果。
4. 前台验证结果。
5. 后端验证结果。
6. 管理后台验证结果。
7. 最小安全门禁验证结果。
8. 仍未解决的问题。
9. 是否需要用户安装 PostgreSQL或调整本机证书/代理。
10. 下一阶段建议。
11. 建议沉淀到 Obsidian 的知识。

## 14. 回滚方式

本任务使用独立分支。

- 未提交时：只还原本任务产生的文件，不影响任务开始前内容。
- 已提交未推送时：可删除本地任务分支。
- 已推送未合并时：可关闭 PR 并删除远程任务分支。
- 不得通过 force push 改写 `main`。

若包管理迁移失败，应恢复原锁文件和 package manifest，再单独重新设计，不保留半迁移状态。

## 15. Obsidian 沉淀要求

完成后建议更新：

```text
03_Projects/kirameku-li/项目启动命令.md
03_Projects/kirameku-li/第二次任务-可运行基线修复.md
03_Projects/kirameku-li/问题记录/
```

可跨项目复用的知识整理到：

```text
02_Knowledge/
```

候选主题：

- pnpm 11 `allowBuilds` 与依赖安装脚本安全。
- FastAPI liveness 与 readiness 分层。
- 可选外部服务不应阻止核心应用启动。
- Vue/Vite optimizeDeps 残留依赖的排查方法。
- 多包管理器锁文件冲突治理。

只有实际命令验证后才能标记为 `applied`。

## 16. 交给 Codex 的执行指令

```text
请先阅读：

1. docs/02-runnable-baseline-repair-design.md
2. docs/audits/01-project-baseline-audit-report.md
3. docs/audits/01-environment-and-runbook.md
4. docs/audits/01-api-and-data-inventory.md
5. docs/audits/01-personalization-inventory.md

从最新 origin/main 创建 fix/runnable-baseline 分支，严格执行第二次任务。

本次只处理：pnpm 11 包管理基线、前台标准安装/构建、FastAPI 可启动与健康检查分层、OSS 可选配置、管理后台缺失依赖和 typecheck/build、访客管理与 dashboard 最小鉴权。不要个性化，不要清理全部前台 Lint，不要升级大版本，不要切换数据库，不要新增 Docker/CI。

使用显式 allowBuilds，不得使用 dangerouslyAllowAllBuilds。保护本地 .env，不读取或提交真实凭据。完成后生成 docs/iterations/02-runnable-baseline-repair-report.md，提交并只推送 fix/runnable-baseline 分支。不要合并 main，等待 ChatGPT 复查。

最终输出：做了什么、修改文件、每条验证命令与退出码、前后台和后端结果、安全验证、未完成事项、需要用户处理的环境问题、Git 分支状态，以及建议沉淀到 Obsidian 的知识。
```
