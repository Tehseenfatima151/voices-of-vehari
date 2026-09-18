from datetime import datetime
from app.extensions import db


class VocabularyWord(db.Model):
    __tablename__ = 'vocabulary_words'

    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(200), nullable=False)
    part_of_speech = db.Column(db.String(100), default='noun')  # noun, verb, adjective, adverb, phrase
    meaning = db.Column(db.Text, nullable=False)
    example_sentence = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), default='General')  # Education, Community, Culture, Nature, Daily Life, Academic, Communication
    level = db.Column(db.String(50), default='Intermediate')  # Beginner, Intermediate, Advanced
    display_order = db.Column(db.Integer, default=0)
    is_published = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'word': self.word,
            'part_of_speech': self.part_of_speech,
            'meaning': self.meaning,
            'example_sentence': self.example_sentence,
            'category': self.category,
            'level': self.level,
            'display_order': self.display_order,
            'is_published': self.is_published,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
