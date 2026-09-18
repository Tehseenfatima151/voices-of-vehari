import os
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from app.extensions import db
from app.models import (
    SiteSettings, HeroSection, SectionCard, Statistic,
    Podcast, Story, GalleryItem, TeamMember,
    TimelineItem, AcademicReference, ContactSubmission,
    TeacherGuideArticle, TeacherGuideActivity, TeacherGuideStrategy,
    TeacherGuidePrompt, TeacherGuideLessonPlan, VocabularyWord
)

public_bp = Blueprint('public', __name__, url_prefix='/api')

@public_bp.route('/public/all', methods=['GET'])
def get_all_public_content():
    """Aggregated endpoint returning all active content for the 13 views of the public website."""
    settings = SiteSettings.query.first()
    hero = HeroSection.query.filter_by(is_active=True).first()
    
    # Section cards
    cards = SectionCard.query.filter_by(is_active=True).order_by(SectionCard.sort_order.asc()).all()
    cards_by_group = {}
    for c in cards:
        cards_by_group.setdefault(c.section_group, []).append(c.to_dict())

    # Statistics
    stats = Statistic.query.filter_by(is_active=True).order_by(Statistic.sort_order.asc()).all()
    
    # Podcasts (active/published)
    podcasts = Podcast.query.filter_by(is_published=True).order_by(Podcast.sort_order.asc(), Podcast.created_at.desc()).all()
    
    # Stories (published)
    stories = Story.query.filter_by(is_published=True).order_by(Story.sort_order.asc(), Story.created_at.desc()).all()
    
    # Gallery
    gallery = GalleryItem.query.filter_by(is_published=True).order_by(GalleryItem.sort_order.asc(), GalleryItem.created_at.desc()).all()
    
    # Team
    team = TeamMember.query.filter_by(is_active=True).order_by(TeamMember.sort_order.asc()).all()
    team_by_role = {}
    for member in team:
        team_by_role.setdefault(member.role_category, []).append(member.to_dict())

    # Methodology Timeline
    timeline = TimelineItem.query.filter_by(is_active=True).order_by(TimelineItem.phase_number.asc(), TimelineItem.sort_order.asc()).all()

    # Academic References
    references = AcademicReference.query.filter_by(is_active=True).order_by(AcademicReference.sort_order.asc()).all()

    # Teacher Guide Dynamic Data
    tg_articles = TeacherGuideArticle.query.filter_by(is_published=True).order_by(TeacherGuideArticle.display_order.asc()).all()
    tg_activity = TeacherGuideActivity.query.filter_by(is_published=True).order_by(TeacherGuideActivity.id.desc()).first()
    tg_strategies = TeacherGuideStrategy.query.filter_by(is_published=True).order_by(TeacherGuideStrategy.display_order.asc()).all()
    tg_prompts = TeacherGuidePrompt.query.filter_by(is_published=True).order_by(TeacherGuidePrompt.display_order.asc()).all()
    tg_lesson_plan = TeacherGuideLessonPlan.query.first()

    teacher_guide_payload = {
        'hero': {
            'heading': 'Teacher Guide',
            'subtitle': 'Practical resources and classroom ideas for teaching English through the voices, stories and experiences of Vehari.',
            'intro': 'The Teacher Guide provides practical classroom resources, activity ideas and teaching strategies that connect English learning with local culture, everyday experiences and student voices.',
            'primaryCta': 'Explore Teaching Resources',
            'secondaryCta': 'Browse Classroom Ideas',
        },
        'benefits': [
            { 'icon': '📖', 'title': 'Local Stories', 'description': 'Use familiar stories and community experiences as reading and discussion material.' },
            { 'icon': '🎙️', 'title': 'Speaking Practice', 'description': 'Turn local topics into pair and group speaking activities.' },
            { 'icon': '📚', 'title': 'Vocabulary Building', 'description': 'Teach useful English vocabulary through familiar places, people and traditions.' },
            { 'icon': '✍️', 'title': 'Writing Activities', 'description': 'Help students transform personal and local experiences into short English texts.' },
            { 'icon': '💡', 'title': 'Critical Thinking', 'description': 'Encourage students to compare, discuss and reflect on cultural experiences.' },
        ],
        'categories': ['All'] + [c for c in sorted(list(set(art.category for art in tg_articles if art.category))) if c != 'All'] if tg_articles else ['All', 'Lesson Ideas', 'Speaking', 'Writing', 'Reading', 'Vocabulary', 'Student Engagement'],
        'resources': [art.to_dict() for art in tg_articles],
        'featuredActivity': tg_activity.to_dict() if tg_activity else None,
        'strategies': [s.to_dict() for s in tg_strategies],
        'classroomPrompts': [p.prompt.strip('"\' \t\r\n') for p in tg_prompts],
        'promptsList': [p.to_dict() for p in tg_prompts],
        'lessonPlanTemplate': tg_lesson_plan.to_dict() if tg_lesson_plan else None,
        'tips': [
            'Keep instructions simple, sequential and clear.',
            'Give students silent preparation time before asking them to speak.',
            'Use familiar local examples to introduce difficult grammar concepts.',
            'Encourage students to learn from each other\'s real-life experiences.',
            'Correct important errors gently without interrupting fluency unnecessarily.',
            'Celebrate participation, bravery and effort rather than perfection.',
        ]
    }

    # Vocabulary Words
    vocab_words = VocabularyWord.query.filter_by(is_published=True).order_by(VocabularyWord.display_order.asc(), VocabularyWord.id.asc()).all()

    return jsonify({
        'success': True,
        'data': {
            'settings': settings.to_dict() if settings else {},
            'hero': hero.to_dict() if hero else {},
            'cards': cards_by_group,
            'statistics': [s.to_dict() for s in stats],
            'podcasts': [p.to_dict() for p in podcasts],
            'stories': [st.to_dict() for st in stories],
            'gallery': [g.to_dict() for g in gallery],
            'team': [t.to_dict() for t in team],
            'team_by_role': team_by_role,
            'timeline': [ti.to_dict() for ti in timeline],
            'references': [r.to_dict() for r in references],
            'teacherGuide': teacher_guide_payload,
            'vocabulary': [v.to_dict() for v in vocab_words],
        }
    }), 200

