# 01 Kirameku-li 项目基线审计设计文档

- 文档状态：待执行
- 创建日期：2026-06-17
- 任务类型：只读审计、运行验证、文档建设
- 推荐分支：`chore/project-baseline-audit`
- 执行者：Codex
- 复查者：ChatGPT

## 1. 背景

Kirameku-li 是从上游项目 Fork 后得到的完整全栈个人博客系统，包含：

- `Kirameku/`：Next.js 16、React 19、TypeScript、Tailwind CSS 4 博客前台。
- `Kirameku-backend/`：FastAPI、SQLModel、PostgreSQL 后端。
- `Kirameku-backend/admin/`：Vue 3、Pure Admin、Element Plus 管理后台。
- 可选的小说阅读服务、GitHub OAuth、阿里云 OSS、音乐和远程图片等外部依赖。

当前仓库仍保留原作者的站点名称、域名、社交账号、资源域名、备案信息和部分个人化功能。项目功能较多，且前台、后端、管理后台使用不同技术栈。在没有建立真实基线前直接大范围个性化，容易产生遗漏、构建失败、配置污染和无法回退的问题。

因此第一次任务只进行项目审计和验证，不实施功能重构。

## 2. 本次目标

完成一次可复查、可重复的项目基线审计，回答以下问题：

1. 仓库由哪些模块组成，各模块的职责和依赖是什么？
2. 在当前 Windows 开发环境中，前台、后端和管理后台能否安装、构建和启动？
3. 项目要求哪些运行环境、环境变量、数据库和外部服务？
4. 当前有哪些 API、数据库模型、页面路由和主要业务功能？
5. 哪些代码和数据仍属于原作者，个性化时必须修改？
6. 哪些功能适合保留、关闭、删除或改造成配置项？
7. 当前测试、部署、安全、性能和可维护性存在哪些风险？
8. 下一阶段“原作者信息清理与基础个性化”应以哪些事实为依据？

## 3. 非目标

本任务不得主动完成以下事项：

- 不修改网站名称、头像、背景、主题色和页面文案。
- 不删除原作者功能、页面、图片或演示数据。
- 不重构前台、后端或管理后台。
- 不新增 Docker、CI、测试框架、数据库迁移或发布功能。
- 不升级依赖版本。
- 不修复审计中发现的普通问题，除非该问题阻止生成审计文档，且修复仅限文档或无风险的审计脚本。
- 不把 SecondBrain 私有内容复制到公开仓库。
- 不提交 `.env`、密码、Token、API Key、私钥、数据库凭据或真实个人信息。

发现问题时记录证据、影响和建议，不在本任务中扩大范围修复。

## 4. 执行原则

1. **先检查，再运行。** 在安装依赖和启动前先阅读 README、包管理文件、环境变量示例和应用入口。
2. **真实结果优先。** 没有实际命令输出，不得写“构建通过”或“启动成功”。
3. **失败也是结果。** 缺少数据库、OSS 或配置导致失败时，记录准确错误、阻塞条件和最小解决条件，不伪造成功。
4. **不泄露秘密。** 报告只记录变量名、是否存在和用途，不记录变量值。
5. **不污染仓库。** 不提交 `node_modules`、`.next`、`dist`、`venv`、缓存、日志和临时数据库文件。
6. **控制变更。** 本任务最终应只提交审计文档、必要的只读检查脚本及相关索引更新。
7. **保留许可证。** 不删除 `LICENSE`、上游作者声明或依法、依许可证应保留的内容；原作者个人站点信息与许可证归属必须区分。

## 5. 开始前检查

### 5.1 Git 基线

执行并记录：

```powershell
git status --short
git branch --show-current
git log -1 --oneline
git remote -v
```

要求：

- 记录当前分支和基线提交 SHA。
- 若工作区原本存在用户修改，不覆盖、不清理、不回退；在报告中标注其存在。
- 推荐从 `main` 创建分支：

