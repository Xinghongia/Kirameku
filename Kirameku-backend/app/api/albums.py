from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.deps import get_session
from app.schemas import AlbumCreate, AlbumUpdate, AlbumOut, PhotoCreate, PhotoOut
from app.services import album_service
from app.deps import get_current_user

router = APIRouter(prefix="/api/albums", tags=["相册"])


@router.get("", response_model=list[AlbumOut])
def list_albums(session: Session = Depends(get_session)):
    return album_service.get_albums(session)


@router.get("/{album_id}", response_model=AlbumOut)
def get_album(album_id: int, session: Session = Depends(get_session)):
    return album_service.get_album_by_id(session, album_id)


@router.get("/{album_id}/photos", response_model=list[PhotoOut])
def get_album_photos(album_id: int, session: Session = Depends(get_session)):
    return album_service.get_photos(session, album_id)


@router.post("", response_model=AlbumOut)
def create_album(
    data: AlbumCreate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return album_service.create_album(session, data)


@router.put("/{album_id}", response_model=AlbumOut)
def update_album(
    album_id: int,
    data: AlbumUpdate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return album_service.update_album(session, album_id, data)


@router.delete("/{album_id}")
def delete_album(
    album_id: int,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    album_service.delete_album(session, album_id)
    return {"ok": True}


@router.post("/photos", response_model=PhotoOut)
def add_photo(
    data: PhotoCreate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return album_service.add_photo(session, data)


@router.delete("/photos/{photo_id}")
def delete_photo(
    photo_id: int,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    album_service.delete_photo(session, photo_id)
    return {"ok": True}
