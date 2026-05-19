from sqlmodel import Session, select
from fastapi import HTTPException

from app.models import Comment, GitHubUser
from app.schemas import CommentCreate


def _comment_to_dict(session: Session, c: Comment, include_ip: bool = False, fetch_replies: bool = False) -> dict:
    gh_user = session.get(GitHubUser, c.github_user_id) if c.github_user_id else None
    d = {
        "id": c.id,
        "post_id": c.post_id,
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
                select(Comment)
                .where(Comment.parent_id == c.id)
                .order_by(Comment.created_at)
            ).all()
        )
        d["replies"] = [_comment_to_dict(session, r, include_ip=include_ip, fetch_replies=True) for r in replies]
    return d


def get_comments_by_post(session: Session, post_id: int) -> list[dict]:
    """获取文章的所有已审核评论，按层级组装。"""
    rows = list(
        session.exec(
            select(Comment)
            .where(Comment.post_id == post_id, Comment.status == "approved")
            .order_by(Comment.created_at.desc())
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


def get_comments_admin(
    session: Session,
    status: str | None = None,
    page: int = 1,
    size: int = 20,
) -> list[dict]:
    q = select(Comment).where(Comment.parent_id.is_(None))
    if status:
        q = q.where(Comment.status == status)
    q = q.order_by(Comment.created_at.desc())
    q = q.offset((page - 1) * size).limit(size)
    rows = list(session.exec(q).all())
    return [_comment_to_dict(session, c, include_ip=True, fetch_replies=True) for c in rows]


def create_comment(
    session: Session,
    data: CommentCreate,
    github_user: GitHubUser | None = None,
    ip: str = "",
) -> dict:
    if not github_user:
        raise HTTPException(401, "请先登录 GitHub")

    if data.parent_id:
        parent = session.get(Comment, data.parent_id)
        if not parent:
            raise HTTPException(404, "被回复的评论不存在")

    comment = Comment(
        post_id=data.post_id,
        parent_id=data.parent_id,
        github_user_id=github_user.id,
        content=data.content,
        ip=ip,
    )
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return _comment_to_dict(session, comment)


def update_comment_status(session: Session, comment_id: int, status: str) -> dict:
    comment = session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")
    comment.status = status
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return _comment_to_dict(session, comment)


def toggle_comment_like(session: Session, comment_id: int, unlike: bool = False) -> dict:
    c = session.get(Comment, comment_id)
    if not c:
        raise HTTPException(404, "评论不存在")
    c.likes = max(0, c.likes + (-1 if unlike else 1))
    session.add(c)
    session.commit()
    session.refresh(c)
    return _comment_to_dict(session, c)


def delete_comment(session: Session, comment_id: int):
    comment = session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")
    session.delete(comment)
    session.commit()
