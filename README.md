<div align="center">

# Kirameku

**きらめく — 像星光一样闪烁**

一个从零搭建的全栈个人博客系统，前端 Next.js，后端 FastAPI，附带 Vue 管理后台。

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-blue)

</div>

---

## 项目结构

```
.
├── Kirameku/                      # 前端（Next.js App Router）
│   ├── app/                       # 页面路由
│   │   ├── novel/                 # 小说阅读系统（书架 → 搜索 → 目录 → 阅读）
│   │   ├── bookmark/              # 收藏夹（站点导航）
│   │   ├── posts/                 # 文章系统
│   │   ├── moments/               # 说说
│   │   ├── friends/               # 友链（漂流瓶主题）
│   │   └── ...                    # 更多页面
│   ├── components/                # UI 组件
│   │   ├── layout/                # 导航栏、页脚
│   │   ├── providers/             # 主题、上下文
│   │   └── ui/                    # 通用组件
│   └── siteConfig.ts              # 站点全局配置
│
└── Kirameku-backend/              # 后端（FastAPI）
    ├── app/
    │   ├── api/                   # RESTful API 接口
    │   ├── models/                # SQLModel 数据模型
    │   ├── schemas/               # Pydantic 请求/响应模型
    │   └── services/              # 业务逻辑层
    ├── admin/                     # 管理后台（Vue 3 + Element Plus）
    └── init_db.sql                # 数据库初始化脚本
```

## 技术栈

<table>
<tr>
<td width="50%" valign="top">

**前端**
- **Next.js 16** + **React 19** — App Router，SSR/SSG
- **Tailwind CSS 4** — 原子化样式
- **Framer Motion** — 页面过渡与微交互
- **TypeScript** — 类型安全
- **Live2D** — 看板娘，右下角可互动

</td>
<td width="50%" valign="top">

**后端**
- **FastAPI** — 高性能 Python Web 框架
- **SQLModel** — ORM（SQLAlchemy + Pydantic）
- **PostgreSQL** — 关系型数据库
- **阿里云 OSS** — 图片对象存储
- **JWT** — 身份认证

</td>
</tr>
<tr>
<td width="50%" valign="top">

**管理后台**
- **Vue 3** + **Element Plus** — 后台 UI
- **Pure Admin** — 管理后台模板
- 内嵌于后端，无需单独部署

</td>
<td width="50%" valign="top">

**阅读服务**
- **reader-master** — Kotlin/Spring Boot
- legado 书源兼容
- 独立部署，端口 8085

</td>
</tr>
</table>

## 功能模块

### 博客前台

| 模块 | 路径 | 描述 |
|:-----|:-----|:-----|
| 首页 | `/` | 文章预览、说说、照片墙，一站式入口 |
| 文章 | `/posts` | 分类筛选、标签、Markdown 渲染、代码高亮 |
| 说说 | `/moments` | 碎片化记录，类朋友圈时间线 |
| 杂谈 | `/messages` | 轻量话题讨论区 |
| 小说 | `/novel` | 书架 → 搜索 → 目录 → 阅读，完整阅读体验 |
| 收藏夹 | `/bookmark` | 站点导航，分类管理，平台标签，自动获取 favicon |
| 项目 | `/projects` | 个人项目展示，支持搜索，GitHub/Gitee 链接 |
| 友链 | `/friends` | 漂流瓶主题，可拖动交互 |
| 照片墙 | `/photowall` | 相册瀑布流展示 |
| 归档 | `/timeline` | 时间河流可视化，拖动浏览全部文章 |
| 音乐 | `/music` | 云音乐播放器，支持歌单 |
| 关于 | `/about` | 关于博主 |

### 管理后台

文章、分类、标签、评论、留言、说说、相册、项目、友链、收藏夹、站点配置 — 全部可视化管理，支持图片压缩上传至阿里云 OSS。

## 快速开始

### 1. 后端

```bash
cd Kirameku-backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate          # Mac/Linux
# venv\Scripts\activate           # Windows

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入数据库、密钥、OSS 等配置

# 配置config.py
# 位置在/app文件夹内
# 配置OSS相关内容

# 初始化数据库
psql -U postgres -d your_db -f init_db.sql

# 打包管理后台
cd admin && pnpm install && pnpm build && cd ..

# 启动
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

API 文档：`http://localhost:8000/docs`
管理后台：`http://localhost:8000/admin`

### 2. 前端

```bash
cd Kirameku

pnpm install
pnpm dev                          # 开发模式 → http://localhost:3000

# 部署
pnpm build && pnpm start
```

### 3. 阅读服务（可选）

```bash
# reader-master 独立部署
java -jar reader-master.jar
# 默认端口 8085，前端通过 /reader3/ 路径代理访问
```

## 环境变量

`Kirameku-backend/.env`：

```env
# 数据库
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT
SECRET_KEY=your-secret-key

# 阿里云 OSS
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_ENDPOINT=oss-cn-xxx.aliyuncs.com
OSS_BUCKET=your-bucket-name
```

## 设计亮点

- **Glassmorphism 风格** — 全站毛玻璃质感，亮色暗色双主题
- **微交互动画** — Framer Motion 驱动，页面过渡、卡片悬停、果冻弹跳
- **小说阅读系统** — 四级路由架构（书架/搜索/目录/阅读），SSE 流式搜索，阅读设置持久化
- **收藏夹** — 自动获取站点 favicon，平台标签，搜索过滤
- **漂流瓶友链** — 可拖动的漂浮瓶子，点击查看详情
- **时间河流** — 归档页的可视化时间线，拖动交互
- **Live2D 看板娘** — 右下角可互动，连续点击 Logo 7 次触发彩蛋
- **移动端适配** — 响应式布局，移动端导航菜单

## License

MIT
