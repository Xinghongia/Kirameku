# 01 API 与数据清单

审计日期：2026-07-18  
说明：API 主要基于源码静态分析；后端未能启动，未能用 `/openapi.json` 交叉验证。

## API 路由表

| Method | Path | Router 文件 | 鉴权 | 请求模型 | 响应模型 | 调用方 |
|---|---|---|---|---|---|---|
| POST | `/api/auth/login` | `app/api/auth.py` | 否 | `LoginRequest` | token/user data | 管理后台登录 |
| GET | `/api/auth/me` | `app/api/auth.py` | 是 | - | current user | 管理后台 |
| PUT | `/api/auth/me` | `app/api/auth.py` | 是 | `UserUpdate` | status | 管理后台 |
| GET | `/api/auth/github/login` | `app/api/github_auth.py` | 否 | - | redirect | 前台评论/留言 |
| GET | `/api/auth/github/callback` | `app/api/github_auth.py` | 否 | OAuth code | redirect token | 前台 |
| GET | `/api/auth/github/me` | `app/api/github_auth.py` | Bearer token | - | GitHub user | 前台 |
| GET | `/api/posts` | `app/api/posts.py` | 否 | query: status/category/tag/page/size | `list[PostOut]` | 前台、后台 |
| GET | `/api/posts/count` | `app/api/posts.py` | 否 | query: status | `{count}` | 前台、后台 |
| GET | `/api/posts/detail/{post_id}` | `app/api/posts.py` | 否 | path | `PostDetail` | 后台编辑 |
| GET | `/api/posts/{slug}` | `app/api/posts.py` | 否 | path | `PostDetail` | 前台文章详情 |
| POST | `/api/posts` | `app/api/posts.py` | 是 | `PostCreate` | `PostOut` | 后台 |
| PUT | `/api/posts/{post_id}` | `app/api/posts.py` | 是 | `PostUpdate` | `PostOut` | 后台 |
| POST | `/api/posts/{post_id}/like` | `app/api/posts.py` | 否 | path | `{likes}` | 前台 |
| POST | `/api/posts/{post_id}/unlike` | `app/api/posts.py` | 否 | path | `{likes}` | 前台 |
| DELETE | `/api/posts/{post_id}` | `app/api/posts.py` | 是 | path | `{ok}` | 后台 |
| GET | `/api/categories` | `app/api/categories.py` | 否 | - | `list[CategoryOut]` | 前台、后台 |
| POST | `/api/categories` | `app/api/categories.py` | 是 | `CategoryCreate` | `CategoryOut` | 后台 |
| PUT | `/api/categories/{cat_id}` | `app/api/categories.py` | 是 | `CategoryUpdate` | `CategoryOut` | 后台 |
| DELETE | `/api/categories/{cat_id}` | `app/api/categories.py` | 是 | path | `{ok}` | 后台 |
| GET | `/api/tags` | `app/api/tags.py` | 否 | - | `list[TagOut]` | 前台、后台 |
| POST | `/api/tags` | `app/api/tags.py` | 是 | `TagCreate` | `TagOut` | 后台 |
| PUT | `/api/tags/{tag_id}` | `app/api/tags.py` | 是 | `TagUpdate` | `TagOut` | 后台 |
| DELETE | `/api/tags/{tag_id}` | `app/api/tags.py` | 是 | path | `{ok}` | 后台 |
| GET | `/api/comments/post/{post_id}` | `app/api/comments.py` | 否 | path | `list[CommentOut]` | 前台、后台 |
| POST | `/api/comments` | `app/api/comments.py` | 否 | `CommentCreate` | `CommentOut` | 前台 |
| GET | `/api/comments/admin` | `app/api/comments.py` | 是 | query | list | 后台 |
| PUT | `/api/comments/{comment_id}/status` | `app/api/comments.py` | 是 | status | item | 后台 |
| POST | `/api/comments/{comment_id}/like` | `app/api/comments.py` | 否 | path | `CommentOut` | 前台 |
| POST | `/api/comments/{comment_id}/unlike` | `app/api/comments.py` | 否 | path | `CommentOut` | 前台 |
| DELETE | `/api/comments/{comment_id}` | `app/api/comments.py` | 是 | path | `{ok}` | 后台 |
| GET | `/api/messages` | `app/api/messages.py` | 否 | query | `list[MessageOut]` | 前台 |
| GET | `/api/messages/count` | `app/api/messages.py` | 否 | - | `{count}` | 前台 |
| POST | `/api/messages` | `app/api/messages.py` | 否 | `MessageCreate` | dict | 前台 |
| POST | `/api/messages/{msg_id}/like` | `app/api/messages.py` | 否 | path | item/count | 前台 |
| POST | `/api/messages/{msg_id}/unlike` | `app/api/messages.py` | 否 | path | item/count | 前台 |
| GET | `/api/messages/admin/count` | `app/api/messages.py` | 是 | - | `{count}` | 后台 |
| GET | `/api/messages/admin` | `app/api/messages.py` | 是 | query | `list[MessageOut]` | 后台 |
| PUT | `/api/messages/{msg_id}/status` | `app/api/messages.py` | 是 | status | item | 后台 |
| DELETE | `/api/messages/{msg_id}` | `app/api/messages.py` | 是 | path | `{ok}` | 后台 |
| GET | `/api/chatters` | `app/api/chatters.py` | 否 | query | `list[ChatterOut]` | 前台、后台 |
| GET | `/api/chatters/count` | `app/api/chatters.py` | 否 | status | `{count}` | 前台、后台 |
| GET | `/api/chatters/{chatter_id}/comments` | `app/api/chatters.py` | 否 | path | `list[ChatterCommentOut]` | 前台 |
| POST | `/api/chatters/comments` | `app/api/chatters.py` | 否 | `ChatterCommentCreate` | `ChatterCommentOut` | 前台 |
| GET | `/api/chatters/admin` | `app/api/chatters.py` | 是 | query | `list[ChatterOut]` | 后台 |
| POST | `/api/chatters` | `app/api/chatters.py` | 是 | `ChatterCreate` | `ChatterOut` | 后台 |
| GET | `/api/chatters/comments/admin` | `app/api/chatters.py` | 是 | query | list | 后台 |
| PUT | `/api/chatters/comments/{comment_id}/status` | `app/api/chatters.py` | 是 | status | item | 后台 |
| DELETE | `/api/chatters/comments/{comment_id}` | `app/api/chatters.py` | 是 | path | `{ok}` | 后台 |
| POST | `/api/chatters/comments/{comment_id}/like` | `app/api/chatters.py` | 否 | path | `ChatterCommentOut` | 前台 |
| POST | `/api/chatters/comments/{comment_id}/unlike` | `app/api/chatters.py` | 否 | path | `ChatterCommentOut` | 前台 |
| GET | `/api/chatters/{chatter_id}` | `app/api/chatters.py` | 否 | path | `ChatterOut` | 前台、后台 |
| POST | `/api/chatters/{chatter_id}/like` | `app/api/chatters.py` | 否 | path | count | 前台 |
| POST | `/api/chatters/{chatter_id}/unlike` | `app/api/chatters.py` | 否 | path | count | 前台 |
| PUT | `/api/chatters/{chatter_id}` | `app/api/chatters.py` | 是 | `ChatterUpdate` | `ChatterOut` | 后台 |
| DELETE | `/api/chatters/{chatter_id}` | `app/api/chatters.py` | 是 | path | `{ok}` | 后台 |
| GET | `/api/albums` | `app/api/albums.py` | 否 | - | `list[AlbumOut]` | 前台、后台 |
| GET | `/api/albums/{album_id}` | `app/api/albums.py` | 否 | path | `AlbumOut` | 前台 |
| GET | `/api/albums/{album_id}/photos` | `app/api/albums.py` | 否 | path | `list[PhotoOut]` | 前台、后台 |
| POST | `/api/albums` | `app/api/albums.py` | 是 | `AlbumCreate` | `AlbumOut` | 后台 |
| PUT | `/api/albums/{album_id}` | `app/api/albums.py` | 是 | `AlbumUpdate` | `AlbumOut` | 后台 |
| DELETE | `/api/albums/{album_id}` | `app/api/albums.py` | 是 | path | `{ok}` | 后台 |
| POST | `/api/albums/photos` | `app/api/albums.py` | 是 | `PhotoCreate` | `PhotoOut` | 后台 |
| DELETE | `/api/albums/photos/{photo_id}` | `app/api/albums.py` | 是 | path | `{ok}` | 后台 |
| GET | `/api/projects` | `app/api/projects.py` | 否 | - | `list[ProjectOut]` | 前台、后台 |
| GET | `/api/projects/{slug}` | `app/api/projects.py` | 否 | path | `ProjectOut` | 前台 |
| POST | `/api/projects` | `app/api/projects.py` | 是 | `ProjectCreate` | `ProjectOut` | 后台 |
| PUT | `/api/projects/{project_id}` | `app/api/projects.py` | 是 | `ProjectUpdate` | `ProjectOut` | 后台 |
| DELETE | `/api/projects/{project_id}` | `app/api/projects.py` | 是 | path | `{ok}` | 后台 |
| GET | `/api/friend-links` | `app/api/friend_links.py` | 否 | - | `list[FriendLinkOut]` | 前台 |
| GET | `/api/friend-links/admin` | `app/api/friend_links.py` | 是 | - | `list[FriendLinkOut]` | 后台 |
| POST | `/api/friend-links` | `app/api/friend_links.py` | 是 | `FriendLinkCreate` | `FriendLinkOut` | 后台 |
| PUT | `/api/friend-links/{link_id}` | `app/api/friend_links.py` | 是 | `FriendLinkUpdate` | `FriendLinkOut` | 后台 |
| DELETE | `/api/friend-links/{link_id}` | `app/api/friend_links.py` | 是 | path | `{ok}` | 后台 |
| GET | `/api/site-config` | `app/api/site_config.py` | 否 | - | dict | 前台 |
| GET | `/api/site-config/list` | `app/api/site_config.py` | 是 | - | list | 后台 |
| GET | `/api/site-config/{key}` | `app/api/site_config.py` | 否 | path | item | 前台/后台 |
| POST | `/api/site-config` | `app/api/site_config.py` | 是 | `SiteConfigCreate` | `SiteConfigOut` | 后台 |
| PUT | `/api/site-config/{key}` | `app/api/site_config.py` | 是 | `SiteConfigUpdate` | `SiteConfigOut` | 后台 |
| PUT | `/api/site-config` | `app/api/site_config.py` | 是 | bulk dict | dict | 后台 |
| DELETE | `/api/site-config/{key}` | `app/api/site_config.py` | 是 | path | `{ok}` | 后台 |
| POST | `/api/upload/image` | `app/api/upload.py` | 是 | multipart file | `{url}` | 后台上传 |
| GET | `/api/bookmarks` | `app/api/bookmarks.py` | 否 | - | `list[BookmarkFull]` | 前台 |
| GET | `/api/bookmarks/categories` | `app/api/bookmarks.py` | 否 | - | `list[BookmarkCategoryOut]` | 后台 |
| POST | `/api/bookmarks/categories` | `app/api/bookmarks.py` | 是 | create | item | 后台 |
| PUT | `/api/bookmarks/categories/{cat_id}` | `app/api/bookmarks.py` | 是 | update | item | 后台 |
| DELETE | `/api/bookmarks/categories/{cat_id}` | `app/api/bookmarks.py` | 是 | path | `{ok}` | 后台 |
| GET | `/api/bookmarks/sites` | `app/api/bookmarks.py` | 否 | category | `list[BookmarkSiteOut]` | 后台 |
| POST | `/api/bookmarks/sites` | `app/api/bookmarks.py` | 是 | create | item | 后台 |
| PUT | `/api/bookmarks/sites/{site_id}` | `app/api/bookmarks.py` | 是 | update | item | 后台 |
| DELETE | `/api/bookmarks/sites/{site_id}` | `app/api/bookmarks.py` | 是 | path | `{ok}` | 后台 |
| GET | `/api/visitors` | `app/api/visitors.py` | 否 | query | list | 后台/调试 |
| GET | `/api/visitors/count` | `app/api/visitors.py` | 否 | - | count | 前台/后台 |
| GET | `/api/visitors/location` | `app/api/visitors.py` | 否 | request ip | location | 前台 |
| POST | `/api/visitors/record` | `app/api/visitors.py` | 否 | request body | status | 前台 |
| DELETE | `/api/visitors/{visitor_id}` | `app/api/visitors.py` | 未见鉴权 | path | status | 后台 |
| DELETE | `/api/visitors` | `app/api/visitors.py` | 未见鉴权 | - | status | 后台 |
| GET | `/api/dashboard/stats` | `app/api/dashboard.py` | 否 | - | stats | 后台仪表盘 |
| GET | `/api/health` | `app/main.py` | 否 | - | `{status}` | 健康检查 |
| GET | `/api/routes` | `app/main.py` | 否 | - | empty route data | 管理后台动态路由占位 |

