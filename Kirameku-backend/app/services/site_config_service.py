import json
from sqlmodel import Session, select
from fastapi import HTTPException

from app.models import SiteConfig
from app.schemas import SiteConfigUpdate


def get_all_config(session: Session) -> dict[str, any]:
    """返回所有配置的 key-value 字典。"""
    rows = list(session.exec(select(SiteConfig)).all())
    result = {}
    for r in rows:
        try:
            result[r.key] = json.loads(r.value)
        except (json.JSONDecodeError, TypeError):
            result[r.key] = r.value
    return result


def get_all_config_list(session: Session) -> list[dict]:
    """返回所有配置的完整列表（含 id、description、updated_at）。"""
    rows = list(session.exec(select(SiteConfig).order_by(SiteConfig.id)).all())
    return [
        {
            "id": r.id,
            "key": r.key,
            "value": r.value,
            "description": r.description or "",
            "updated_at": r.updated_at.isoformat() if r.updated_at else "",
        }
        for r in rows
    ]


def create_config(session: Session, key: str, value: str, description: str = "") -> SiteConfig:
    """新建配置项。"""
    existing = session.exec(select(SiteConfig).where(SiteConfig.key == key)).first()
    if existing:
        raise HTTPException(400, f"配置 {key} 已存在")
    row = SiteConfig(key=key, value=value, description=description)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def delete_config(session: Session, key: str):
    """删除配置项。"""
    row = session.exec(select(SiteConfig).where(SiteConfig.key == key)).first()
    if not row:
        raise HTTPException(404, f"配置 {key} 不存在")
    session.delete(row)
    session.commit()


def get_config(session: Session, key: str) -> any:
    row = session.exec(select(SiteConfig).where(SiteConfig.key == key)).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"配置 {key} 不存在")
    try:
        return json.loads(row.value)
    except (json.JSONDecodeError, TypeError):
        return row.value


def update_config(session: Session, key: str, data: SiteConfigUpdate) -> SiteConfig:
    row = session.exec(select(SiteConfig).where(SiteConfig.key == key)).first()
    if not row:
        row = SiteConfig(key=key, value=data.value, description=data.description)
    else:
        row.value = data.value
        if data.description:
            row.description = data.description
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def batch_update_config(session: Session, configs: dict[str, str]) -> dict:
    """批量更新配置。"""
    for key, value in configs.items():
        row = session.exec(select(SiteConfig).where(SiteConfig.key == key)).first()
        if not row:
            row = SiteConfig(key=key, value=json.dumps(value, ensure_ascii=False))
        else:
            row.value = json.dumps(value, ensure_ascii=False)
        session.add(row)
    session.commit()
    return get_all_config(session)
