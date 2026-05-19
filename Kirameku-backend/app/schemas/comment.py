from datetime import datetime
from pydantic import BaseModel


class GitHubUserOut(BaseModel):
    id: int
    login: str
    avatar: str
    bio: str


class CommentCreate(BaseModel):
    post_id: int
    parent_id: int | None = None
    content: str


class CommentOut(BaseModel):
    id: int
    post_id: int
    parent_id: int | None
    content: str
    likes: int = 0
    status: str
    created_at: datetime
    github_user: GitHubUserOut | None = None
    replies: list["CommentOut"] = []


class CommentAdminUpdate(BaseModel):
    status: str  # approved / rejected


# 留言板/杂谈
class MessageCreate(BaseModel):
    content: str
    parent_id: int | None = None


class MessageOut(BaseModel):
    id: int
    github_user_id: int | None
    parent_id: int | None
    content: str
    ip: str = ""
    status: str
    likes: int
    created_at: datetime
    github_user: GitHubUserOut | None = None
    replies: list["MessageOut"] = []


class MessageAdminUpdate(BaseModel):
    status: str
