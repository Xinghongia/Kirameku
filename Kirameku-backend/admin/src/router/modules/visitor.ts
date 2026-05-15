import { visitor } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/visitor",
  name: "Visitor",
  component: Layout,
  redirect: "/visitor/index",
  meta: {
    icon: "ri:user-search-line",
    title: "访客记录",
    rank: visitor
  },
  children: [
    {
      path: "/visitor/index",
      name: "VisitorIndex",
      component: () => import("@/views/visitor/index.vue"),
      meta: {
        title: "访客记录"
      }
    }
  ]
} satisfies RouteConfigsTable;
