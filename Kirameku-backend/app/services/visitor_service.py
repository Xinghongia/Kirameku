import re
from datetime import datetime
from typing import Optional
from sqlmodel import Session, select, col
from app.models.visitor import Visitor

# 内存缓存 IP 地理位置，避免重复请求
_geo_cache: dict[str, dict] = {}


def _parse_ua(ua: str) -> dict:
    """简单的 User-Agent 解析"""
    browser = "Unknown"
    if "Edg/" in ua:
        browser = "Edge"
    elif "Chrome/" in ua:
        browser = "Chrome"
    elif "Firefox/" in ua:
        browser = "Firefox"
    elif "Safari/" in ua:
        browser = "Safari"

    os = "Unknown"
    if "Win" in ua:
        os = "Windows"
    elif "Android" in ua:
        os = "Android"
    elif "iPhone" in ua or "iPad" in ua:
        os = "iOS"
    elif "Mac" in ua:
        os = "macOS"
    elif "Linux" in ua:
        os = "Linux"

    device = "手机" if any(k in ua for k in ("Mobi", "Android", "iPhone")) else "电脑"

    return {"browser": browser, "os": os, "device_type": device}


def _fetch_geo(ip: str) -> dict:
    """查询 IP 地理位置（带内存缓存）"""
    if ip in _geo_cache:
        return _geo_cache[ip]

    # 跳过本地和内网 IP
    if ip in ("127.0.0.1", "::1", "") or ip.startswith("192.168.") or ip.startswith("10."):
        return {}

    result = {}

    # uapis.cn（国内 API，IPv4/IPv6 支持好，返回中文）
    try:
        import httpx
        resp = httpx.get(
            "https://uapis.cn/api/v1/network/ipinfo",
            params={"ip": ip},
            timeout=5,
        )
        data = resp.json()
        if data.get("ip"):
            # region 格式："国家 省份 城市" 或 "国家"
            parts = data.get("region", "").split()
            result = {
                "country": parts[0] if len(parts) >= 1 else "",
                "region": parts[1] if len(parts) >= 2 else "",
                "city": parts[2] if len(parts) >= 3 else "",
                "org": data.get("isp", ""),
            }
    except Exception:
        pass

    # 回退：ip-api.com（仅 IPv4）
    if not result and ":" not in ip:
        try:
            import httpx
            resp = httpx.get(
                f"http://ip-api.com/json/{ip}?lang=zh-CN&fields=status,country,regionName,city,isp,org",
                timeout=3,
            )
            data = resp.json()
            if data.get("status") == "success":
                result = {
                    "city": data.get("city", ""),
                    "region": data.get("regionName", ""),
                    "country": data.get("country", ""),
                    "org": data.get("org", "") or data.get("isp", ""),
                }
        except Exception:
            pass

    if result:
        _geo_cache[ip] = result
    return result


def record_visit(
    session: Session,
    ip: str,
    path: str = "",
    user_agent: str = "",
):
    """记录一次访问"""
    ua_info = _parse_ua(user_agent)
    geo_info = _fetch_geo(ip)

    visitor = Visitor(
        ip=ip,
        path=path,
        user_agent=user_agent,
        city=geo_info.get("city", ""),
        region=geo_info.get("region", ""),
        country=geo_info.get("country", ""),
        org=geo_info.get("org", ""),
        browser=ua_info["browser"],
        os=ua_info["os"],
        device_type=ua_info["device_type"],
    )
    session.add(visitor)
    session.commit()
    return visitor


def get_recent_visitors(
    session: Session,
    page: int = 1,
    size: int = 20,
) -> list[dict]:
    """获取最近访客列表"""
    q = (
        select(Visitor)
        .order_by(col(Visitor.created_at).desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    rows = list(session.exec(q).all())
    return [
        {
            "id": v.id,
            "ip": v.ip,
            "path": v.path,
            "city": v.city,
            "region": v.region,
            "country": v.country,
            "org": v.org,
            "browser": v.browser,
            "os": v.os,
            "device_type": v.device_type,
            "created_at": v.created_at.isoformat() if v.created_at else "",
        }
        for v in rows
    ]


def get_visitor_count(session: Session) -> int:
    """获取总访客数"""
    return len(list(session.exec(select(Visitor)).all()))


def delete_visitor(session: Session, visitor_id: int):
    """删除单条访客记录"""
    visitor = session.get(Visitor, visitor_id)
    if visitor:
        session.delete(visitor)
        session.commit()


def clear_visitors(session: Session):
    """清空所有访客记录"""
    from sqlmodel import delete
    session.exec(delete(Visitor)) # type: ignore
    session.commit()