```powershell
git switch main
git pull --ff-only
git switch -c chore/project-baseline-audit
```

若无法拉取或无法创建分支，记录原因，不强制修改远程或历史。

### 5.2 忽略文件和敏感文件

检查：

- 根目录及各子项目的 `.gitignore`。
- 是否跟踪 `.env`、数据库导出、日志、上传文件、密钥文件。
- 是否有疑似硬编码 Secret、Token、密码和连接串。

只在报告中记录文件路径、风险类型和修复建议，不复制真实秘密值。

## 6. 仓库结构与模块审计

生成仓库结构摘要，至少覆盖：

```text
Kirameku-li/
├── Kirameku/
├── Kirameku-backend/
│   ├── app/
│   ├── admin/
│   ├── uploads/
│   └── init_db.sql
├── reader-master/ 或其他阅读服务目录
├── docs/
└── 其他根目录配置
```

对每个一级模块记录：

- 技术栈。
- 启动入口。
- 构建入口。
- 依赖的其他模块。
- 依赖的数据库或外部服务。
- 主要输出产物。
- 是否属于核心博客能力或可选能力。

不得只复制 README；需要核对实际目录和配置文件。

## 7. 环境与包管理审计

### 7.1 记录本机版本

执行并记录：

```powershell
node --version
npm --version
pnpm --version
python --version
python -m pip --version
psql --version
java -version
```

某命令不存在时记录“未安装”及其影响，不因审计任务擅自安装大型运行环境。

### 7.2 包管理一致性

检查：

- 各模块是否存在 `package-lock.json`、`pnpm-lock.yaml`、`yarn.lock`。
- README、`package.json` 的 `packageManager`、`engines` 和实际锁文件是否一致。
- 前台和管理后台是否应统一使用 pnpm。
- Windows PowerShell 下的 npm/pnpm scripts 是否跨平台。
- 安装依赖后是否意外修改锁文件。

如果仅运行安装命令就修改锁文件，而本任务不需要更新依赖，应还原由本次审计产生的锁文件变化，并在报告中说明。

## 8. 前台审计与验证

目录：`Kirameku/`

### 8.1 静态分析

检查：

- `package.json`、锁文件、`next.config.ts`、`siteConfig.ts`。
- `app/` 下所有页面路由和动态路由。
- `layout.tsx` 中全局 Provider、布局组件和特效组件。
- 页面调用后端 API 的方式。
- Server Component、Client Component 和动态加载的主要使用位置。
- `public/` 中明显属于原作者的头像、背景、Logo、二维码和展示资源。
- Next.js 远程图片白名单及原作者域名。

### 8.2 验证命令

优先依据现有锁文件选择包管理器。若仓库使用 pnpm：

```powershell
cd Kirameku
pnpm install --frozen-lockfile
pnpm lint
pnpm build
pnpm dev -- --hostname 127.0.0.1 --port 3000
```

若 `--frozen-lockfile` 因锁文件状态失败，记录原因；不要未经说明地重建锁文件。

验证：

- 首页是否能打开。
- 控制台和终端是否有关键错误。
- 后端未启动时页面如何降级。
- `/posts`、`/projects`、`/about` 等主要页面能否加载。
- 动态组件是否产生 hydration、浏览器 API 或资源加载错误。

审计报告必须区分：

- 依赖安装成功。
- Lint 成功。
- 构建成功。
- 开发服务器启动成功。
- 页面功能实际可用。

这些结论不得互相替代。

## 9. 后端审计与验证

目录：`Kirameku-backend/`

### 9.1 静态分析

检查：

- `requirements.txt` 是否覆盖源码中实际 import 的直接依赖。
- `app/main.py`、`app/config.py`、`app/database.py`。
- API 聚合入口和各 Router。
- SQLModel Models、Pydantic/SQLModel Schemas、Services。
- JWT、GitHub OAuth、上传、OSS、评论、访问统计等模块。
- `init_db.sql` 和代码初始化数据库之间的关系。
- CORS 默认值和原作者域名。
- 环境变量缺失时是启动失败、功能降级还是延迟失败。
- `/api/health` 是否真的不依赖数据库和 OSS。

