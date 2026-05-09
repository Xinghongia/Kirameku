from fastapi import APIRouter, Depends, Query, Request
from sqlmodel import Session

from app.deps import get_session
from app.schemas import CommentCreate, CommentOut, CommentAdminUpdate
from app.services import comment_service
from app.deps import get_current_user

router = APIRouter(prefix="/api/comments", tags=["评论"])


# ---- 公开接口 ----

@router.get("/post/{post_id}", response_model=list[CommentOut])
def get_post_comments(post_id: int, session: Session = Depends(get_session)):
    return comment_service.get_comments_by_post(session, post_id)


@router.post("", response_model=CommentOut)
def create_comment(
    data: CommentCreate,    
    request: Request,
    session: Session = Depends(get_session),
):
    ip = request.client.host if request.client else ""
    return comment_service.create_comment(session, data, ip)


# ---- 管理接口 ----

@router.get("/admin", response_model=list[CommentOut])
def admin_list_comments(
    status: str | None = None, 
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return comment_service.get_comments_admin(session, status, page, size)


@router.put("/{comment_id}/status")
def update_comment_status(
    comment_id: int,
    data: CommentAdminUpdate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return comment_service.update_comment_status(session, comment_id, data.status)


@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    comment_service.delete_comment(session, comment_id)
    return {"ok": True}
