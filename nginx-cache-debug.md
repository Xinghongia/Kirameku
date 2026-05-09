# 记一次让人崩溃的部署踩坑：Nginx 缓存引发的血案

一个小小的缓存问题，我从下午折腾到晚上。真的是气死我了，搞得我还试了各种各样的方法。说实话我还是第一次碰到这样奇奇怪怪的问题的，算是长记性了。

## 起因

博客写完了，准备部署到服务器上。前端是 Next.js 16，后端是 FastAPI，服务器用的阿里云宝塔面板。

本来以为是个简单活——打包、上传、配置 Nginx 反向代理，完事。结果这个"简单活"让我从下午一直折腾到晚上，差点没把我气死。

## 第一个坑：API 地址到底怎么配

Next.js 有个机制：以 `NEXT_PUBLIC_` 开头的环境变量会被打包到前端代码里。我的想法很简单——开发环境用 `http://localhost:8000`，生产环境留空走 Nginx 反代。

于是我写了：

```typescript
apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "",
```

`.env.development` 里写 `http://localhost:8000`，`.env.production` 里留空。

打包，上传，刷新——请求还是发到了 `http://boke.hiromu.top:8000`。

我？？？

反复改了七八种方案：`??` 换 `||`、空字符串、硬编码、运行时检测……没一个管用的。后来才想明白，Next.js 的环境变量在 SSR 和客户端的行为不一致，空字符串可能被当成 `undefined`，然后 fallback 到默认值。

最后的解决方案：**直接用 Next.js 的 `rewrites` 配置代理，完全不用环境变量。**

```typescript
// next.config.ts
async rewrites() {
  return [
    { source: "/api/:path*", destination: "http://127.0.0.1:8000/api/:path*" },
  ];
}
```

`siteConfig.ts` 里直接写死 `apiBaseUrl: ""`。开发环境 Next.js 通过 rewrites 代理到后端，生产环境 Nginx 直接转发，请求根本到不了 Next.js。

就这么简单、干净、没有歧义。早该这么干！

## 第二个恶心人的地方：编译产物没问题，但浏览器就是不对

解决了代码问题，打包上传，重启——还是不行。

我在本地 grep 编译产物，确认 `apiBaseUrl:""` 没问题。但浏览器 Network 面板里清清楚楚显示请求发到了 `http://boke.hiromu.top:8000`。

我都开始怀疑人生了，后来在服务器上跑 grep，发现编译产物确实是空字符串。那浏览器发的 `8000` 是哪来的？后面我又试了些方法还是不行，突然我就发现！我一进入网站是在首页，然后不管我点击哪个导航页面的请求都发不出去，都是奇奇怪怪的[http://boke.hiromu.top:8000](http://boke.hiromu.top:8000)开头，但是但是！！只要是直接在其他页面直接刷新就可以有数据，然后切换到主页有数据显示，但是刷新又没数据又发不了请求了，奇怪的要死。我做了很多测试在浏览器上，fetch('/api/posts?status=published&page=1&size=4').then(r=>r.json()).then(d=>console.log('数据:', d.length)).catch(e=>console.log('错误:', e))，像是这样看看有没有数据，结果就是在主页也可以发请求拿到数据。就离谱！直接刷新就报错

### 关键现象

- 编译产物里**完全没有** `http://boke.hiromu.top:8000` 或 `localhost:8000`
- `curl https://boke.hiromu.top/api/health` 返回 `{"status":"ok"}`，Nginx 反代正常
- 浏览器控制台 `fetch('/api/albums')` 能成功返回数据
- 清除浏览器缓存、无痕模式、换浏览器都不行
- 只有首页出问题，其他页面刷新后正常

答案是：**Nginx 缓存了旧的 HTML 页面。**

0.yx~-n01gczc.js 这个文件名是旧的编译产物。每次 `next build`，Next.js 会根据代码内容生成带 hash 的 chunk 文件名。旧 HTML 里引用的是旧文件名，新 `.next` 里是新文件名。Nginx 把旧 HTML 返回给浏览器，浏览器去找旧 chunk——文件不存在，直接报错。

而且这个缓存不是浏览器缓存，是 **Nginx 服务端缓存**。清浏览器缓存、无痕模式、换浏览器——全都没用，甚至我把项目文件夹内容全删一遍，重新打依赖，重新打包，依旧有缓存，我也不知道为什么这个缓存能这么厉害，反正 Nginx 就是不给你新页面。

## 解决方案

在 Nginx 配置的 `location /` 里加几行：

```nginx
proxy_no_cache 1;
proxy_cache_bypass 1;
proxy_cache off;
add_header Cache-Control "no-cache, no-store, must-revalidate";
```

重载 Nginx，刷新——世界清净了。

## 血的教训

1. **部署问题先查缓存。** 如果 curl 正常但浏览器不对，八成是缓存问题。不要反复改代码。不要不要！
2. **Next.js 的环境变量坑很深。** 前后端分离项目用 rewrites 代理 API，不要用环境变量拼接 URL。
3. **宝塔面板的 Nginx 可能有隐式缓存。** 你没配缓存不代表它没缓存，`proxy_cache_path` 可能在别的配置文件里。
4. **编译产物和运行时是两回事。** 代码里没有 `8000` 不代表浏览器不会发 `8000` 的请求——可能是旧代码在作祟。

## 最后的最后

从下午两点半搞到晚上八点多，一个 Nginx 缓存问题。

有时候 debug 最难的不是找到 bug，而是接受"问题不在你以为的地方"。我一直盯着代码改，反复确认编译产物，但问题根本不在代码里——它在代码和浏览器之间的某个缓存层里。

下次再遇到类似问题，第一件事：`curl` 对比，查缓存。

其实 Nginx 默认不缓存代理内容。是宝塔面板帮你开的，它觉得缓存能减轻后端压力。

不加缓存会怎样：

每个请求都打到 Next.js 进程（端口 3000）
你的服务器只有 1.8GB 内存，Next.js 本身就占 500MB+
如果访问量大，进程可能会崩
加缓存的好处：

Nginx 直接返回缓存的 HTML/JS/CSS，不走 Next.js
响应更快，后端压力更小
对你这种小服务器其实挺重要的
问题是宝塔的缓存太激进了，连 HTML 都缓存，导致部署后页面不更新。

更好的方案是只缓存静态资源（JS/CSS/图片），不缓存 HTML：

对这个个人博客来说，关掉缓存完全没问题。访问量不大，Next.js 能扛得住。

如果以后流量大了，更好的做法是只缓存静态资源，不缓存 HTML。Next.js 的 JS/CSS 文件名自带 hash（chunk.abc123.js），内容变了文件名就变了，可以放心缓存

```
# 静态资源缓存 30 天（Next.js 带 hash，更新自动换文件名）
location /_next/static/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_cache_valid 200 30d;
    add_header Cache-Control "public, max-age=2592000";
}

# HTML 不缓存
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_cache off;
    add_header Cache-Control "no-cache";
    # ...
}

```
