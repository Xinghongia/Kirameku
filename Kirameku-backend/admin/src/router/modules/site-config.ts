import { siteConfig } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/site-config",
  name: "SiteConfig",
  component: Layout,
  redirect: "/site-config/index",
  meta: {
    icon: "ri:settings-3-line",
    title: "站点配置",
    rank: siteConfig
  },
  children: [
    {
      path: "/site-config/index",
      name: "SiteConfigIndex",
      component: () => import("@/views/site-config/index.vue"),
      meta: {
        title: "站点配置"
      }
    }
  ]
} satisfies RouteConfigsTable;
