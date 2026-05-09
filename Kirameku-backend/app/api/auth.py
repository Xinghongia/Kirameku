from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.deps import get_session
from app.models import User
from app.schemas import LoginRequest
from app.config import ACCESS_TOKEN_EXPIRE_HOURS
from app.deps import get_current_user
from app.utils.auth import verify_password, create_token, hash_password

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/login")
def login(req: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == req.username)).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = create_token({"sub": user.username, "admin": user.is_admin})
    expires = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)

    return {
        "code": 0,
        "message": "success",
        "data": {
            "accessToken": token,
            "refreshToken": "",
            "expires": expires.isoformat(),
            "avatar": user.avatar or "",
            "username": user.username,
            "nickname": user.nickname or user.username,
            "roles": ["admin"] if user.is_admin else [],
            "permissions": ["*:*:*"] if user.is_admin else [],
        },
    }


@router.get("/me")
def me(user: dict = Depends(get_current_user), session: Session = Depends(get_session)):
    username = user.get("sub")
    db_user = session.exec(select(User).where(User.username == username)).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {
        "code": 0,
        "message": "success",
        "data": {
            "avatar": db_user.avatar or "",
            "username": db_user.username,
            "nickname": db_user.nickname or db_user.username,
            "email": db_user.email or "",
            "description": db_user.bio or "",
            "phone": "",
            "roles": ["admin"] if db_user.is_admin else [],
            "permissions": ["*:*:*"] if db_user.is_admin else [],
        },
    }
