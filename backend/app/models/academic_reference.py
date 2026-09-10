from datetime import datetime
from app.extensions import db

class AcademicReference(db.Model):
    __tablename__ = 'academic_references'
    
    id = db.Column(db.Integer, primary_key=True)
    author = db.Column(db.String(255), nullable=False)
    contribution = db.Column(db.Text, nullable=False)
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'author': self.author,
            'contribution': self.contribution,
            'sort_order': self.sort_order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