重点核对：源码是否使用 `python-dotenv` 等未明确写入 `requirements.txt` 的包。

### 9.2 环境变量清单

基于 `.env.example`、`config.py` 和代码引用生成表格：

| 变量名 | 用途 | 必需/可选 | 缺失表现 | 是否敏感 | 本地建议 |
|---|---|---|---|---|---|

不得记录真实值。

### 9.3 验证命令

```powershell
cd Kirameku-backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m compileall app
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

随后验证：

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

还需检查：

- `http://127.0.0.1:8000/docs`
- 至少一个无需登录的只读 API。
- 数据库不可用、OSS 配置缺失时的真实失败点。

规则：

- 不覆盖用户已有 `.env`。
- 不提交本地 `.env`。
- 不为制造成功结果而编造凭据。
- 如果必须使用测试配置，应写到未跟踪的临时文件，并在报告中描述变量名和用途，不描述值。

## 10. 管理后台审计与验证

目录：`Kirameku-backend/admin/`

### 10.1 静态分析

检查：

- Vue、Vite、Pure Admin、Element Plus、Pinia、Axios 版本。
- 登录流程、Token 保存方式、API base URL。
- 菜单和路由。
- 文章、分类、标签、评论、留言、说说、相册、项目、友链、收藏夹和站点配置页面。
- 是否存在 Mock、默认账号、原作者信息和未使用模板页面。
- 构建产物怎样由 FastAPI 挂载到 `/admin`。
- `package.json` scripts 在 Windows PowerShell 下是否可执行。

### 10.2 验证命令

```powershell
cd Kirameku-backend/admin
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm build
```

若某脚本会自动修复并产生大量格式变更，先确认其行为；审计任务不应提交无关格式化。可以优先运行不写文件的检查命令，或记录脚本不适合作为只读检查的原因。

验证：

- 管理后台能否独立开发启动。
- `dist` 生成后，FastAPI `/admin` 是否能访问。
- 登录页面是否依赖后端。
- API 失败时的提示是否明确。

## 11. 阅读服务与外部服务审计

对可选阅读服务及所有第三方能力生成清单，至少包括：

- reader-master / 小说阅读服务。
- PostgreSQL。
- 阿里云 OSS。
- GitHub OAuth。
- 网易云音乐或 Meting 服务。
- 远程图片域名。
- 自动 favicon、地图、统计或其他外部 API。

每项记录：

| 外部依赖 | 使用模块 | 是否核心 | 本地是否必需 | 失败降级 | 个性化建议 |
|---|---|---|---|---|---|

本次不部署这些外部服务。

## 12. 页面、功能与调用链清单

### 12.1 页面路由

列出所有主要页面和动态路由：

| 页面/路由 | 源文件 | 主要组件 | 后端 API | 外部依赖 | 当前用途 |
|---|---|---|---|---|---|

### 12.2 功能模块

至少覆盖：

- 首页。
- 文章、分类和标签。
- 说说。
- 杂谈/留言/评论。
- 小说阅读。
- 收藏夹。
- 项目展示。
- 友链。
- 照片墙和相册。
- 时间线/归档。
- 音乐播放器。
- 关于页面。
- Live2D 和页面特效。
- 管理后台。

对每项给出初步建议：

- 核心保留。
- 可选保留。
- 建议关闭。
- 建议删除，但需后续单独设计。
- 建议改造成配置开关。

此处只是建议，不修改功能。

### 12.3 一条完整调用链

选取“文章列表”作为样例，追踪：

```text
Next.js 页面/组件
→ 请求封装或 fetch
→ FastAPI Router
→ Schema
→ Service
→ SQLModel Model
→ PostgreSQL 表
→ JSON 响应
→ 页面渲染
```

报告中列出对应文件和关键函数，作为后续学习入口。

## 13. API 与数据模型清单

