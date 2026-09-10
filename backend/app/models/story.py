from datetime import datetime
from app.extensions import db

class Story(db.Model):
    __tablename__ = 'stories'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    category_tag = db.Column(db.String(100), default='Folklore') # Folklore, Customs, Rural life, History, Food, Youth
    excerpt = db.Column(db.Text, nullable=False)
    content = db.Column(db.Text, nullable=True) # Full story if available
    author = db.Column(db.String(120), default='Community Contributor')
    image_url = db.Column(db.String(500), nullable=True)
    sort_order = db.Column(db.Integer, default=0)
    is_published = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'category_tag': self.category_tag,
            'excerpt': self.excerpt,
            'content': self.content,
            'author': self.author,
            'image_url': self.image_url,
            'sort_order': self.sort_order,
            'is_published': self.is_published,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
