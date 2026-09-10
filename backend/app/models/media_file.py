from datetime import datetime
from app.extensions import db

class MediaFile(db.Model):
    __tablename__ = 'media_files'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False) # 'image', 'audio', 'document'
    mime_type = db.Column(db.String(100), nullable=True)
    file_size = db.Column(db.Integer, default=0) # bytes
    file_path = db.Column(db.String(500), nullable=False)
    public_url = db.Column(db.String(500), nullable=False)
    alt_text = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_name': self.original_name,
            'file_type': self.file_type,
            'mime_type': self.mime_type,
            'file_size': self.file_size,
            'public_url': self.public_url,
            'alt_text': self.alt_text,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
