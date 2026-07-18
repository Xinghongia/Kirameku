# 01 环境与运行手册

审计日期：2026-07-18  
系统环境：Windows PowerShell，工作区 `D:\OneDrive\documents\Desktop\GitHub_repositories\Kirameku-li`

## 本机版本

| 命令 | 结果 |
|---|---|
| `node --version` | `v24.15.0` |
| `npm --version` | `11.12.1` |
| `pnpm --version` | `11.9.0` |
| `python --version` | `Python 3.9.1` |
| `python -m pip --version` | `pip 20.3.1` from `E:\miniconda` |
| `psql --version` | 未安装，PowerShell 报 `The term 'psql' is not recognized` |
| `java -version` | OpenJDK `17.0.18` Temurin |

## Git 与本地文件状态

开始时：

```powershell
git status --short
git branch --show-current
git log -1 --oneline
git remote -v
```

结果：工作区无已跟踪修改；当前分支从 `main` 切到 `chore/project-baseline-audit`；基线提交 `f11ff3c docs: add project baseline audit design`。`git pull --ff-only` 返回 `Already up to date.`。

开始前已存在但被忽略的本地文件/目录：

- `Kirameku/node_modules/`
- `Kirameku/.next/`
- `Kirameku-backend/venv/`
- `Kirameku-backend/app/**/__pycache__/`
- `Kirameku-backend/.env` 存在但未跟踪；本次未读取其值。

本次产生并已清理：

- `Kirameku/pnpm-workspace.yaml`
- `Kirameku-backend/admin/node_modules/`
- `Kirameku-backend/admin/dist/`

## 前台运行手册

目录：`Kirameku/`

配置文件：

- `package.json`：`dev`、`build`、`start`、`lint`。
- `pnpm-lock.yaml` 和 `package-lock.json` 同时存在，包管理不一致。
- `.env.example` 仅列变量名：`NEXT_PUBLIC_API_URL`、`NEXT_PUBLIC_NOVEL_API_URL`、`NOVEL_API_URL`。
- `next.config.ts` rewrites：`/api` 到 `127.0.0.1:8000`，`/uploads` 到 `127.0.0.1:8000/uploads`，`/reader3` 到 `NOVEL_API_URL` 或 `localhost:8085`。

推荐命令：

```powershell
cd Kirameku
pnpm install --frozen-lockfile
pnpm lint
pnpm build
pnpm dev -- --hostname 127.0.0.1 --port 3000
```

本次结果：

| 命令 | 状态 | 结果摘要 |
|---|---|---|
| `pnpm install --frozen-lockfile` | 超时/失败 | 首次 125s 超时；后续 pnpm 依赖状态检查下载/复用包后以 `ERR_PNPM_IGNORED_BUILDS` 失败，涉及 `sharp`、`unrs-resolver`。 |
| `pnpm lint` | 失败 | 未进入 lint，pnpm 先执行 install 状态检查并被 ignored-builds 阻塞。 |
| `node_modules\.bin\eslint.cmd app components --max-warnings 0` | 失败 | 154 problems：89 errors、65 warnings；以 React Hooks refs/effects/static-components、`any`、prefer-const 为主。 |
| `node_modules\.bin\next.cmd build` | 成功 | Next build 成功；RSS generation 访问后端失败 `ECONNREFUSED 127.0.0.1:8000`，但构建退出 0。 |
| `node_modules\.bin\next.cmd dev --hostname 127.0.0.1 --port 3000` | 成功 | Ready in 384ms；`/`、`/posts`、`/projects`、`/about` 均 HTTP 200。 |

前台常见失败：

- 后端未启动时，首页和部分 SSR/route handler 会记录 `fetch failed` / `ECONNREFUSED 127.0.0.1:8000`，但主要页面可以降级显示。
- pnpm 11 需要显式处理 ignored-builds，否则标准脚本会在安装状态检查阶段失败。
- `dev:clean` 使用 `rm -rf`，在纯 PowerShell 下不跨平台。

## 后端运行手册

目录：`Kirameku-backend/`

配置文件：

- `requirements.txt` 缺少源码直接使用的 `python-dotenv`，但既有 venv 中已安装 `python-dotenv 1.2.1`。
- `.env.example` 列出：`DATABASE_URL`、`SECRET_KEY`、`CORS_ORIGINS`、`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET`、`OSS_BUCKET_NAME`、`OSS_ENDPOINT`、`OSS_CUSTOM_DOMAIN`、`OSS_PREFIX`。
- `app.config` 使用 `os.environ[...]` 强制读取数据库、JWT 和 OSS 变量。

推荐命令：

