from datetime import datetime
import json
from app.extensions import db

class Podcast(db.Model):
    __tablename__ = 'podcasts'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    guest = db.Column(db.String(255), nullable=True)
    host = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), default='general') # education, culture, food, etc.
    tags_json = db.Column(db.Text, nullable=True) # JSON array e.g. ["Urdu", "Education"]
    audio_url = db.Column(db.String(500), nullable=True)
    cover_image_url = db.Column(db.String(500), nullable=True)
    transcript_url = db.Column(db.String(255), default='#transcript')
    learning_url = db.Column(db.String(255), default='learning.html')
    sort_order = db.Column(db.Integer, default=0)
    is_published = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_tags(self):
        if self.tags_json:
            try:
                return json.loads(self.tags_json)
            except:
                return []
        return []

    def set_tags(self, tags_list):
        if tags_list:
            self.tags_json = json.dumps(tags_list)
        else:
            self.tags_json = None

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'guest': self.guest,
            'host': self.host,
            'description': self.description,
            'category': self.category,
            'tags': self.get_tags(),
            'audio_url': self.audio_url,
            'cover_image_url': self.cover_image_url,
            'transcript_url': self.transcript_url,
            'learning_url': self.learning_url,
            'sort_order': self.sort_order,
            'is_published': self.is_published,
            'is_featured': self.is_featured,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
