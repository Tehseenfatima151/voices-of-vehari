import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models import (
    SiteSettings, HeroSection, SectionCard, Statistic,
    Podcast, Story, GalleryItem, TeamMember,
    TimelineItem, AcademicReference, ContactSubmission, MediaFile,
    TeacherGuideArticle, TeacherGuideActivity, TeacherGuideStrategy,
    TeacherGuidePrompt, TeacherGuideLessonPlan
)

admin_cms_bp = Blueprint('admin_cms', __name__, url_prefix='/api/admin')

def slugify(text):
    text = re.sub(r'[^\w\s-]', '', text.lower())
    return re.sub(r'[-\s]+', '-', text).strip('-')

# ================= DASHBOARD STATS =================
@admin_cms_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def dashboard_stats():
    total_podcasts = Podcast.query.count()
    published_podcasts = Podcast.query.filter_by(is_published=True).count()
    total_stories = Story.query.count()
    published_stories = Story.query.filter_by(is_published=True).count()
    total_gallery = GalleryItem.query.count()
    total_team = TeamMember.query.count()
    total_cards = SectionCard.query.count()
    unread_messages = ContactSubmission.query.filter_by(status='unread').count()
    total_messages = ContactSubmission.query.count()
    total_media = MediaFile.query.count()

    recent_messages = [m.to_dict() for m in ContactSubmission.query.order_by(ContactSubmission.created_at.desc()).limit(5).all()]
    recent_podcasts = [p.to_dict() for p in Podcast.query.order_by(Podcast.updated_at.desc()).limit(5).all()]

    return jsonify({
        'success': True,
        'data': {
            'counts': {
                'podcasts': total_podcasts,
                'published_podcasts': published_podcasts,
                'stories': total_stories,
                'published_stories': published_stories,
                'gallery': total_gallery,
                'team': total_team,
                'cards': total_cards,
                'unread_messages': unread_messages,
                'total_messages': total_messages,
                'media': total_media
            },
            'recent_messages': recent_messages,
            'recent_podcasts': recent_podcasts
        }
    }), 200

# ================= SITE SETTINGS =================
@admin_cms_bp.route('/settings', methods=['GET'])
@jwt_required()
def get_settings():
    settings = SiteSettings.query.first()
    if not settings:
        settings = SiteSettings()
        db.session.add(settings)
        db.session.commit()
    return jsonify({'success': True, 'data': settings.to_dict()}), 200

@admin_cms_bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_settings():
    settings = SiteSettings.query.first()
    if not settings:
        settings = SiteSettings()
        db.session.add(settings)
    
    data = request.get_json() or {}
    for key in ['site_name', 'tagline', 'campus', 'address', 'contact_email',
                'contact_phone', 'pi_name', 'copi_name', 'logo_url',
                'footer_text', 'footer_copyright', 'meta_title', 'meta_description']:
        if key in data:
            setattr(settings, key, data[key])
            
    db.session.commit()
    return jsonify({'success': True, 'message': 'Site settings updated', 'data': settings.to_dict()}), 200

# ================= HERO SECTION =================
@admin_cms_bp.route('/hero', methods=['GET'])
@jwt_required()
def get_hero():
    hero = HeroSection.query.first()
    if not hero:
        hero = HeroSection()
        db.session.add(hero)
        db.session.commit()
    return jsonify({'success': True, 'data': hero.to_dict()}), 200

@admin_cms_bp.route('/hero', methods=['PUT'])
@jwt_required()
def update_hero():
    hero = HeroSection.query.first()
    if not hero:
        hero = HeroSection()
        db.session.add(hero)
    
    data = request.get_json() or {}
    for key in ['kicker', 'title', 'lead_strong', 'lead_body', 'primary_btn_text',
                'primary_btn_url', 'secondary_btn_text', 'secondary_btn_url',
                'hero_image_url', 'hero_image_alt', 'logo_float_url', 'is_active']:
        if key in data:
            setattr(hero, key, data[key])
            
    db.session.commit()
    return jsonify({'success': True, 'message': 'Hero section updated', 'data': hero.to_dict()}), 200

