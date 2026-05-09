from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.deps import get_session
from app.schemas import ProjectCreate, ProjectUpdate, ProjectOut
from app.services import project_service
from app.deps import get_current_user

router = APIRouter(prefix="/api/projects", tags=["项目"])


@router.get("", response_model=list[ProjectOut])
def list_projects(session: Session = Depends(get_session)):
    return project_service.get_projects(session)


@router.get("/{slug}", response_model=ProjectOut)
def get_project(slug: str, session: Session = Depends(get_session)):
    return project_service.get_project_by_slug(session, slug)


@router.post("", response_model=ProjectOut)
def create_project(
    data: ProjectCreate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return project_service.create_project(session, data)


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return project_service.update_project(session, project_id, data)


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    project_service.delete_project(session, project_id)
    return {"ok": True}
