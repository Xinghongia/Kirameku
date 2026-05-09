from fastapi import APIRouter, Depends, Query, Request
from sqlmodel import Session

from app.deps import get_session
from app.schemas import (
    ChatterCreate, ChatterUpdate, ChatterOut,
    ChatterCommentCreate, ChatterCommentOut,
)
from app.services import chatter_service
from app.deps import get_current_user

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


@router.get("/{chatter_id}", response_model=ChatterOut)
def get_chatter(chatter_id: int, session: Session = Depends(get_session)):
    return chatter_service.get_chatter_by_id(session, chatter_id)


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
    ip = request.client.host if request.client else ""
    return chatter_service.create_chatter_comment(session, data, ip)


# ---- 管理接口 ----

@router.post("", response_model=ChatterOut)
def create_chatter(
    data: ChatterCreate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return chatter_service.create_chatter(session, data)


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