### 13.1 API

按模块列出后端路由：

| Method | Path | Router 文件 | 是否鉴权 | 请求模型 | 响应模型 | 前台/后台调用方 |
|---|---|---|---|---|---|---|

可通过源码静态分析，并在后端成功启动时用 OpenAPI `/openapi.json` 交叉验证。

### 13.2 数据模型

列出：

| 表/Model | 文件 | 主键 | 关键字段 | 关联 | 对应业务 |
|---|---|---|---|---|---|

同时说明：

- `init_db.sql` 与 SQLModel 定义是否一致。
- 是否有数据库迁移工具。
- 是否存在演示数据、默认管理员或硬编码初始化数据。
- 删除演示数据可能影响哪些模块。

本任务不修改数据库。

## 14. 原作者信息清单

在排除 `.git`、依赖目录、构建产物和虚拟环境后，全仓库搜索下列已知线索，并继续发现其他线索：

```text
Starhiro
Xinghongia
hiromu
hongzyh
boke.hiromu.top
static.hiromu.top
hiromu520
hong.jpg
赣ICP备
萌ICP备
原作者邮箱、QQ、微信、歌单 ID、域名和 OSS 路径
```

生成表格：

| 文件 | 位置/字段 | 当前内容类型 | 分类 | 建议 | 是否必须修改 |
|---|---|---|---|---|---|

分类必须区分：

1. 原作者个人身份信息：需要个性化。
2. 原作者部署配置：需要替换或环境化。
3. 示例/演示内容：需要清理或重新录入。
4. 上游项目归属、许可证和第三方版权：不得当作个人信息直接删除。
5. 普通技术配置：可能无需修改。

不得把搜索到的疑似密码或 Secret 原样写入报告。

## 15. 测试、部署与工程质量审计

检查但不实施：

### 测试

- 前台是否有单元、组件或 E2E 测试。
- 后端是否有 pytest 测试。
- 管理后台是否有测试。
- 当前 Lint、TypeScript 和 Python 静态检查能力。

### 部署

- Dockerfile。
- Docker Compose。
- Nginx 配置。
- GitHub Actions。
- 生产环境配置说明。
- 数据库和上传文件备份。
- 健康检查。

### 工程质量

- 依赖锁定是否一致。
- README 与实际版本是否一致。
- 错误处理和日志。
- 配置是否集中。
- 是否存在重复 API 地址、域名和个人信息。
- 大型静态资源和构建体积风险。
- 可选功能是否与核心模块耦合。

## 16. 安全审计边界

只进行防御性、只读检查：

- Git 是否跟踪敏感配置。
- 默认管理员、弱默认密码或演示账号。
- JWT Secret 的加载方式。
- CORS 范围。
- 文件上传类型、大小和路径处理。
- OAuth 回调与 Secret 配置。
- 管理后台 Token 保存方式。
- 公开接口的写操作是否鉴权。
- 数据库连接和错误信息是否可能泄露。

不得尝试攻击线上站点、绕过认证或访问非授权数据。

## 17. 审计产物

Codex 应在任务分支创建以下文件：

```text
docs/audits/
├── 01-project-baseline-audit-report.md
├── 01-environment-and-runbook.md
├── 01-api-and-data-inventory.md
└── 01-personalization-inventory.md
```

### 17.1 `01-project-baseline-audit-report.md`

包含：

- 执行摘要。
- 基线提交和环境。
- 模块结构。
- 三端验证结论。
- 外部依赖。
- 测试、部署、安全和工程风险。
- 阻塞问题。
- 下一阶段建议。

### 17.2 `01-environment-and-runbook.md`

包含：

- Windows PowerShell 环境版本。
- 前台、后端、管理后台的准确安装和启动命令。
- 命令执行结果。
- 所需环境变量名称。
- 常见失败和排查方式。
- 不包含任何真实凭据。

### 17.3 `01-api-and-data-inventory.md`

包含：

