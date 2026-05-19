import json
from datetime import datetime
from sqlmodel import Session, select, func
from fastapi import HTTPException

from app.models import Chatter, ChatterComment, GitHubUser
from app.schemas import ChatterCreate, ChatterUpdate, ChatterCommentCreate


def _comment_to_dict(session: Session, c: ChatterComment, include_ip: bool = False, fetch_replies: bool = False) -> dict:
    gh_user = session.get(GitHubUser, c.github_user_id) if c.github_user_id else None
    d = {
        "id": c.id,
        "chatter_id": c.chatter_id,
        "parent_id": c.parent_id,
        "content": c.content,
        "likes": c.likes,
        "status": c.status,
        "created_at": c.created_at,
        "github_user": {
            "id": gh_user.id,
            "login": gh_user.login,
            "avatar": gh_user.avatar,
            "bio": gh_user.bio,
        } if gh_user else None,
        "replies": [],
    }
    if include_ip:
        d["ip"] = c.ip
    if fetch_replies:
        replies = list(
            session.exec(
                select(ChatterComment)
                .where(ChatterComment.parent_id == c.id)
                .order_by(ChatterComment.created_at)
            ).all()
        )
        d["replies"] = [_comment_to_dict(session, r, include_ip=include_ip, fetch_replies=True) for r in replies]
    return d


def get_chatters(
    session: Session,
    status: str = "published",
    page: int = 1,
    size: int = 20,
) -> list[dict]:
    q = select(Chatter)
    if status:
        q = q.where(Chatter.status == status)
    q = q.order_by(Chatter.created_at.desc())
    q = q.offset((page - 1) * size).limit(size)
    rows = list(session.exec(q).all())
    return [
        {
            "id": r.id,
            "content": r.content,
            "images": json.loads(r.images) if r.images else [],
            "mood": r.mood or "",
            "likes": r.likes,
            "comments_count": r.comments_count,
            "status": r.status,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        }
        for r in rows
    ]


def get_chatter_by_id(session: Session, chatter_id: int) -> dict:
    c = session.get(Chatter, chatter_id)
    if not c:
        raise HTTPException(status_code=404, detail="说说不存在")
    return {
        "id": c.id,
        "content": c.content,
        "images": json.loads(c.images) if c.images else [],
        "mood": c.mood or "",
        "likes": c.likes,
        "comments_count": c.comments_count,
        "status": c.status,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
    }


def create_chatter(session: Session, data: ChatterCreate) -> dict:
    c = Chatter(
        content=data.content,
        images=json.dumps(data.images, ensure_ascii=False),
        mood=data.mood,
        status=data.status,
    )
    if c.status == "published":
        c.created_at = datetime.now()
    session.add(c)
    session.commit()
    session.refresh(c)
    assert c.id is not None
    return get_chatter_by_id(session, c.id)


def update_chatter(session: Session, chatter_id: int, data: ChatterUpdate) -> dict:
    c = session.get(Chatter, chatter_id)
    if not c:
        raise HTTPException(status_code=404, detail="说说不存在")
    if data.content is not None:
        c.content = data.content
    if data.images is not None:
        c.images = json.dumps(data.images, ensure_ascii=False)
    if data.mood is not None:
        c.mood = data.mood
    if data.status is not None:
        c.status = data.status
    c.updated_at = datetime.now()
    session.add(c)
    session.commit()
    session.refresh(c)
    assert c.id is not None
    return get_chatter_by_id(session, c.id)


def count_chatters(session: Session, status: str = "published") -> int:
    q = select(func.count(Chatter.id))
    if status:
        q = q.where(Chatter.status == status)
    return session.exec(q).one()


def delete_chatter(session: Session, chatter_id: int):
    c = session.get(Chatter, chatter_id)
    if not c:
        raise HTTPException(status_code=404, detail="说说不存在")
    session.delete(c)
    session.commit()


def get_chatter_comments(session: Session, chatter_id: int) -> list[dict]:
    rows = list(
        session.exec(
            select(ChatterComment)
            .where(ChatterComment.chatter_id == chatter_id, ChatterComment.status == "approved")
            .order_by(ChatterComment.created_at.desc())
        ).all()
    )
    id_map: dict[int, dict] = {}
    roots: list[dict] = []
    for c in rows:
        d = _comment_to_dict(session, c)
        id_map[c.id] = d
    for c in rows:
        d = id_map[c.id]
        if c.parent_id and c.parent_id in id_map:
            id_map[c.parent_id]["replies"].append(d)
        else:
            roots.append(d)
    return roots


def create_chatter_comment(
    session: Session,
    data: ChatterCommentCreate,
    github_user: GitHubUser | None = None,
    ip: str = "",
) -> dict:
    if not github_user:
        raise HTTPException(401, "请先登录 GitHub")

    if data.parent_id:
        parent = session.get(ChatterComment, data.parent_id)
        if not parent:
            raise HTTPException(404, "被回复的评论不存在")

    c = session.get(Chatter, data.chatter_id)
    if not c:
        raise HTTPException(status_code=404, detail="说说不存在")

    comment = ChatterComment(
        chatter_id=data.chatter_id,
        parent_id=data.parent_id,
        github_user_id=github_user.id,
        content=data.content,
        ip=ip,
    )
    session.add(comment)
    session.flush()
    c.comments_count += 1
    session.add(c)
    session.commit()
    session.refresh(comment)
    return _comment_to_dict(session, comment)


def get_chatter_comments_admin(
    session: Session,
    status: str | None = None,
    page: int = 1,
    size: int = 20,
) -> list[dict]:
    q = select(ChatterComment).where(ChatterComment.parent_id.is_(None))
    if status:
        q = q.where(ChatterComment.status == status)
    q = q.order_by(ChatterComment.created_at.desc())
    q = q.offset((page - 1) * size).limit(size)
    rows = list(session.exec(q).all())
    return [_comment_to_dict(session, c, include_ip=True, fetch_replies=True) for c in rows]


def update_chatter_comment_status(session: Session, comment_id: int, status: str) -> dict:
    comment = session.get(ChatterComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")
    comment.status = status
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return _comment_to_dict(session, comment)


def delete_chatter_comment(session: Session, comment_id: int):
    comment = session.get(ChatterComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")
    session.delete(comment)
    session.commit()


def toggle_like(session: Session, chatter_id: int, unlike: bool = False) -> dict:
    c = session.get(Chatter, chatter_id)
    if not c:
        raise HTTPException(404, "说说不存在")
    c.likes = max(0, c.likes + (-1 if unlike else 1))
    session.add(c)
    session.commit()
    session.refresh(c)
    return {"likes": c.likes}


def toggle_comment_like(session: Session, comment_id: int, unlike: bool = False) -> dict:
    c = session.get(ChatterComment, comment_id)
    if not c:
        raise HTTPException(404, "评论不存在")
    c.likes = max(0, c.likes + (-1 if unlike else 1))
    session.add(c)
    session.commit()
    session.refresh(c)
    return _comment_to_dict(session, c)
