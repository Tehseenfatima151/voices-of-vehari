from datetime import datetime
from app.extensions import db

class GalleryItem(db.Model):
    __tablename__ = 'gallery_items'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), default='Project Photo')
    caption = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), default='general')
    image_url = db.Column(db.String(500), nullable=False)
    alt_text = db.Column(db.String(255), default='Voices of Vehari project visual')
    sort_order = db.Column(db.Integer, default=0)
    is_published = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'caption': self.caption,
            'category': self.category,
            'image_url': self.image_url,
            'alt_text': self.alt_text,
            'sort_order': self.sort_order,
            'is_published': self.is_published,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