## 数据模型表

| 表/Model | 文件 | 主键 | 关键字段 | 关联 | 对应业务 |
|---|---|---|---|---|---|
| `user` / `User` | `app/models/user.py` | `id` | `username`、`hashed_password`、`nickname`、`is_admin` | 无显式关系 | 管理员登录 |
| `category` / `Category` | `app/models/post.py` | `id` | `name`、`slug`、`post_count` | `post.category_id` | 文章分类 |
| `tag` / `Tag` | `app/models/post.py` | `id` | `name`、`slug`、`post_count` | `post_tag` | 文章标签 |
| `post_tag` / `PostTag` | `app/models/post.py` | `post_id + tag_id` | foreign keys | `post`、`tag` | 文章标签关联 |
| `post` / `Post` | `app/models/post.py` | `id` | `title`、`slug`、`content`、`status`、`views`、`likes` | `category`、`post_tag`、`comment` | 文章 |
| `github_user` / `GitHubUser` | `app/models/github_user.py` | `id` | `github_id`、`login`、`avatar`、`bio` | `comment`、`message`、`chatter_comment` | GitHub 登录用户 |
| `comment` / `Comment` | `app/models/comment.py` | `id` | `post_id`、`parent_id`、`github_user_id`、`status` | `post`、自引用、`github_user` | 文章评论 |
| `message` / `Message` | `app/models/message.py` | `id` | `github_user_id`、`parent_id`、`status`、`likes` | 自引用、`github_user` | 留言板 |
| `chatter` / `Chatter` | `app/models/chatter.py` | `id` | `content`、`images`、`mood`、`status` | `chatter_comment` | 说说 |
| `chatter_comment` / `ChatterComment` | `app/models/chatter.py` | `id` | `chatter_id`、`parent_id`、`github_user_id`、`status` | `chatter`、自引用、`github_user` | 说说评论 |
| `album` / `Album` | `app/models/album.py` | `id` | `title`、`cover`、`photo_count`、`sort` | `photo` | 相册 |
| `photo` / `Photo` | `app/models/album.py` | `id` | `album_id`、`url`、`caption`、`orientation` | `album` | 照片墙 |
| `project` / `Project` | `app/models/project.py` | `id` | `name`、`slug`、`tech_stack`、`links`、`status` | 无显式关系 | 项目展示 |
| `friend_link` / `FriendLink` | `app/models/friend_link.py` | `id` | `name`、`url`、`avatar`、`is_approved` | 无显式关系 | 友链 |
| `bookmark_category` / `BookmarkCategory` | `app/models/bookmark.py` | `id` | `name`、`icon`、`sort` | `bookmark_site` | 收藏夹分类 |
| `bookmark_site` / `BookmarkSite` | `app/models/bookmark.py` | `id` | `category_id`、`name`、`url`、`platforms` | `bookmark_category` | 收藏夹站点 |
| `site_config` / `SiteConfig` | `app/models/site_config.py` | `id` | `key`、`value`、`description` | 无显式关系 | 站点配置 |
| `visitor` / `Visitor` | `app/models/visitor.py` | `id` | `ip`、`path`、`city`、`browser`、`os` | 无显式关系 | 访问统计 |

