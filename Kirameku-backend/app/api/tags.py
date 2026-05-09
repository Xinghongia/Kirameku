from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.deps import get_session
from app.schemas import TagCreate, TagUpdate, TagOut
from app.services import tag_service
from app.deps import get_current_user

router = APIRouter(prefix="/api/tags", tags=["标签"])


@router.get("", response_model=list[TagOut])
def list_tags(session: Session = Depends(get_session)):
    return tag_service.get_tags(session)


@router.post("", response_model=TagOut)
def create_tag(
    data: TagCreate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return tag_service.create_tag(session, data)


@router.put("/{tag_id}", response_model=TagOut)
def update_tag(
    tag_id: int,
    data: TagUpdate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return tag_service.update_tag(session, tag_id, data)


@router.delete("/{tag_id}")
def delete_tag(
    tag_id: int,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    tag_service.delete_tag(session, tag_id)
    return {"ok": True}
