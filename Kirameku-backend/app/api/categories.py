from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.deps import get_session
from app.schemas import CategoryCreate, CategoryUpdate, CategoryOut
from app.services import category_service
from app.deps import get_current_user

router = APIRouter(prefix="/api/categories", tags=["分类"])


@router.get("", response_model=list[CategoryOut])
def list_categories(session: Session = Depends(get_session)):
    return category_service.get_categories(session)


@router.post("", response_model=CategoryOut)
def create_category(
    data: CategoryCreate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return category_service.create_category(session, data)


@router.put("/{cat_id}", response_model=CategoryOut)
def update_category(
    cat_id: int,
    data: CategoryUpdate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return category_service.update_category(session, cat_id, data)


@router.delete("/{cat_id}")
def delete_category(
    cat_id: int,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    category_service.delete_category(session, cat_id)
    return {"ok": True}
