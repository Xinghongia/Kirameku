from fastapi import APIRouter, Depends, Query, Request
from sqlmodel import Session

from app.deps import get_session
from app.schemas import (
    ChatterCreate, ChatterUpdate, ChatterOut,
    ChatterCommentCreate, ChatterCommentOut,
)
from app.schemas.comment import CommentAdminUpdate
from app.services import chatter_service
from app.deps import get_current_user
from app.api.github_auth import get_github_user_optional

router = APIRouter(prefix="/api/chatters", tags=["说说"])


# ---- 公开接口 ----

@router.get("", response_model=list[ChatterOut])
def list_chatters(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=200),
    session: Session = Depends(get_session),
):
    return chatter_service.get_chatters(session, "published", page, size)


@router.get("/count")
def chatter_count(
    status: str = "published",
    session: Session = Depends(get_session),
):
    return {"count": chatter_service.count_chatters(session, status)}


@router.get("/{chatter_id}/comments", response_model=list[ChatterCommentOut])
def get_chatter_comments(
    chatter_id: int, session: Session = Depends(get_session)
):
    return chatter_service.get_chatter_comments(session, chatter_id)


@router.post("/comments", response_model=ChatterCommentOut)
def create_chatter_comment(
    data: ChatterCommentCreate,
    request: Request,
    session: Session = Depends(get_session),
):
    user = get_github_user_optional(request, session)
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if not ip:
        ip = request.headers.get("x-real-ip", "")
    if not ip:
        ip = request.client.host if request.client else ""
    return chatter_service.create_chatter_comment(session, data, user, ip)


# ---- 管理接口（必须在 /{chatter_id} 之前注册，否则 "admin" 会被当成 chatter_id）----

@router.get("/admin", response_model=list[ChatterOut])
def admin_list_chatters(
    status: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=200),
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return chatter_service.get_chatters(session, status, page, size)


@router.post("", response_model=ChatterOut)
def create_chatter(
    data: ChatterCreate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return chatter_service.create_chatter(session, data)


# ---- 管理接口 - 说说评论 ----

@router.get("/comments/admin")
def admin_list_chatter_comments(
    status: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return chatter_service.get_chatter_comments_admin(session, status, page, size)


@router.put("/comments/{comment_id}/status")
def update_chatter_comment_status(
    comment_id: int,
    data: CommentAdminUpdate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return chatter_service.update_chatter_comment_status(session, comment_id, data.status)


@router.delete("/comments/{comment_id}")
def delete_chatter_comment(
    comment_id: int,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    chatter_service.delete_chatter_comment(session, comment_id)
    return {"ok": True}


@router.post("/comments/{comment_id}/like", response_model=ChatterCommentOut)
def like_chatter_comment(comment_id: int, session: Session = Depends(get_session)):
    return chatter_service.toggle_comment_like(session, comment_id, unlike=False)


@router.post("/comments/{comment_id}/unlike", response_model=ChatterCommentOut)
def unlike_chatter_comment(comment_id: int, session: Session = Depends(get_session)):
    return chatter_service.toggle_comment_like(session, comment_id, unlike=True)


# ---- 动态路由 ----

@router.get("/{chatter_id}", response_model=ChatterOut)
def get_chatter(chatter_id: int, session: Session = Depends(get_session)):
    return chatter_service.get_chatter_by_id(session, chatter_id)


@router.post("/{chatter_id}/like")
def like_chatter(chatter_id: int, session: Session = Depends(get_session)):
    return chatter_service.toggle_like(session, chatter_id, unlike=False)


@router.post("/{chatter_id}/unlike")
def unlike_chatter(chatter_id: int, session: Session = Depends(get_session)):
    return chatter_service.toggle_like(session, chatter_id, unlike=True)


@router.put("/{chatter_id}", response_model=ChatterOut)
def update_chatter(
    chatter_id: int,
    data: ChatterUpdate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return chatter_service.update_chatter(session, chatter_id, data)


@router.delete("/{chatter_id}")
def delete_chatter(
    chatter_id: int,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    chatter_service.delete_chatter(session, chatter_id)
    return {"ok": True}
