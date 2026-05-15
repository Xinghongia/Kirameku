import { http } from "@/utils/http";

export type VisitorItem = {
  id: number;
  ip: string;
  path: string;
  city: string;
  region: string;
  country: string;
  org: string;
  browser: string;
  os: string;
  device_type: string;
  created_at: string;
};

export type VisitorResponse = {
  code: number;
  data: VisitorItem[];
};

export type VisitorCountResponse = {
  code: number;
  count: number;
};

/** 获取最近访客列表 */
export const getVisitors = (params?: { page?: number; size?: number }) => {
  return http.request<VisitorResponse>("get", "/api/visitors", { params });
};

/** 获取总访客数 */
export const getVisitorCount = () => {
  return http.request<VisitorCountResponse>("get", "/api/visitors/count");
};

/** 删除单条访客记录 */
export const deleteVisitor = (visitorId: number) => {
  return http.request<{ code: number }>("delete", `/api/visitors/${visitorId}`);
};

/** 清空所有访客记录 */
export const clearVisitors = () => {
  return http.request<{ code: number }>("delete", "/api/visitors");
};