# ================= PODCASTS =================
@admin_cms_bp.route('/podcasts', methods=['GET'])
@jwt_required()
def list_podcasts():
    podcasts = Podcast.query.order_by(Podcast.sort_order.asc(), Podcast.created_at.desc()).all()
    return jsonify({'success': True, 'data': [p.to_dict() for p in podcasts]}), 200

@admin_cms_bp.route('/podcasts', methods=['POST'])
@jwt_required()
def create_podcast():
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    if not title:
        return jsonify({'success': False, 'message': 'Title is required'}), 400

    slug = data.get('slug') or slugify(title)
    # Ensure slug uniqueness
    count = 1
    base_slug = slug
    while Podcast.query.filter_by(slug=slug).first():
        slug = f"{base_slug}-{count}"
        count += 1

    podcast = Podcast(
        title=title,
        slug=slug,
        guest=data.get('guest'),
        host=data.get('host'),
        description=data.get('description', ''),
        category=data.get('category', 'general'),
        audio_url=data.get('audio_url'),
        video_url=data.get('video_url'),
        cover_image_url=data.get('cover_image_url'),
        transcript_url=data.get('transcript_url', '#transcript'),
        learning_url=data.get('learning_url', 'learning.html'),
        sort_order=int(data.get('sort_order', 0)),
        is_published=data.get('is_published', True),
        is_featured=data.get('is_featured', False)
    )
    if 'tags' in data:
        podcast.set_tags(data['tags'])

    db.session.add(podcast)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Podcast created', 'data': podcast.to_dict()}), 201

@admin_cms_bp.route('/podcasts/<int:id>', methods=['PUT'])
@jwt_required()
def update_podcast(id):
    podcast = db.session.get(Podcast, id)
    if not podcast:
        return jsonify({'success': False, 'message': 'Podcast not found'}), 404

    data = request.get_json() or {}
    for key in ['title', 'guest', 'host', 'description', 'category', 'audio_url', 'video_url',
                'cover_image_url', 'transcript_url', 'learning_url', 'sort_order',
                'is_published', 'is_featured']:
        if key in data:
            setattr(podcast, key, data[key])
            
    if 'tags' in data:
        podcast.set_tags(data['tags'])
    if 'slug' in data and data['slug']:
        podcast.slug = slugify(data['slug'])

    db.session.commit()
    return jsonify({'success': True, 'message': 'Podcast updated', 'data': podcast.to_dict()}), 200

