import { http } from "@/utils/http";

export type GitHubUserInfo = {
  id: number;
  login: string;
  avatar: string;
  bio: string;
};

export type MessageItem = {
  id: number;
  github_user_id: number | null;
  parent_id: number | null;
  content: string;
  ip: string;
  status: string;
  likes: number;
  created_at: string;
  github_user: GitHubUserInfo | null;
  replies: MessageItem[];
};

/** 管理-获取留言列表 */
export const getAdminMessages = (params?: {
  status?: string;
  page?: number;
  size?: number;
}) => {
  return http.request<MessageItem[]>("get", "/api/messages/admin", { params });
};

/** 更新留言状态 */
export const updateMessageStatus = (messageId: number, status: string) => {
  return http.request("put", `/api/messages/${messageId}/status`, {
    data: { status }
  });
};

/** 删除留言 */
export const deleteMessage = (messageId: number) => {
  return http.request<{ ok: boolean }>("delete", `/api/messages/${messageId}`);
};
