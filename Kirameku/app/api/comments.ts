import { request } from "./client";
import type { GitHubUser } from "./types";

export interface CommentItem {
  id: number;
  post_id: number;
  parent_id: number | null;
  content: string;
  likes: number;
  status: string;
  created_at: string;
  github_user: GitHubUser | null;
  replies: CommentItem[];
}

export function getPostComments(postId: number) {
  return request<CommentItem[]>(`/api/comments/post/${postId}`);
}

export function createComment(data: {
  post_id: number;
  parent_id?: number;
  content: string;
}) {
  return request<CommentItem>("/api/comments", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
}

export function likeComment(commentId: number, unlike = false) {
  return request<CommentItem>(
    `/api/comments/${commentId}/${unlike ? "unlike" : "like"}`,
    { method: "POST" }
  );
}

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("github_token") || "";
}
