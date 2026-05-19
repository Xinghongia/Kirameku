from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Comment(SQLModel, table=True):
    __tablename__ = "comment"

    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(foreign_key="post.id", index=True)
    parent_id: Optional[int] = Field(default=None, foreign_key="comment.id")
    github_user_id: Optional[int] = Field(default=None, foreign_key="github_user.id", index=True)
    content: str
    likes: int = Field(default=0)
    ip: str = Field(default="", max_length=45)
    status: str = Field(default="approved", max_length=20, index=True)
    created_at: datetime = Field(default_factory=datetime.now)
