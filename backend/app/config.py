import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def _get_int(key, default):
    val = os.environ.get(key, "").strip()
    if not val:
        return default
    try:
        return int(val)
    except ValueError:
        return default

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "voices-of-vehari-secret-key-prod-2026")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-super-secret-key-vehari-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=_get_int("JWT_EXPIRES_HOURS", 24))
    
    # Database: Supports PostgreSQL (e.g. postgresql://...) or SQLite fallback
    _raw_db_url = os.environ.get("DATABASE_URL", "").strip()
    if not _raw_db_url:
        if os.environ.get("VERCEL"):
            SQLALCHEMY_DATABASE_URI = "sqlite:////tmp/voices_of_vehari.db"
        else:
            db_path = os.path.join(BASE_DIR, "voices_of_vehari.db")
            SQLALCHEMY_DATABASE_URI = f"sqlite:///{db_path}"
    else:
        if _raw_db_url.startswith("postgres://"):
            _raw_db_url = _raw_db_url.replace("postgres://", "postgresql://", 1)
        # Ensure SSL mode for Supabase / Neon cloud connections
        if any(h in _raw_db_url for h in ("supabase.co", "supabase.com", "neon.tech", "render.com", "railway.app")):
            if "sslmode" not in _raw_db_url:
                sep = "&" if "?" in _raw_db_url else "?"
                _raw_db_url = f"{_raw_db_url}{sep}sslmode=require"
        SQLALCHEMY_DATABASE_URI = _raw_db_url
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
    
    # Uploads
    if os.environ.get("VERCEL"):
        UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "/tmp/uploads")
    else:
        UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))
    MAX_CONTENT_LENGTH = 30 * 1024 * 1024  # 30 MB max upload
    ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif", "svg"}
    ALLOWED_AUDIO_EXTENSIONS = {"mp3", "wav", "ogg", "m4a"}
    
    # CORS
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")