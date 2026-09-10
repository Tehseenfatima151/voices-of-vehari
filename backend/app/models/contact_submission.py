from datetime import datetime
from app.extensions import db

class ContactSubmission(db.Model):
    __tablename__ = 'contact_submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    intent = db.Column(db.String(100), default='General') # Suggest a guest, Share a story, Suggest a topic, Collaborate, Participate, Ask a question
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='unread') # unread, read, replied, archived
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'intent': self.intent,
            'message': self.message,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