@public_bp.route('/public/teacher-guide', methods=['GET'])
def get_teacher_guide_public():
    """Standalone endpoint for teacher guide resources."""
    category = request.args.get('category')
    search = request.args.get('search')
    
    query = TeacherGuideArticle.query.filter_by(is_published=True)
    if category and category.lower() != 'all':
        query = query.filter(TeacherGuideArticle.category.ilike(category))
    if search:
        query = query.filter(
            (TeacherGuideArticle.title.ilike(f'%{search}%')) |
            (TeacherGuideArticle.short_description.ilike(f'%{search}%'))
        )
    articles = query.order_by(TeacherGuideArticle.display_order.asc()).all()

    activity = TeacherGuideActivity.query.filter_by(is_published=True).order_by(TeacherGuideActivity.id.desc()).first()
    strategies = TeacherGuideStrategy.query.filter_by(is_published=True).order_by(TeacherGuideStrategy.display_order.asc()).all()
    prompts = TeacherGuidePrompt.query.filter_by(is_published=True).order_by(TeacherGuidePrompt.display_order.asc()).all()
    lesson_plan = TeacherGuideLessonPlan.query.first()

    return jsonify({
        'success': True,
        'data': {
            'resources': [a.to_dict() for a in articles],
            'featuredActivity': activity.to_dict() if activity else None,
            'strategies': [s.to_dict() for s in strategies],
            'classroomPrompts': [p.prompt.strip('"\' \t\r\n') for p in prompts],
            'lessonPlanTemplate': lesson_plan.to_dict() if lesson_plan else None
        }
    }), 200

@public_bp.route('/public/podcasts', methods=['GET'])
def get_podcasts():
    category = request.args.get('category')
    search = request.args.get('search')
    query = Podcast.query.filter_by(is_published=True)

    if category and category.lower() != 'all':
        query = query.filter(Podcast.category.ilike(f"%{category}%"))
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Podcast.title.ilike(search_term)) |
            (Podcast.guest.ilike(search_term)) |
            (Podcast.description.ilike(search_term)) |
            (Podcast.tags_json.ilike(search_term))
        )

    podcasts = query.order_by(Podcast.sort_order.asc(), Podcast.created_at.desc()).all()
    return jsonify({
        'success': True,
        'data': [p.to_dict() for p in podcasts]
    }), 200

@public_bp.route('/public/stories', methods=['GET'])
def get_stories():
    stories = Story.query.filter_by(is_published=True).order_by(Story.sort_order.asc(), Story.created_at.desc()).all()
    return jsonify({
        'success': True,
        'data': [s.to_dict() for s in stories]
    }), 200

@public_bp.route('/public/gallery', methods=['GET'])
def get_gallery():
    items = GalleryItem.query.filter_by(is_published=True).order_by(GalleryItem.sort_order.asc()).all()
    return jsonify({
        'success': True,
        'data': [g.to_dict() for g in items]
    }), 200

@public_bp.route('/public/team', methods=['GET'])
def get_team():
    members = TeamMember.query.filter_by(is_active=True).order_by(TeamMember.sort_order.asc()).all()
    return jsonify({
        'success': True,
        'data': [m.to_dict() for m in members]
    }), 200

@public_bp.route('/public/contact', methods=['POST'])
def submit_contact():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    intent = (data.get('intent') or 'General').strip()
    message = (data.get('message') or '').strip()

    if not name or not email or not message:
        return jsonify({
            'success': False,
            'message': 'Name, email, and message are required fields'
        }), 400

    if '@' not in email or '.' not in email:
        return jsonify({
            'success': False,
            'message': 'Please provide a valid email address'
        }), 400

    submission = ContactSubmission(
        name=name,
        email=email,
        intent=intent,
        message=message
    )
    db.session.add(submission)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Thank you! Your message has been sent to the Voices of Vehari project team.'
    }), 201

@public_bp.route('/uploads/<path:filename>', methods=['GET'])
def serve_upload(filename):
    upload_dir = current_app.config['UPLOAD_FOLDER']
    if os.path.exists(os.path.join(upload_dir, filename)):
        return send_from_directory(upload_dir, filename)
    # Fallback to frontend assets directory if available
    frontend_assets = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'frontend', 'public', 'assets'))
    if os.path.exists(os.path.join(frontend_assets, filename)):
        return send_from_directory(frontend_assets, filename)
    return jsonify({'success': False, 'message': 'File not found'}), 404
