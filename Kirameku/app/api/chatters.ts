import { request, qs } from "./client";
import type { GitHubUser } from "./types";

export interface ChatterItem {
  id: number;
  content: string;
  images: string[];
  mood: string;
  likes: number;
  comments_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ChatterCommentItem {
  id: number;
  chatter_id: number;
  parent_id: number | null;
  content: string;
  likes: number;
  status: string;
  created_at: string;
  github_user: GitHubUser | null;
  replies: ChatterCommentItem[];
}

export function getChatters(params?: {
  status?: string;
  page?: number;
  size?: number;
}) {
  return request<ChatterItem[]>(`/api/chatters${qs(params)}`);
}

export function getChattersCount(status?: string) {
  return request<{ count: number }>(
    `/api/chatters/count${qs({ status })}`
  );
}

export function getChatterById(chatterId: number) {
  return request<ChatterItem>(`/api/chatters/${chatterId}`);
}

export function getChatterComments(chatterId: number) {
  return request<ChatterCommentItem[]>(
    `/api/chatters/${chatterId}/comments`
  );
}

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("github_token") || "";
}

export function createChatterComment(data: {
  chatter_id: number;
  parent_id?: number;
  content: string;
}) {
  return request<ChatterCommentItem>("/api/chatters/comments", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
}

export function likeChatter(chatterId: number, unlike = false) {
  return request<{ likes: number }>(
    `/api/chatters/${chatterId}/${unlike ? "unlike" : "like"}`,
    { method: "POST" }
  );
}

export function likeChatterComment(commentId: number, unlike = false) {
  return request<ChatterCommentItem>(
    `/api/chatters/comments/${commentId}/${unlike ? "unlike" : "like"}`,
    { method: "POST" }
  );
}