## 初始化 SQL 与 Model 一致性

`init_db.sql` 覆盖了当前 SQLModel 主要表：`user`、`category`、`tag`、`post`、`post_tag`、`github_user`、`comment`、`message`、`chatter`、`chatter_comment`、`album`、`photo`、`project`、`friend_link`、`bookmark_category`、`bookmark_site`、`site_config`、`visitor`。未发现 Alembic 或其他迁移工具。`app/database.py` 在启动 lifespan 中执行 `SQLModel.metadata.create_all(engine)`，与 SQL 脚本并存。

风险：

- `init_db.sql` 包含默认管理员账号和演示/初始配置，个性化前必须单独处理。
- SQLModel 自动建表不能替代迁移；字段变更后缺少可追踪升级路径。
- 删除演示数据会影响首页、文章、项目、收藏夹、友链、照片墙、后台仪表盘等展示模块。

## 页面到 API 调用关系

| 页面/路由 | 源文件 | 主要组件/封装 | 后端 API | 外部依赖 | 当前用途 |
|---|---|---|---|---|---|
| `/` | `Kirameku/app/page.tsx`、`HomeClient.tsx` | 首页聚合 | `/api/posts/count`、`/api/chatters/count`、`/api/albums` | 后端 | 首页统计/预览 |
| `/posts` | `Kirameku/app/posts/page.tsx` | `PostCard`、`getPosts`、`getCategories` | `/api/posts`、`/api/categories` | 后端 | 文章列表 |
| `/posts/[slug]` | `Kirameku/app/posts/[slug]/page.tsx` | 文章详情、评论 | `/api/posts/{slug}`、`/api/comments/post/{id}` | GitHub OAuth | 文章详情和评论 |
| `/moments` | `Kirameku/app/moments/page.tsx` | 说说列表 | `/api/chatters`、comments、GitHub me | GitHub OAuth | 说说 |
| `/messages` | `Kirameku/app/messages/page.tsx` | 留言板 | `/api/messages`、`/api/auth/github/*` | GitHub OAuth | 留言/互动 |
| `/bookmark` | `Kirameku/app/bookmark/page.tsx` | 收藏夹 | `/api/bookmarks` | favicon/远程图标 | 站点导航 |
| `/projects` | `Kirameku/app/projects/page.tsx` | 项目展示 | `/api/projects` 或本地 fallback 数据 | 后端/Git 链接 | 项目 |
| `/friends` | `Kirameku/app/friends/page.tsx` | 友链漂流瓶 | `/api/friend-links` | 远程头像 | 友链 |
| `/photowall` | `Kirameku/app/photowall/page.tsx` | 相册/照片 | `/api/albums`、photos | OSS/远程图 | 照片墙 |
| `/timeline` | `Kirameku/app/timeline/page.tsx` | 时间线 | `/api/posts` | 后端 | 归档 |
| `/music` | `Kirameku/app/music/page.tsx` | Meting/音乐 | `/api/music` | 网易云音乐 | 音乐播放器 |
| `/novel` | `Kirameku/app/novel/page.tsx` | 小说书架 | `/reader3/*` | reader 服务 | 小说阅读 |
| `/novel/search` | `Kirameku/app/novel/search/page.tsx` | SSE 搜索 | `/reader3/*` | reader 服务 | 小说搜索 |
| `/garden/*` | `Kirameku/app/garden/**/page.tsx` | 工具箱 | `/api/uapis`、外部 API | `uapis.cn`、`v2.xxapi.cn` 等 | 工具/实验室 |
| `/about` | `Kirameku/app/about/page.tsx` | Markdown/about | 静态/配置 | 原作者素材 | 关于页 |
| `/auth/callback` | `Kirameku/app/auth/callback/page.tsx` | OAuth 回调 | query token | GitHub OAuth | 登录回跳 |
| `/feed` | `Kirameku/app/feed/route.ts` | RSS route handler | `/api/posts` | 后端 | RSS |
| `/api/music` | `Kirameku/app/api/music/route.ts` | Next route | 外部音乐 | 网易云/Meting | 音乐代理 |
| `/api/uapis` | `Kirameku/app/api/uapis/route.ts` | Next route | `uapis.cn` | 外部聚合 API | 工具代理 |

