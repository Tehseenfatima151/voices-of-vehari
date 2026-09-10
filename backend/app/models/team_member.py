from datetime import datetime
from app.extensions import db

class TeamMember(db.Model):
    __tablename__ = 'team_members'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    role_category = db.Column(db.String(80), nullable=False) # leadership, mentor, student, contributor
    designation = db.Column(db.String(255), nullable=False)
    initials = db.Column(db.String(10), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'role_category': self.role_category,
            'designation': self.designation,
            'initials': self.initials or ''.join([p[0].upper() for p in self.name.split() if p][:2]),
            'image_url': self.image_url,
            'bio': self.bio,
            'sort_order': self.sort_order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
