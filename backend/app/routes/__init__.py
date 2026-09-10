from app.routes.auth import auth_bp
from app.routes.public import public_bp
from app.routes.admin_cms import admin_cms_bp
from app.routes.upload import upload_bp

__all__ = ['auth_bp', 'public_bp', 'admin_cms_bp', 'upload_bp']