## 文章列表完整调用链

```text
Kirameku/app/posts/page.tsx
→ useEffect 调用 getPosts({ status: "published", page, size, category })
→ Kirameku/app/api/posts.ts getPosts()
→ Kirameku/app/api/client.ts request()
→ fetch(`${siteConfig.apiBaseUrl}/api/posts?...`)
→ Next dev/production 通过 rewrites 或 Nginx 反代到 FastAPI
→ Kirameku-backend/app/api/posts.py list_posts()
→ app.schemas.PostOut 响应模型
→ app.services.post_service.get_posts()
→ SQLModel select(Post)，可按 Category.slug 和 Tag.slug 过滤
→ app.models.Post / Category / Tag / PostTag
→ PostgreSQL 表 post/category/tag/post_tag
→ post_service._post_to_dict() 组装 category 和 tags
→ JSON list[PostOut]
→ PostsPage setPosts()/setHasMore()
→ PostCard 网格渲染
```

关键观察：

- `siteConfig.apiBaseUrl` 当前为空，客户端请求相对路径 `/api/...`。
- `Kirameku/app/page.tsx` 另有 `NEXT_PUBLIC_API_URL || http://localhost:8000` 直连方式，和通用 `request()` 封装不完全一致。
- 后端 `get_post_by_slug()` 会增加 views 并 commit，文章详情 GET 具有写副作用。
