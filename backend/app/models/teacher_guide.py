from datetime import datetime
import json
from app.extensions import db

class TeacherGuideArticle(db.Model):
    __tablename__ = 'teacher_guide_articles'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    category = db.Column(db.String(100), default='Lesson Ideas')  # Lesson Ideas, Speaking, Writing, Reading, Vocabulary, Student Engagement
    short_description = db.Column(db.Text, nullable=False)
    content = db.Column(db.Text, nullable=True)
    materials_json = db.Column(db.Text, nullable=True)  # JSON list of materials
    steps_json = db.Column(db.Text, nullable=True)      # JSON list of steps
    image_url = db.Column(db.String(500), nullable=True)
    level = db.Column(db.String(100), default='Intermediate')
    estimated_time = db.Column(db.String(100), default='30–45 minutes')
    author = db.Column(db.String(120), default='Voices of Vehari Team')
    display_order = db.Column(db.Integer, default=0)
    is_published = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_materials(self):
        if self.materials_json:
            try:
                return json.loads(self.materials_json)
            except Exception:
                return []
        return []

    def set_materials(self, materials_list):
        if materials_list:
            self.materials_json = json.dumps(materials_list)
        else:
            self.materials_json = json.dumps([])

    def get_steps(self):
        if self.steps_json:
            try:
                return json.loads(self.steps_json)
            except Exception:
                return []
        return []

    def set_steps(self, steps_list):
        if steps_list:
            self.steps_json = json.dumps(steps_list)
        else:
            self.steps_json = json.dumps([])

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'category': self.category,
            'short_description': self.short_description,
            'excerpt': self.short_description,  # compatibility alias
            'content': self.content,
            'materials': self.get_materials(),
            'steps': self.get_steps(),
            'image_url': self.image_url,
            'level': self.level,
            'estimated_time': self.estimated_time,
            'time': self.estimated_time,        # compatibility alias
            'author': self.author,
            'display_order': self.display_order,
            'is_published': self.is_published,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'details': {
                'objective': self.content or self.short_description,
                'materials': self.get_materials(),
                'steps': self.get_steps()
            }
        }


class TeacherGuideActivity(db.Model):
    __tablename__ = 'teacher_guide_activities'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    purpose = db.Column(db.Text, nullable=False)
    objectives_json = db.Column(db.Text, nullable=False)  # JSON list
    steps_json = db.Column(db.Text, nullable=False)       # JSON list
    teacher_tip = db.Column(db.Text, nullable=True)
    estimated_time = db.Column(db.String(100), default='35 minutes')
    level = db.Column(db.String(100), default='Intermediate')
    image_url = db.Column(db.String(500), nullable=True)
    is_published = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_objectives(self):
        if self.objectives_json:
            try:
                return json.loads(self.objectives_json)
            except Exception:
                return []
        return []

    def set_objectives(self, obj_list):
        if obj_list:
            self.objectives_json = json.dumps(obj_list)
        else:
            self.objectives_json = json.dumps([])

    def get_steps(self):
        if self.steps_json:
            try:
                return json.loads(self.steps_json)
            except Exception:
                return []
        return []

    def set_steps(self, steps_list):
        if steps_list:
            self.steps_json = json.dumps(steps_list)
        else:
            self.steps_json = json.dumps([])

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'purpose': self.purpose,
            'objectives': self.get_objectives(),
            'steps': self.get_steps(),
            'teacher_tip': self.teacher_tip,
            'teacherTip': self.teacher_tip,     # compatibility alias
            'estimated_time': self.estimated_time,
            'time': self.estimated_time,        # compatibility alias
            'level': self.level,
            'image_url': self.image_url,
            'is_published': self.is_published,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class TeacherGuideStrategy(db.Model):
    __tablename__ = 'teacher_guide_strategies'
    
    id = db.Column(db.Integer, primary_key=True)
    strategy_number = db.Column(db.String(20), default='01')
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(50), default='💡')
    display_order = db.Column(db.Integer, default=0)
    is_published = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'num': self.strategy_number,
            'strategy_number': self.strategy_number,
            'title': self.title,
            'description': self.description,
            'icon': self.icon,
            'display_order': self.display_order,
            'is_published': self.is_published,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class TeacherGuidePrompt(db.Model):
    __tablename__ = 'teacher_guide_prompts'
    
    id = db.Column(db.Integer, primary_key=True)
    prompt = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), default='General')
    display_order = db.Column(db.Integer, default=0)
    is_published = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'prompt': self.prompt,
            'category': self.category,
            'display_order': self.display_order,
            'is_published': self.is_published,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class TeacherGuideLessonPlan(db.Model):
    __tablename__ = 'teacher_guide_lesson_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), default='Simple Lesson Plan Template')
    description = db.Column(db.Text, default='A practical, culturally-responsive lesson structure for classroom English teachers.')
    topic = db.Column(db.String(255), default='e.g. Local Harvests & Markets in Vehari')
    learning_objective = db.Column(db.Text, default='e.g. By the end of class, students will be able to describe a market scene using 5 new sensory adjectives.')
    english_skills = db.Column(db.String(255), default='Speaking, Vocabulary, Listening, Reading')
    vocabulary = db.Column(db.Text, default='e.g. stall, vendor, barter, fresh, bustling, fragrant')
    warmup_activity = db.Column(db.Text, default='5-minute photo prompt & partner brainstorming of familiar local places')
    main_activity = db.Column(db.Text, default='Contextual reading or listening from Voices of Vehari story archive')
    pair_group_activity = db.Column(db.Text, default='Role-play interview between local vendor and customer in English')
    assessment = db.Column(db.Text, default='Formative observation of peer interaction and 2-minute oral presentation')
    homework = db.Column(db.Text, default='Write a 4-sentence reflection on their favorite family custom in English')
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'topic': self.topic,
            'learning_objective': self.learning_objective,
            'english_skills': self.english_skills,
            'vocabulary': self.vocabulary,
            'warmup_activity': self.warmup_activity,
            'main_activity': self.main_activity,
            'pair_group_activity': self.pair_group_activity,
            'assessment': self.assessment,
            'homework': self.homework,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'fields': [
                { 'label': 'Topic', 'placeholder': self.topic },
                { 'label': 'Learning Objective', 'placeholder': self.learning_objective },
                { 'label': 'English Skills', 'placeholder': self.english_skills },
                { 'label': 'Vocabulary', 'placeholder': self.vocabulary },
                { 'label': 'Warm-up Activity', 'placeholder': self.warmup_activity },
                { 'label': 'Main Activity', 'placeholder': self.main_activity },
                { 'label': 'Pair/Group Activity', 'placeholder': self.pair_group_activity },
                { 'label': 'Assessment', 'placeholder': self.assessment },
                { 'label': 'Homework / Follow-up', 'placeholder': self.homework },
            ]
        }
