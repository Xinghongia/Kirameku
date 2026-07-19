import { http } from "@/utils/http";

export type CommentItem = {
  id: number;
  post_id: number;
  parent_id: number | null;
  content: string;
  ip: string;
  status: string;
  created_at: string;
  github_user: {
    id: number;
    login: string;
    avatar: string;
    bio: string;
  } | null;
  replies?: CommentItem[];
};

/** 获取文章评论列表 */
export const getPostComments = (postId: number) => {
  return http.request<CommentItem[]>("get", `/api/comments/post/${postId}`);
};

/** 管理-获取评论列表 */
export const getAdminComments = (params?: {
  status?: string;
  page?: number;
  size?: number;
}) => {
  return http.request<CommentItem[]>("get", "/api/comments/admin", { params });
};

/** 更新评论状态 */
export const updateCommentStatus = (commentId: number, status: string) => {
  return http.request("put", `/api/comments/${commentId}/status`, {
    data: { status }
  });
};

/** 删除评论 */
export const deleteComment = (commentId: number) => {
  return http.request<{ ok: boolean }>("delete", `/api/comments/${commentId}`);
};