- API 路由表。
- 数据模型表。
- 页面到 API 的调用关系。
- 文章列表完整调用链。
- 初始化 SQL 与 Model 一致性结论。

### 17.4 `01-personalization-inventory.md`

包含：

- 原作者信息位置。
- 原作者部署配置位置。
- 演示数据和素材位置。
- 必改、可改、暂缓和不得删除项。
- 功能保留/关闭/配置化建议。

## 18. 验收标准

任务完成必须满足：

- [ ] 审计基于当前仓库实际文件，而非只复述 README。
- [ ] 记录基线分支、提交和原始工作区状态。
- [ ] 记录 Node、pnpm、Python、PostgreSQL、Java 的可用状态。
- [ ] 分别给出前台安装、Lint、构建、启动和页面验证结论。
- [ ] 分别给出后端安装、编译、启动、健康检查和 API 文档结论。
- [ ] 分别给出管理后台安装、类型检查、Lint、构建和访问结论。
- [ ] 失败项包含真实错误摘要、原因判断和下一步条件。
- [ ] 环境变量清单不包含真实值。
- [ ] API、数据模型、页面和主要功能均有清单。
- [ ] 至少完成文章列表的一条完整调用链。
- [ ] 原作者信息、部署配置、演示内容和许可证归属已分类。
- [ ] 测试、Docker、CI、备份和安全现状有明确结论。
- [ ] 只提交审计相关文档或必要的只读脚本。
- [ ] 最终 `git status --short` 中不存在依赖、缓存、构建产物或秘密文件。

## 19. 回滚方式

本任务不应修改业务代码。若产生无关变更：

1. 先用 `git status --short` 和 `git diff` 确认来源。
2. 只回退由本次审计产生的文件；不得覆盖任务开始前的用户修改。
3. 删除本次生成且未被忽略的构建产物。
4. 保留审计文档提交，或直接删除任务分支完成整体回滚。

## 20. Obsidian 沉淀要求

Codex 完成后，在执行报告中列出建议更新到 SecondBrain 的内容，但不要直接把公开仓库中的全部审计结果复制到私有仓库。

建议沉淀：

- 真实可用的本地启动命令。
- 当前架构与文章调用链。
- 已验证的环境依赖。
- 项目专属问题和解决方案。
- 可跨项目复用的 Next.js、FastAPI、SQLModel、Vue 或部署知识。
- 下一阶段的个性化决策输入。

项目专属内容进入：

```text
03_Projects/kirameku-li/
```

可跨项目复用的知识进入：

```text
02_Knowledge/
```

## 21. Codex 最终输出格式

完成任务后，必须输出：

1. 做了什么。
2. 新增或修改了哪些文件。
3. 每份审计文档的核心结论。
4. 执行了哪些命令。
5. 每条命令的成功、失败或阻塞状态。
6. 遇到的问题和解决方案。
7. 没有解决的问题及原因。
8. 是否存在需要用户提供的数据库、OSS、OAuth 或其他配置。
9. 是否产生需要清理的本地文件。
10. 建议沉淀到 Obsidian 的知识。
11. 下一阶段建议，但不要自行开始下一阶段。

## 22. 交给 Codex 的执行指令

```text
请先阅读仓库根目录 README、现有规则文件，以及 docs/01-project-baseline-audit-design.md。

从 main 创建 chore/project-baseline-audit 分支，严格执行第一次项目基线审计。本次只允许审计、运行验证和文档建设，不进行个性化、依赖升级、功能删除或业务重构。

请保护工作区中原本存在的用户修改，不提交任何 Secret、.env、Token、密码、数据库凭据、node_modules、.next、dist、venv、缓存或日志。无法启动或构建时保留真实错误证据，不要通过编造配置制造成功结果。

按设计文档生成 docs/audits 下的四份报告，并执行能够安全执行的安装、Lint、类型检查、构建、启动和健康检查。最终按设计文档第 21 节输出完整执行报告，并停止在审计阶段，等待 ChatGPT 复查。
```
