import { project } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/project",
  name: "Project",
  component: Layout,
  redirect: "/project/index",
  meta: {
    icon: "ri:rocket-2-line",
    title: "项目管理",
    rank: project
  },
  children: [
    {
      path: "/project/index",
      name: "ProjectIndex",
      component: () => import("@/views/project/index.vue"),
      meta: {
        title: "项目管理"
      }
    }
  ]
} satisfies RouteConfigsTable;
