from datetime import datetime
from pydantic import BaseModel


class GitHubUserOut(BaseModel):
    id: int
    login: str
    avatar: str
    bio: str


class ChatterCreate(BaseModel):
    content: str
    images: list[str] = []
    mood: str = ""
    status: str = "draft"


class ChatterUpdate(BaseModel):
    content: str | None = None
    images: list[str] | None = None
    mood: str | None = None
    status: str | None = None


class ChatterOut(BaseModel):
    id: int
    content: str
    images: list[str] = []
    mood: str
    likes: int
    comments_count: int
    status: str
    created_at: datetime
    updated_at: datetime | None = None


class ChatterCommentCreate(BaseModel):
    chatter_id: int
    parent_id: int | None = None
    content: str


class ChatterCommentOut(BaseModel):
    id: int
    chatter_id: int
    parent_id: int | None
    content: str
    likes: int = 0
    status: str
    created_at: datetime
    github_user: GitHubUserOut | None = None
    replies: list["ChatterCommentOut"] = []
