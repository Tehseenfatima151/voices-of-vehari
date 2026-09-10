from datetime import datetime
from app.extensions import db

class Statistic(db.Model):
    __tablename__ = 'statistics'
    
    id = db.Column(db.Integer, primary_key=True)
    value = db.Column(db.String(50), nullable=False)
    label = db.Column(db.String(255), nullable=False)
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'value': self.value,
            'label': self.label,
            'sort_order': self.sort_order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
