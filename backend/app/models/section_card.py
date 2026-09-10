from datetime import datetime
import json
from app.extensions import db

class SectionCard(db.Model):
    __tablename__ = 'section_cards'
    
    id = db.Column(db.Integer, primary_key=True)
    # section_group: 'home_idea', 'about_challenge', 'research_objective', 'learning_resource', 'gallery_theme', 'outcome_item', 'news_event'
    section_group = db.Column(db.String(80), nullable=False, index=True)
    icon = db.Column(db.String(50), nullable=True)
    tag = db.Column(db.String(80), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    bullets_json = db.Column(db.Text, nullable=True) # JSON list of strings
    link_url = db.Column(db.String(255), nullable=True)
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_bullets(self):
        if self.bullets_json:
            try:
                return json.loads(self.bullets_json)
            except:
                return []
        return []

    def set_bullets(self, bullets_list):
        if bullets_list:
            self.bullets_json = json.dumps(bullets_list)
        else:
            self.bullets_json = None

    def to_dict(self):
        return {
            'id': self.id,
            'section_group': self.section_group,
            'icon': self.icon,
            'tag': self.tag,
            'title': self.title,
            'description': self.description,
            'bullets': self.get_bullets(),
            'link_url': self.link_url,
            'sort_order': self.sort_order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