@admin_cms_bp.route('/podcasts/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_podcast(id):
    podcast = db.session.get(Podcast, id)
    if not podcast:
        return jsonify({'success': False, 'message': 'Podcast not found'}), 404

    db.session.delete(podcast)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Podcast deleted'}), 200

@admin_cms_bp.route('/podcasts/<int:id>/toggle-publish', methods=['PATCH'])
@jwt_required()
def toggle_podcast_publish(id):
    podcast = db.session.get(Podcast, id)
    if not podcast:
        return jsonify({'success': False, 'message': 'Podcast not found'}), 404

    podcast.is_published = not podcast.is_published
    db.session.commit()
    return jsonify({'success': True, 'message': f"Podcast {'published' if podcast.is_published else 'unpublished'}", 'data': podcast.to_dict()}), 200

# ================= STORIES =================
@admin_cms_bp.route('/stories', methods=['GET'])
@jwt_required()
def list_stories():
    stories = Story.query.order_by(Story.sort_order.asc(), Story.created_at.desc()).all()
    return jsonify({'success': True, 'data': [s.to_dict() for s in stories]}), 200

@admin_cms_bp.route('/stories', methods=['POST'])
@jwt_required()
def create_story():
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    if not title:
        return jsonify({'success': False, 'message': 'Title is required'}), 400

    slug = data.get('slug') or slugify(title)
    count = 1
    base_slug = slug
    while Story.query.filter_by(slug=slug).first():
        slug = f"{base_slug}-{count}"
        count += 1

    story = Story(
        title=title,
        slug=slug,
        category_tag=data.get('category_tag', 'Folklore'),
        excerpt=data.get('excerpt', ''),
        content=data.get('content', ''),
        author=data.get('author', 'Community Contributor'),
        image_url=data.get('image_url'),
        sort_order=int(data.get('sort_order', 0)),
        is_published=data.get('is_published', True)
    )
    db.session.add(story)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Story created', 'data': story.to_dict()}), 201

@admin_cms_bp.route('/stories/<int:id>', methods=['PUT'])
@jwt_required()
def update_story(id):
    story = db.session.get(Story, id)
    if not story:
        return jsonify({'success': False, 'message': 'Story not found'}), 404

    data = request.get_json() or {}
    for key in ['title', 'category_tag', 'excerpt', 'content', 'author', 'image_url', 'sort_order', 'is_published']:
        if key in data:
            setattr(story, key, data[key])
    if 'slug' in data and data['slug']:
        story.slug = slugify(data['slug'])

    db.session.commit()
    return jsonify({'success': True, 'message': 'Story updated', 'data': story.to_dict()}), 200

@admin_cms_bp.route('/stories/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_story(id):
    story = db.session.get(Story, id)
    if not story:
        return jsonify({'success': False, 'message': 'Story not found'}), 404

    db.session.delete(story)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Story deleted'}), 200

@admin_cms_bp.route('/stories/<int:id>/toggle-publish', methods=['PATCH'])
@jwt_required()
def toggle_story_publish(id):
    story = db.session.get(Story, id)
    if not story:
        return jsonify({'success': False, 'message': 'Story not found'}), 404

    story.is_published = not story.is_published
    db.session.commit()
    return jsonify({'success': True, 'message': f"Story {'published' if story.is_published else 'unpublished'}", 'data': story.to_dict()}), 200

# ================= GALLERY =================
@admin_cms_bp.route('/gallery', methods=['GET'])
@jwt_required()
def list_gallery():
    items = GalleryItem.query.order_by(GalleryItem.sort_order.asc(), GalleryItem.created_at.desc()).all()
    return jsonify({'success': True, 'data': [i.to_dict() for i in items]}), 200

@admin_cms_bp.route('/gallery', methods=['POST'])
@jwt_required()
def create_gallery_item():
    try:
        data = request.get_json() or {}
        image_url = data.get('image_url')
        if not image_url:
            return jsonify({'success': False, 'message': 'Image URL is required'}), 400

        item = GalleryItem(
            title=data.get('title') or 'Project Photo',
            caption=data.get('caption', ''),
            category=data.get('category', 'general'),
            image_url=image_url,
            alt_text=data.get('alt_text') or 'Voices of Vehari project visual',
            sort_order=int(data.get('sort_order', 0)),
            is_published=bool(data.get('is_published', True))
        )
        db.session.add(item)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Gallery item added', 'data': item.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Gallery creation error: {str(e)}'}), 500

@admin_cms_bp.route('/gallery/<int:id>', methods=['PUT'])
@jwt_required()
def update_gallery_item(id):
    item = db.session.get(GalleryItem, id)
    if not item:
        return jsonify({'success': False, 'message': 'Item not found'}), 404

    data = request.get_json() or {}
    for key in ['title', 'caption', 'category', 'image_url', 'alt_text', 'sort_order', 'is_published']:
        if key in data:
            setattr(item, key, data[key])

    db.session.commit()
    return jsonify({'success': True, 'message': 'Gallery item updated', 'data': item.to_dict()}), 200