```powershell
cd Kirameku-backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m compileall app
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

本次结果：

| 命令 | 状态 | 结果摘要 |
|---|---|---|
| `python -m venv venv` | 成功 | 既有 venv 可用。 |
| `pip install --upgrade pip` | 成功带警告 | pip 已为 26.0.1；访问 PyPI 时 SSL EOF 警告。 |
| `pip install -r requirements.txt` | 失败 | `psycopg2-binary==2.9.10` 因 PyPI SSL EOF/无可用版本失败。 |
| `python -m compileall app` | 成功 | `app`、`api`、`models`、`schemas`、`services`、`utils` 均完成编译。 |
| `uvicorn app.main:app` | 失败 | 使用 `PYTHON_DOTENV_DISABLED=1` 和哑变量避免读取本地 `.env`；导入阶段失败：`ModuleNotFoundError: No module named 'psycopg2'`。 |
| `Invoke-RestMethod /api/health` | 阻塞 | 后端未能启动，无法验证。 |

环境变量清单：

| 变量名 | 用途 | 必需/可选 | 缺失表现 | 是否敏感 | 本地建议 |
|---|---|---|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接 | 必需 | `app.config` 导入阶段 KeyError；或数据库连接失败 | 是 | 本地使用专用开发库，不使用生产库。 |
| `SECRET_KEY` | JWT 签名 | 必需 | 导入阶段 KeyError | 是 | 使用本地随机值。 |
| `CORS_ORIGINS` | CORS 白名单 | 可选 | 缺失时使用默认值，包含原作者域名 | 否 | 本地设为 localhost 列表，生产环境化。 |
| `GITHUB_CLIENT_ID` | GitHub OAuth | 可选 | 登录接口报未配置 | 否 | 不测 OAuth 时可空。 |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | 可选 | 回调换 token 失败 | 是 | 不写入报告，不提交。 |
| `FRONTEND_ORIGIN` | GitHub OAuth 回跳 | 可选 | 默认回跳原作者域名 | 否 | 个性化时必须替换或环境化。 |
| `OSS_ACCESS_KEY_ID` | OSS 身份 | 必需于当前启动 | 导入阶段 KeyError | 是 | 当前设计会阻塞非上传场景，建议后续改为懒加载。 |
| `OSS_ACCESS_KEY_SECRET` | OSS 密钥 | 必需于当前启动 | 导入阶段 KeyError | 是 | 不提交。 |
| `OSS_BUCKET_NAME` | OSS bucket | 必需于当前启动 | 导入阶段 KeyError | 否/配置敏感 | 环境化。 |
| `OSS_ENDPOINT` | OSS endpoint | 必需于当前启动 | 导入阶段 KeyError | 否 | 环境化。 |
| `OSS_CUSTOM_DOMAIN` | OSS 访问域名 | 必需于当前启动 | 导入阶段 KeyError | 否 | 个性化替换。 |
| `OSS_PREFIX` | 上传对象前缀 | 必需于当前启动 | 导入阶段 KeyError | 否 | 建议按项目命名。 |

## 管理后台运行手册

目录：`Kirameku-backend/admin/`

配置文件：

- `package.json`：`dev`、`typecheck`、`lint`、`build`。
- `pnpm-lock.yaml` 和 `package-lock.json` 同时存在。
- `.env.development/.env.production/.env.staging` 被跟踪，内容为 Vite public path、router history、CDN/compression 等非 secret 配置。
- `vite.config.ts` dev server 端口来自 `VITE_PORT`，代理 `/api` 到 `http://localhost:8000`。

推荐命令：

```powershell
cd Kirameku-backend/admin
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm build
pnpm dev
```

本次结果：

| 命令 | 状态 | 结果摘要 |
|---|---|---|
| `pnpm install --frozen-lockfile` | 超时/失败 | 244s 超时；后续 pnpm 状态检查以 `ERR_PNPM_IGNORED_BUILDS` 失败。 |
| `pnpm typecheck` | 未直接执行 | 标准 pnpm 脚本会先受安装状态影响；改用本地二进制。 |
| `vue-tsc --noEmit --skipLibCheck` | 失败 | `RefreshTokenResult` 未导出、`expires` string/Date 不匹配、评论 `replies` 类型缺失、UploadRequestHandler 返回值不匹配等。 |
| `pnpm lint` | 未执行 | 该脚本包含 `--fix` 和 `prettier --write`，会写文件，不符合本次只读审计。 |
| `eslint --max-warnings 0 src mock build` | 超时 | 184s 超时，无完整结论。 |
| `pnpm build` | 失败 | 先被 pnpm ignored-builds 阻塞；还提示 `package.json` 中 `pnpm` 字段不再读取。 |
| `vite build` | 失败 | 构建转译 3347 modules 后，因无法解析 `tippy.js/dist/tippy.css` 失败。 |
| `vite --host 127.0.0.1 --port 8848` | 部分成功 | dev server 可监听；依赖预扫描报多项 optimizeDeps 缺失和 `tippy.js` CSS 解析失败。 |

管理后台常见失败：

- `src/main.ts` 直接 import `tippy.js/dist/tippy.css` 和 `tippy.js/themes/light.css`，但 `package.json` 未声明 `tippy.js`。
- `build/optimize.ts` 保留大量 Pure Admin 模板依赖，当前 package 未声明，dev optimizeDeps 会报缺失。
- `pnpm lint` 是修复型脚本，不适合作为 CI/read-only lint。
- `build` 脚本使用 `NODE_OPTIONS=...` 的 POSIX 写法；在 Windows PowerShell 下建议后续单独验证跨平台脚本方案。
