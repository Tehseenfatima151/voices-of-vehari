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
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    if not SQLALCHEMY_DATABASE_URI:
        if os.environ.get("VERCEL"):
            SQLALCHEMY_DATABASE_URI = "sqlite:////tmp/voices_of_vehari.db"
        else:
            db_path = os.path.join(BASE_DIR, "voices_of_vehari.db")
            SQLALCHEMY_DATABASE_URI = f"sqlite:///{db_path}"
    elif SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        # Fix for Heroku/Render legacy postgres:// URI
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
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