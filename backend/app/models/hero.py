from datetime import datetime
from app.extensions import db

class HeroSection(db.Model):
    __tablename__ = 'hero_sections'
    
    id = db.Column(db.Integer, primary_key=True)
    kicker = db.Column(db.String(255), default='A research & community storytelling initiative')
    title = db.Column(db.String(255), default='Voices of Vehari')
    lead_strong = db.Column(db.Text, default='Enhancing English Proficiency through Multilingual Podcasting and Cultural Storytelling.')
    lead_body = db.Column(db.Text, default='A context-based learning project that brings English, local languages, community voices and the cultural heritage of Vehari together through simple, accessible podcasts and stories.')
    primary_btn_text = db.Column(db.String(100), default='Explore Podcasts')
    primary_btn_url = db.Column(db.String(255), default='#podcasts')
    secondary_btn_text = db.Column(db.String(100), default='Start Learning')
    secondary_btn_url = db.Column(db.String(255), default='#learning')
    hero_image_url = db.Column(db.String(255), default='/api/uploads/hero_art.jpeg')
    hero_image_alt = db.Column(db.String(255), default='Illustration of young people creating podcasts and sharing stories')
    logo_float_url = db.Column(db.String(255), default='/api/uploads/voices_logo.png')
    is_active = db.Column(db.Boolean, default=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'kicker': self.kicker,
            'title': self.title,
            'lead_strong': self.lead_strong,
            'lead_body': self.lead_body,
            'primary_btn_text': self.primary_btn_text,
            'primary_btn_url': self.primary_btn_url,
            'secondary_btn_text': self.secondary_btn_text,
            'secondary_btn_url': self.secondary_btn_url,
            'hero_image_url': self.hero_image_url,
            'hero_image_alt': self.hero_image_alt,
            'logo_float_url': self.logo_float_url,
            'is_active': self.is_active,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
