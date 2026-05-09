import { http } from "@/utils/http";

export type SiteConfigItem = {
  id: number;
  key: string;
  value: string;
  description: string;
  updated_at: string;
};

/** 获取所有站点配置（带详情） */
export const getAllSiteConfig = () => {
  return http.request<SiteConfigItem[]>("get", "/api/site-config/list");
};

/** 获取单个配置 */
export const getSiteConfig = (key: string) => {
  return http.request<SiteConfigItem>("get", `/api/site-config/${key}`);
};

/** 更新单个配置 */
export const updateSiteConfig = (
  key: string,
  data: { value: string; description?: string }
) => {
  return http.request<SiteConfigItem>("put", `/api/site-config/${key}`, {
    data
  });
};

/** 新增配置 */
export const createSiteConfig = (data: {
  key: string;
  value: string;
  description?: string;
}) => {
  return http.request<SiteConfigItem>("post", "/api/site-config", { data });
};

/** 删除配置 */
export const deleteSiteConfig = (key: string) => {
  return http.request<{ ok: boolean }>("delete", `/api/site-config/${key}`);
};
