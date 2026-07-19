import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
DOTENV_DISABLED = os.getenv("PYTHON_DOTENV_DISABLED", "").lower() in {
    "1",
    "true",
    "yes",
    "on",
}
if not DOTENV_DISABLED:
    load_dotenv(BASE_DIR / ".env", override=True)

DATABASE_URL = os.environ["DATABASE_URL"]
SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 72
AUTO_CREATE_TABLES = os.getenv("AUTO_CREATE_TABLES", "false").lower() in {
    "1",
    "true",
    "yes",
    "on",
}

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,https://boke.hiromu.top").split(",")

# GitHub OAuth
GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "")

# 阿里云 OSS 配置
OSS_ACCESS_KEY_ID = os.getenv("OSS_ACCESS_KEY_ID", "")
OSS_ACCESS_KEY_SECRET = os.getenv("OSS_ACCESS_KEY_SECRET", "")
OSS_BUCKET_NAME = os.getenv("OSS_BUCKET_NAME", "")
OSS_ENDPOINT = os.getenv("OSS_ENDPOINT", "")
OSS_CUSTOM_DOMAIN = os.getenv("OSS_CUSTOM_DOMAIN", "")
OSS_PREFIX = os.getenv("OSS_PREFIX", "")