@admin_cms_bp.route('/gallery/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_gallery_item(id):
    item = db.session.get(GalleryItem, id)
    if not item:
        return jsonify({'success': False, 'message': 'Item not found'}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Gallery item deleted'}), 200

# ================= TEAM MEMBERS =================
@admin_cms_bp.route('/team', methods=['GET'])
@jwt_required()
def list_team():
    members = TeamMember.query.order_by(TeamMember.sort_order.asc()).all()
    return jsonify({'success': True, 'data': [m.to_dict() for m in members]}), 200

@admin_cms_bp.route('/team', methods=['POST'])
@jwt_required()
def create_team_member():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    role_category = (data.get('role_category') or 'contributor').strip()
    designation = (data.get('designation') or '').strip()

    if not name or not designation:
        return jsonify({'success': False, 'message': 'Name and designation are required'}), 400

    member = TeamMember(
        name=name,
        role_category=role_category,
        designation=designation,
        initials=data.get('initials'),
        image_url=data.get('image_url'),
        bio=data.get('bio'),
        sort_order=int(data.get('sort_order', 0)),
        is_active=data.get('is_active', True)
    )
    db.session.add(member)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Team member added', 'data': member.to_dict()}), 201

@admin_cms_bp.route('/team/<int:id>', methods=['PUT'])
@jwt_required()
def update_team_member(id):
    member = db.session.get(TeamMember, id)
    if not member:
        return jsonify({'success': False, 'message': 'Team member not found'}), 404

    data = request.get_json() or {}
    for key in ['name', 'role_category', 'designation', 'initials', 'image_url', 'bio', 'sort_order', 'is_active']:
        if key in data:
            setattr(member, key, data[key])

    db.session.commit()
    return jsonify({'success': True, 'message': 'Team member updated', 'data': member.to_dict()}), 200

@admin_cms_bp.route('/team/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_team_member(id):
    member = db.session.get(TeamMember, id)
    if not member:
        return jsonify({'success': False, 'message': 'Team member not found'}), 404

    db.session.delete(member)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Team member deleted'}), 200

# ================= SECTION CARDS =================
@admin_cms_bp.route('/cards', methods=['GET'])
@jwt_required()
def list_cards():
    group = request.args.get('group')
    query = SectionCard.query
    if group:
        query = query.filter_by(section_group=group)
    cards = query.order_by(SectionCard.section_group.asc(), SectionCard.sort_order.asc()).all()
    return jsonify({'success': True, 'data': [c.to_dict() for c in cards]}), 200

@admin_cms_bp.route('/cards', methods=['POST'])
@jwt_required()
def create_card():
    data = request.get_json() or {}
    group = data.get('section_group')
    title = data.get('title')
    description = data.get('description')

    if not group or not title or not description:
        return jsonify({'success': False, 'message': 'section_group, title, and description are required'}), 400

    card = SectionCard(
        section_group=group,
        icon=data.get('icon'),
        tag=data.get('tag'),
        title=title,
        description=description,
        link_url=data.get('link_url'),
        sort_order=int(data.get('sort_order', 0)),
        is_active=data.get('is_active', True)
    )
    if 'bullets' in data:
        card.set_bullets(data['bullets'])

    db.session.add(card)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Card created', 'data': card.to_dict()}), 201

@admin_cms_bp.route('/cards/<int:id>', methods=['PUT'])
@jwt_required()
def update_card(id):
    card = db.session.get(SectionCard, id)
    if not card:
        return jsonify({'success': False, 'message': 'Card not found'}), 404

    data = request.get_json() or {}
    for key in ['section_group', 'icon', 'tag', 'title', 'description', 'link_url', 'sort_order', 'is_active']:
        if key in data:
            setattr(card, key, data[key])

    if 'bullets' in data:
        card.set_bullets(data['bullets'])

    db.session.commit()
    return jsonify({'success': True, 'message': 'Card updated', 'data': card.to_dict()}), 200

@admin_cms_bp.route('/cards/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_card(id):
    card = db.session.get(SectionCard, id)
    if not card:
        return jsonify({'success': False, 'message': 'Card not found'}), 404

    db.session.delete(card)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Card deleted'}), 200

# ================= STATISTICS =================
@admin_cms_bp.route('/statistics', methods=['GET'])
@jwt_required()
def list_statistics():
    stats = Statistic.query.order_by(Statistic.sort_order.asc()).all()
    return jsonify({'success': True, 'data': [s.to_dict() for s in stats]}), 200

@admin_cms_bp.route('/statistics', methods=['POST'])
@jwt_required()
def create_statistic():
    data = request.get_json() or {}
    value = data.get('value')
    label = data.get('label')
    if not value or not label:
        return jsonify({'success': False, 'message': 'Value and label are required'}), 400

    stat = Statistic(
        value=value,
        label=label,
        sort_order=int(data.get('sort_order', 0)),
        is_active=data.get('is_active', True)
    )
    db.session.add(stat)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Statistic added', 'data': stat.to_dict()}), 201

@admin_cms_bp.route('/statistics/<int:id>', methods=['PUT'])
@jwt_required()
def update_statistic(id):
    stat = db.session.get(Statistic, id)
    if not stat:
        return jsonify({'success': False, 'message': 'Statistic not found'}), 404

    data = request.get_json() or {}
    for key in ['value', 'label', 'sort_order', 'is_active']:
        if key in data:
            setattr(stat, key, data[key])

    db.session.commit()
    return jsonify({'success': True, 'message': 'Statistic updated', 'data': stat.to_dict()}), 200

@admin_cms_bp.route('/statistics/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_statistic(id):
    stat = db.session.get(Statistic, id)
    if not stat:
        return jsonify({'success': False, 'message': 'Statistic not found'}), 404

    db.session.delete(stat)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Statistic deleted'}), 200

# ================= TIMELINE =================
@admin_cms_bp.route('/timeline', methods=['GET'])
@jwt_required()
def list_timeline():
    items = TimelineItem.query.order_by(TimelineItem.phase_number.asc()).all()
    return jsonify({'success': True, 'data': [t.to_dict() for t in items]}), 200

@admin_cms_bp.route('/timeline/<int:id>', methods=['PUT'])
@jwt_required()
def update_timeline(id):
    item = db.session.get(TimelineItem, id)
    if not item:
        return jsonify({'success': False, 'message': 'Timeline item not found'}), 404

    data = request.get_json() or {}
    for key in ['phase_number', 'duration', 'title', 'sort_order', 'is_active']:
        if key in data:
            setattr(item, key, data[key])
    if 'paragraphs' in data:
        item.set_paragraphs(data['paragraphs'])

    db.session.commit()
    return jsonify({'success': True, 'message': 'Timeline item updated', 'data': item.to_dict()}), 200

# ================= CONTACT SUBMISSIONS =================
@admin_cms_bp.route('/submissions', methods=['GET'])
@jwt_required()
def list_submissions():
    submissions = ContactSubmission.query.order_by(ContactSubmission.created_at.desc()).all()
    return jsonify({'success': True, 'data': [s.to_dict() for s in submissions]}), 200

@admin_cms_bp.route('/submissions/<int:id>/status', methods=['PATCH'])
@jwt_required()
def update_submission_status(id):
    sub = db.session.get(ContactSubmission, id)
    if not sub:
        return jsonify({'success': False, 'message': 'Submission not found'}), 404

    data = request.get_json() or {}
    status = data.get('status')
    if status in ['unread', 'read', 'replied', 'archived']:
        sub.status = status
        db.session.commit()
        return jsonify({'success': True, 'message': 'Status updated', 'data': sub.to_dict()}), 200
    return jsonify({'success': False, 'message': 'Invalid status'}), 400

@admin_cms_bp.route('/submissions/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_submission(id):
    sub = db.session.get(ContactSubmission, id)
    if not sub:
        return jsonify({'success': False, 'message': 'Submission not found'}), 404

    db.session.delete(sub)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Submission deleted'}), 200

# ================= TEACHER GUIDE: ARTICLES =================
@admin_cms_bp.route('/teacher-guide/articles', methods=['GET'])
@jwt_required()
def get_teacher_articles():
    articles = TeacherGuideArticle.query.order_by(
        TeacherGuideArticle.display_order.asc(),
        TeacherGuideArticle.created_at.desc()
    ).all()
    return jsonify({'success': True, 'data': [a.to_dict() for a in articles]}), 200

@admin_cms_bp.route('/teacher-guide/articles', methods=['POST'])
@jwt_required()
def create_teacher_article():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    if not title:
        return jsonify({'success': False, 'message': 'Title is required'}), 400

    base_slug = slugify(title) or 'teacher-guide-article'
    slug = base_slug
    counter = 1
    while TeacherGuideArticle.query.filter_by(slug=slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    article = TeacherGuideArticle(
        title=title,
        slug=slug,
        category=data.get('category', 'Lesson Ideas'),
        short_description=data.get('short_description', data.get('excerpt', '')),
        content=data.get('content', ''),
        image_url=data.get('image_url'),
        level=data.get('level', 'Intermediate'),
        estimated_time=data.get('estimated_time', data.get('time', '30–45 minutes')),
        author=data.get('author', 'Voices of Vehari Team'),
        display_order=data.get('display_order', 0),
        is_published=data.get('is_published', True)
    )
    if 'materials' in data:
        article.set_materials(data['materials'])
    if 'steps' in data:
        article.set_steps(data['steps'])

    db.session.add(article)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Article created successfully', 'data': article.to_dict()}), 201

@admin_cms_bp.route('/teacher-guide/articles/<int:id>', methods=['PUT'])
@jwt_required()
def update_teacher_article(id):
    article = db.session.get(TeacherGuideArticle, id)
    if not article:
        return jsonify({'success': False, 'message': 'Article not found'}), 404

    data = request.get_json() or {}
    if 'title' in data and data['title'].strip():
        article.title = data['title'].strip()
    if 'category' in data:
        article.category = data['category']
    if 'short_description' in data:
        article.short_description = data['short_description']
    elif 'excerpt' in data:
        article.short_description = data['excerpt']
    if 'content' in data:
        article.content = data['content']
    if 'image_url' in data:
        article.image_url = data['image_url']
    if 'level' in data:
        article.level = data['level']
    if 'estimated_time' in data:
        article.estimated_time = data['estimated_time']
    elif 'time' in data:
        article.estimated_time = data['time']
    if 'author' in data:
        article.author = data['author']
    if 'display_order' in data:
        article.display_order = data['display_order']
    if 'is_published' in data:
        article.is_published = data['is_published']

    if 'materials' in data:
        article.set_materials(data['materials'])
    if 'steps' in data:
        article.set_steps(data['steps'])

    db.session.commit()
    return jsonify({'success': True, 'message': 'Article updated successfully', 'data': article.to_dict()}), 200

@admin_cms_bp.route('/teacher-guide/articles/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_teacher_article(id):
    article = db.session.get(TeacherGuideArticle, id)
    if not article:
        return jsonify({'success': False, 'message': 'Article not found'}), 404

    db.session.delete(article)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Article deleted successfully'}), 200

@admin_cms_bp.route('/teacher-guide/articles/<int:id>/toggle-publish', methods=['PATCH'])
@jwt_required()
def toggle_teacher_article_publish(id):
    article = db.session.get(TeacherGuideArticle, id)
    if not article:
        return jsonify({'success': False, 'message': 'Article not found'}), 404

    article.is_published = not article.is_published
    db.session.commit()
    status_str = 'published' if article.is_published else 'unpublished'
    return jsonify({'success': True, 'message': f'Article is now {status_str}', 'data': article.to_dict()}), 200

# ================= TEACHER GUIDE: FEATURED ACTIVITY =================
@admin_cms_bp.route('/teacher-guide/activities', methods=['GET'])
@jwt_required()
def get_teacher_activities():
    activities = TeacherGuideActivity.query.order_by(TeacherGuideActivity.id.desc()).all()
    return jsonify({'success': True, 'data': [a.to_dict() for a in activities]}), 200

@admin_cms_bp.route('/teacher-guide/activities', methods=['POST'])
@jwt_required()
def create_teacher_activity():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    purpose = data.get('purpose', '').strip()
    if not title or not purpose:
        return jsonify({'success': False, 'message': 'Title and Purpose are required'}), 400

    activity = TeacherGuideActivity(
        title=title,
        purpose=purpose,
        estimated_time=data.get('estimated_time', data.get('time', '35 minutes')),
        level=data.get('level', 'Intermediate'),
        teacher_tip=data.get('teacher_tip', data.get('teacherTip', '')),
        image_url=data.get('image_url'),
        is_published=data.get('is_published', True)
    )
    if 'objectives' in data:
        activity.set_objectives(data['objectives'])
    if 'steps' in data:
        activity.set_steps(data['steps'])

    db.session.add(activity)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Activity created successfully', 'data': activity.to_dict()}), 201

@admin_cms_bp.route('/teacher-guide/activities/<int:id>', methods=['PUT'])
@jwt_required()
def update_teacher_activity(id):
    activity = db.session.get(TeacherGuideActivity, id)
    if not activity:
        return jsonify({'success': False, 'message': 'Activity not found'}), 404

    data = request.get_json() or {}
    if 'title' in data:
        activity.title = data['title']
    if 'purpose' in data:
        activity.purpose = data['purpose']
    if 'estimated_time' in data:
        activity.estimated_time = data['estimated_time']
    elif 'time' in data:
        activity.estimated_time = data['time']
    if 'level' in data:
        activity.level = data['level']
    if 'teacher_tip' in data:
        activity.teacher_tip = data['teacher_tip']
    elif 'teacherTip' in data:
        activity.teacher_tip = data['teacherTip']
    if 'image_url' in data:
        activity.image_url = data['image_url']
    if 'is_published' in data:
        activity.is_published = data['is_published']

    if 'objectives' in data:
        activity.set_objectives(data['objectives'])
    if 'steps' in data:
        activity.set_steps(data['steps'])

    db.session.commit()
    return jsonify({'success': True, 'message': 'Activity updated successfully', 'data': activity.to_dict()}), 200

@admin_cms_bp.route('/teacher-guide/activities/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_teacher_activity(id):
    activity = db.session.get(TeacherGuideActivity, id)
    if not activity:
        return jsonify({'success': False, 'message': 'Activity not found'}), 404

    db.session.delete(activity)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Activity deleted successfully'}), 200

@admin_cms_bp.route('/teacher-guide/activities/<int:id>/toggle-publish', methods=['PATCH'])
@jwt_required()
def toggle_teacher_activity_publish(id):
    activity = db.session.get(TeacherGuideActivity, id)
    if not activity:
        return jsonify({'success': False, 'message': 'Activity not found'}), 404

    activity.is_published = not activity.is_published
    db.session.commit()
    status_str = 'published' if activity.is_published else 'unpublished'
    return jsonify({'success': True, 'message': f'Activity is now {status_str}', 'data': activity.to_dict()}), 200

# ================= TEACHER GUIDE: STRATEGIES =================
@admin_cms_bp.route('/teacher-guide/strategies', methods=['GET'])
@jwt_required()
def get_teacher_strategies():
    strategies = TeacherGuideStrategy.query.order_by(
        TeacherGuideStrategy.display_order.asc(),
        TeacherGuideStrategy.id.asc()
    ).all()
    return jsonify({'success': True, 'data': [s.to_dict() for s in strategies]}), 200

@admin_cms_bp.route('/teacher-guide/strategies', methods=['POST'])
@jwt_required()
def create_teacher_strategy():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    desc = data.get('description', '').strip()
    if not title or not desc:
        return jsonify({'success': False, 'message': 'Title and Description are required'}), 400

    strategy = TeacherGuideStrategy(
        strategy_number=data.get('strategy_number', data.get('num', '01')),
        title=title,
        description=desc,
        icon=data.get('icon', '💡'),
        display_order=data.get('display_order', 0),
        is_published=data.get('is_published', True)
    )
    db.session.add(strategy)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Strategy created successfully', 'data': strategy.to_dict()}), 201

@admin_cms_bp.route('/teacher-guide/strategies/<int:id>', methods=['PUT'])
@jwt_required()
def update_teacher_strategy(id):
    strategy = db.session.get(TeacherGuideStrategy, id)
    if not strategy:
        return jsonify({'success': False, 'message': 'Strategy not found'}), 404

    data = request.get_json() or {}
    if 'strategy_number' in data:
        strategy.strategy_number = data['strategy_number']
    elif 'num' in data:
        strategy.strategy_number = data['num']
    if 'title' in data:
        strategy.title = data['title']
    if 'description' in data:
        strategy.description = data['description']
    if 'icon' in data:
        strategy.icon = data['icon']
    if 'display_order' in data:
        strategy.display_order = data['display_order']
    if 'is_published' in data:
        strategy.is_published = data['is_published']

    db.session.commit()
    return jsonify({'success': True, 'message': 'Strategy updated successfully', 'data': strategy.to_dict()}), 200

@admin_cms_bp.route('/teacher-guide/strategies/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_teacher_strategy(id):
    strategy = db.session.get(TeacherGuideStrategy, id)
    if not strategy:
        return jsonify({'success': False, 'message': 'Strategy not found'}), 404

    db.session.delete(strategy)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Strategy deleted successfully'}), 200

@admin_cms_bp.route('/teacher-guide/strategies/<int:id>/toggle-publish', methods=['PATCH'])
@jwt_required()
def toggle_teacher_strategy_publish(id):
    strategy = db.session.get(TeacherGuideStrategy, id)
    if not strategy:
        return jsonify({'success': False, 'message': 'Strategy not found'}), 404

    strategy.is_published = not strategy.is_published
    db.session.commit()
    status_str = 'published' if strategy.is_published else 'unpublished'
    return jsonify({'success': True, 'message': f'Strategy is now {status_str}', 'data': strategy.to_dict()}), 200

# ================= TEACHER GUIDE: PROMPTS =================
@admin_cms_bp.route('/teacher-guide/prompts', methods=['GET'])
@jwt_required()
def get_teacher_prompts():
    prompts = TeacherGuidePrompt.query.order_by(
        TeacherGuidePrompt.display_order.asc(),
        TeacherGuidePrompt.id.asc()
    ).all()
    return jsonify({'success': True, 'data': [p.to_dict() for p in prompts]}), 200

@admin_cms_bp.route('/teacher-guide/prompts', methods=['POST'])
@jwt_required()
def create_teacher_prompt():
    data = request.get_json() or {}
    prompt_text = data.get('prompt', '').strip()
    if not prompt_text:
        return jsonify({'success': False, 'message': 'Prompt text is required'}), 400

    prompt = TeacherGuidePrompt(
        prompt=prompt_text,
        category=data.get('category', 'General'),
        display_order=data.get('display_order', 0),
        is_published=data.get('is_published', True)
    )
    db.session.add(prompt)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Prompt created successfully', 'data': prompt.to_dict()}), 201

@admin_cms_bp.route('/teacher-guide/prompts/<int:id>', methods=['PUT'])
@jwt_required()
def update_teacher_prompt(id):
    prompt = db.session.get(TeacherGuidePrompt, id)
    if not prompt:
        return jsonify({'success': False, 'message': 'Prompt not found'}), 404

    data = request.get_json() or {}
    if 'prompt' in data:
        prompt.prompt = data['prompt']
    if 'category' in data:
        prompt.category = data['category']
    if 'display_order' in data:
        prompt.display_order = data['display_order']
    if 'is_published' in data:
        prompt.is_published = data['is_published']

    db.session.commit()
    return jsonify({'success': True, 'message': 'Prompt updated successfully', 'data': prompt.to_dict()}), 200

@admin_cms_bp.route('/teacher-guide/prompts/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_teacher_prompt(id):
    prompt = db.session.get(TeacherGuidePrompt, id)
    if not prompt:
        return jsonify({'success': False, 'message': 'Prompt not found'}), 404

    db.session.delete(prompt)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Prompt deleted successfully'}), 200

@admin_cms_bp.route('/teacher-guide/prompts/<int:id>/toggle-publish', methods=['PATCH'])
@jwt_required()
def toggle_teacher_prompt_publish(id):
    prompt = db.session.get(TeacherGuidePrompt, id)
    if not prompt:
        return jsonify({'success': False, 'message': 'Prompt not found'}), 404

    prompt.is_published = not prompt.is_published
    db.session.commit()
    status_str = 'published' if prompt.is_published else 'unpublished'
    return jsonify({'success': True, 'message': f'Prompt is now {status_str}', 'data': prompt.to_dict()}), 200

# ================= TEACHER GUIDE: LESSON PLAN TEMPLATE =================
@admin_cms_bp.route('/teacher-guide/lesson-plan', methods=['GET'])
@jwt_required()
def get_teacher_lesson_plan():
    lp = TeacherGuideLessonPlan.query.first()
    if not lp:
        lp = TeacherGuideLessonPlan()
        db.session.add(lp)
        db.session.commit()
    return jsonify({'success': True, 'data': lp.to_dict()}), 200

@admin_cms_bp.route('/teacher-guide/lesson-plan', methods=['PUT'])
@jwt_required()
def update_teacher_lesson_plan():
    lp = TeacherGuideLessonPlan.query.first()
    if not lp:
        lp = TeacherGuideLessonPlan()
        db.session.add(lp)

    data = request.get_json() or {}
    for field in [
        'title', 'description', 'topic', 'learning_objective',
        'english_skills', 'vocabulary', 'warmup_activity',
        'main_activity', 'pair_group_activity', 'assessment', 'homework'
    ]:
        if field in data:
            setattr(lp, field, data[field])

    db.session.commit()
    return jsonify({'success': True, 'message': 'Lesson plan template updated successfully', 'data': lp.to_dict()}), 200
