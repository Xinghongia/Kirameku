"""汇总所有 API 子路由，main.py 只需 include_router(api_router) 即可"""

from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.github_auth import router as github_auth_router
from app.api.posts import router as posts_router
from app.api.categories import router as categories_router
from app.api.tags import router as tags_router
from app.api.comments import router as comments_router
from app.api.messages import router as messages_router
from app.api.chatters import router as chatters_router
from app.api.albums import router as albums_router
from app.api.projects import router as projects_router
from app.api.friend_links import router as friend_links_router
from app.api.site_config import router as site_config_router
from app.api.upload import router as upload_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(github_auth_router)
api_router.include_router(posts_router)
api_router.include_router(categories_router)
api_router.include_router(tags_router)
api_router.include_router(comments_router)
api_router.include_router(messages_router)
api_router.include_router(chatters_router)
api_router.include_router(albums_router)
api_router.include_router(projects_router)
api_router.include_router(friend_links_router)
api_router.include_router(site_config_router)
api_router.include_router(upload_router)
