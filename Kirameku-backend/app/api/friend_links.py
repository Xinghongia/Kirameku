from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.deps import get_session
from app.schemas import FriendLinkCreate, FriendLinkUpdate, FriendLinkOut
from app.services import friend_link_service
from app.deps import get_current_user

router = APIRouter(prefix="/api/friend-links", tags=["友链"])


@router.get("", response_model=list[FriendLinkOut])
def list_friend_links(session: Session = Depends(get_session)):
    return friend_link_service.get_friend_links(session, approved_only=True)


@router.get("/admin", response_model=list[FriendLinkOut])
def admin_list_friend_links(
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return friend_link_service.get_friend_links(session, approved_only=False)


@router.post("", response_model=FriendLinkOut)
def create_friend_link(
    data: FriendLinkCreate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return friend_link_service.create_friend_link(session, data)


@router.put("/{link_id}", response_model=FriendLinkOut)
def update_friend_link(
    link_id: int,
    data: FriendLinkUpdate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return friend_link_service.update_friend_link(session, link_id, data)


@router.delete("/{link_id}")
def delete_friend_link(
    link_id: int,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    friend_link_service.delete_friend_link(session, link_id)
    return {"ok": True}
