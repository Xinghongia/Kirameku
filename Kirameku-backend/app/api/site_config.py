from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session

from app.deps import get_session
from app.schemas import SiteConfigUpdate, SiteConfigOut
from app.services import site_config_service
from app.deps import get_current_user

router = APIRouter(prefix="/api/site-config", tags=["站点配置"])


class SiteConfigCreate(BaseModel):
    key: str
    value: str = ""
    description: str = ""


@router.get("")
def get_all_config(session: Session = Depends(get_session)):
    return site_config_service.get_all_config(session)


@router.get("/list")
def get_all_config_list(
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return site_config_service.get_all_config_list(session)


@router.get("/{key}")
def get_config(key: str, session: Session = Depends(get_session)):
    return site_config_service.get_config(session, key)


@router.post("", response_model=SiteConfigOut)
def create_config(
    data: SiteConfigCreate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return site_config_service.create_config(session, data.key, data.value, data.description)


@router.put("/{key}", response_model=SiteConfigOut)
def update_config(
    key: str,
    data: SiteConfigUpdate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return site_config_service.update_config(session, key, data)


@router.put("")
def batch_update_config(
    configs: dict,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return site_config_service.batch_update_config(session, configs)


@router.delete("/{key}")
def delete_config(
    key: str,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    site_config_service.delete_config(session, key)
    return {"ok": True}
