from datetime import datetime
from app.extensions import db

class SiteSettings(db.Model):
    __tablename__ = 'site_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    site_name = db.Column(db.String(150), default='Voices of Vehari')
    tagline = db.Column(db.String(255), default='Enhancing English Proficiency through Multilingual Podcasting and Cultural Storytelling.')
    campus = db.Column(db.String(255), default='COMSATS University Islamabad, Vehari Campus')
    address = db.Column(db.Text, default='Mailsi Road, Off Multan Road, Peer Murad, Vehari, Punjab, Pakistan')
    contact_email = db.Column(db.String(120), default='info@voicesofvehari.edu.pk')
    contact_phone = db.Column(db.String(50), default='+92 (0) 67 3602803')
    pi_name = db.Column(db.String(120), default='Dr. Muhammad Imran Saeed')
    copi_name = db.Column(db.String(120), default='Nazish Malik')
    logo_url = db.Column(db.String(255), default='/api/uploads/voices_logo.png')
    footer_text = db.Column(db.Text, default='Enhancing English Proficiency through Multilingual Podcasting and Cultural Storytelling.')
    footer_copyright = db.Column(db.String(255), default='Voices of Vehari · COMSATS University Islamabad, Vehari Campus')
    meta_title = db.Column(db.String(150), default='Voices of Vehari | Multilingual Podcasting & Cultural Storytelling')
    meta_description = db.Column(db.Text, default='A research & community storytelling initiative connecting English language development with local languages, stories and lived experiences of Vehari.')
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'site_name': self.site_name,
            'tagline': self.tagline,
            'campus': self.campus,
            'address': self.address,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'pi_name': self.pi_name,
            'copi_name': self.copi_name,
            'logo_url': self.logo_url,
            'footer_text': self.footer_text,
            'footer_copyright': self.footer_copyright,
            'meta_title': self.meta_title,
            'meta_description': self.meta_description,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
