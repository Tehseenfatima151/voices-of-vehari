from datetime import datetime
import json
from app.extensions import db

class TimelineItem(db.Model):
    __tablename__ = 'timeline_items'
    
    id = db.Column(db.Integer, primary_key=True)
    phase_number = db.Column(db.Integer, nullable=False) # 1, 2, 3
    duration = db.Column(db.String(100), nullable=False) # "Months 1–3"
    title = db.Column(db.String(255), nullable=False) # "Getting Ready"
    paragraphs_json = db.Column(db.Text, nullable=False) # JSON list of strings/paragraphs
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_paragraphs(self):
        if self.paragraphs_json:
            try:
                return json.loads(self.paragraphs_json)
            except:
                return []
        return []

    def set_paragraphs(self, p_list):
        if p_list:
            self.paragraphs_json = json.dumps(p_list)
        else:
            self.paragraphs_json = json.dumps([])

    def to_dict(self):
        return {
            'id': self.id,
            'phase_number': self.phase_number,
            'duration': self.duration,
            'title': self.title,
            'paragraphs': self.get_paragraphs(),
            'sort_order': self.sort_order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
