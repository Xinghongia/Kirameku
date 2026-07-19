"""仪表盘数据接口"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func, col
from app.database import get_session
from app.deps import get_current_user
from app.models import Post, Category, Tag, Comment, Message, Visitor

router = APIRouter(prefix="/api/dashboard", tags=["仪表盘"])


@router.get("/stats")
def get_dashboard_stats(
    _: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    now = datetime.now()
    thirty_days_ago = now - timedelta(days=30)

    # ── 总数统计 ──
    post_count = session.exec(
        select(func.count()).where(Post.status == "published")
    ).one()
    draft_count = session.exec(
        select(func.count()).where(Post.status == "draft")
    ).one()
    category_count = session.exec(select(func.count(Category.id))).one()
    tag_count = session.exec(select(func.count(Tag.id))).one()
    comment_count = session.exec(select(func.count(Comment.id))).one()
    message_count = session.exec(select(func.count(Message.id))).one()
    visitor_count = session.exec(select(func.count(Visitor.id))).one()

    # ── 文章发布趋势（近 30 天） ──
    post_rows = session.exec(
        select(
            func.date(Post.published_at).label("date"),
            func.count().label("count"),
        )
        .where(col(Post.published_at) >= thirty_days_ago)
        .where(Post.status == "published")
        .group_by(func.date(Post.published_at))
        .order_by(func.date(Post.published_at))
    ).all()

    # ── 访客趋势（近 30 天） ──
    visitor_rows = session.exec(
        select(
            func.date(Visitor.created_at).label("date"),
            func.count().label("count"),
        )
        .where(col(Visitor.created_at) >= thirty_days_ago)
        .group_by(func.date(Visitor.created_at))
        .order_by(func.date(Visitor.created_at))
    ).all()

    # ── 分类分布 ──
    categories = session.exec(
        select(Category.name, Category.post_count).where(Category.post_count > 0)
    ).all()

    # ── 浏览器分布 ──
    browser_rows = session.exec(
        select(
            Visitor.browser,
            func.count().label("count"),
        )
        .group_by(Visitor.browser)
        .order_by(func.count().desc())
    ).all()

    # ── 补全 30 天空缺日期 ──
    def fill_trend(rows):
        row_map = {str(r[0]): r[1] for r in rows}
        result = []
        for i in range(30):
            d = (thirty_days_ago + timedelta(days=i)).strftime("%Y-%m-%d")
            result.append({"date": d, "count": row_map.get(d, 0)})
        return result

    return {
        "counts": {
            "posts": post_count,
            "drafts": draft_count,
            "categories": category_count,
            "tags": tag_count,
            "comments": comment_count,
            "messages": message_count,
            "visitors": visitor_count,
        },
        "post_trend": fill_trend(post_rows),
        "visitor_trend": fill_trend(visitor_rows),
        "category_distribution": [
            {"name": r[0], "value": r[1]} for r in categories
        ],
        "browser_distribution": [
            {"name": r[0] or "未知", "value": r[1]} for r in browser_rows
        ],
    }
