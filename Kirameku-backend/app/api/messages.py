from fastapi import APIRouter, Depends, Query, Request
from sqlmodel import Session

from app.deps import get_session
from app.schemas import MessageCreate, MessageOut, MessageAdminUpdate
from app.services import message_service
from app.deps import get_current_user
from app.api.github_auth import _get_github_user, get_github_user_optional

router = APIRouter(prefix="/api/messages", tags=["留言板"])


# ---- 公开接口 ----

@router.get("", response_model=list[MessageOut])
def list_messages(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
):
    return message_service.get_messages(session, "approved", page, size)


@router.get("/count")
def message_count(session: Session = Depends(get_session)):
    return {"count": message_service.get_message_count(session, "approved")}


@router.post("", response_model=dict)
def create_message(
    data: MessageCreate,
    request: Request,
    session: Session = Depends(get_session),
):
    user = get_github_user_optional(request, session)
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if not ip:
        ip = request.headers.get("x-real-ip", "")
    if not ip:
        ip = request.client.host if request.client else ""
    return message_service.create_message(session, data, user, ip)


@router.post("/{msg_id}/like")
def like_message(
    msg_id: int,
    session: Session = Depends(get_session),
):
    return message_service.toggle_like(session, msg_id, unlike=False)


@router.post("/{msg_id}/unlike")
def unlike_message(
    msg_id: int,
    session: Session = Depends(get_session),
):
    return message_service.toggle_like(session, msg_id, unlike=True)


# ---- 管理接口 ----

@router.get("/admin", response_model=list[MessageOut])
def admin_list_messages(
    status: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return message_service.get_messages(session, status, page, size)


@router.put("/{msg_id}/status")
def update_message_status(
    msg_id: int,
    data: MessageAdminUpdate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return message_service.update_message_status(session, msg_id, data.status)


@router.delete("/{msg_id}")
def delete_message(
    msg_id: int,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    message_service.delete_message(session, msg_id)
    return {"ok": True}
