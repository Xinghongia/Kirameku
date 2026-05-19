from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Chatter(SQLModel, table=True):
    __tablename__ = "chatter"

    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    images: str = Field(default="[]")
    mood: str = Field(default="", max_length=20)
    likes: int = Field(default=0)
    comments_count: int = Field(default=0)
    status: str = Field(default="draft", max_length=20, index=True)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class ChatterComment(SQLModel, table=True):
    __tablename__ = "chatter_comment"

    id: Optional[int] = Field(default=None, primary_key=True)
    chatter_id: int = Field(foreign_key="chatter.id", index=True)
    parent_id: Optional[int] = Field(default=None, foreign_key="chatter_comment.id")
    github_user_id: Optional[int] = Field(default=None, foreign_key="github_user.id")
    content: str
    ip: str = Field(default="", max_length=45)
    likes: int = Field(default=0)
    status: str = Field(default="approved", max_length=20, index=True)
    created_at: datetime = Field(default_factory=datetime.now)
