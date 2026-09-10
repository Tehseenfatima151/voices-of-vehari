import os
import shutil
import json
from app import create_app
from app.extensions import db
from app.models import (
    AdminUser, SiteSettings, HeroSection, SectionCard, Statistic,
    Podcast, Story, GalleryItem, TeamMember,
    TimelineItem, AcademicReference, MediaFile
)

def seed_database(app=None):
    if app is None:
        from flask import current_app
        if current_app:
            app = current_app._get_current_object()
        else:
            app = create_app()

    with app.app_context():
        # Create all tables (idempotent: does not touch existing tables)
        db.create_all()

        upload_dir = app.config['UPLOAD_FOLDER']
        try:
            os.makedirs(upload_dir, exist_ok=True)
        except OSError:
            pass

        # 1. Copy extracted images into uploads folder
        extracted_img_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'extracted', 'images'))
        image_mapping = {
            'image_0.png': 'voices_logo.png',
            'image_1.jpeg': 'hero_art.jpeg',
            'image_2.png': 'logo_float.png',
            'image_3.jpeg': 'poster_culture.jpeg',
            'image_4.jpeg': 'podcast_women_edu.jpeg',
            'image_5.jpeg': 'podcast_food.jpeg',
            'image_6.jpeg': 'podcast_upcoming.jpeg',
            'image_7.jpeg': 'gallery_poster.jpeg',
            'image_8.jpeg': 'gallery_storytelling.jpeg',
            'image_9.jpeg': 'gallery_campus.jpeg',
            'image_10.jpeg': 'gallery_students.jpeg',
            'image_11.jpeg': 'gallery_event.jpeg',
            'image_12.jpeg': 'gallery_recording.jpeg',
        }

        # Also copy to frontend public directory if it exists
        frontend_assets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'assets'))
        try:
            os.makedirs(frontend_assets_dir, exist_ok=True)
        except OSError:
            frontend_assets_dir = None

        if os.path.exists(extracted_img_dir):
            for src_name, dst_name in image_mapping.items():
                src_path = os.path.join(extracted_img_dir, src_name)
                dst_path = os.path.join(upload_dir, dst_name)
                if os.path.exists(src_path) and not os.path.exists(dst_path):
                    try:
                        shutil.copyfile(src_path, dst_path)
                        print(f"Copied image {src_name} -> {dst_name}")
                    except OSError:
                        pass
                if frontend_assets_dir and os.path.exists(src_path):
                    try:
                        frontend_dst = os.path.join(frontend_assets_dir, dst_name)
                        if not os.path.exists(frontend_dst):
                            shutil.copyfile(src_path, frontend_dst)
                    except OSError:
                        pass

        # 2. Seed Admin User (idempotent: avoids duplicate admin users)
        admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@voicesofvehari.edu.pk')
        admin_user = AdminUser.query.filter(
            (AdminUser.username == admin_username) | (AdminUser.email == admin_email)
        ).first()
        if not admin_user and AdminUser.query.count() == 0:
            admin_user = AdminUser(
                username=admin_username,
                email=admin_email,
                full_name='Voices of Vehari Admin',
                role='admin'
            )
            admin_user.set_password(os.environ.get('ADMIN_PASSWORD', 'AdminPassword2026!'))
            db.session.add(admin_user)
            print(f"Created default admin user: {admin_username}")

        # 3. Seed Site Settings
        if not SiteSettings.query.first():
            settings = SiteSettings(
                site_name='Voices of Vehari',
                tagline='Enhancing English Proficiency through Multilingual Podcasting and Cultural Storytelling.',
                campus='COMSATS University Islamabad, Vehari Campus',
                address='Mailsi Road, Off Multan Road, Peer Murad, Vehari, Punjab, Pakistan',
                contact_email='info@voicesofvehari.edu.pk',
                contact_phone='+92 (0) 67 3602803',
                pi_name='Dr. Muhammad Imran Saeed',
                copi_name='Nazish Malik',
                logo_url='/api/uploads/voices_logo.png',
                footer_text='Enhancing English Proficiency through Multilingual Podcasting and Cultural Storytelling.',
                footer_copyright='Voices of Vehari · COMSATS University Islamabad, Vehari Campus',
                meta_title='Voices of Vehari | Multilingual Podcasting & Cultural Storytelling',
                meta_description='A research & community storytelling initiative connecting English language development with local languages, stories and lived experiences of Vehari.'
            )
            db.session.add(settings)
            print("Seeded Site Settings")

        # 4. Seed Hero Section
        if not HeroSection.query.first():
            hero = HeroSection(
                kicker='A research & community storytelling initiative',
                title='Voices of Vehari',
                lead_strong='Enhancing English Proficiency through Multilingual Podcasting and Cultural Storytelling.',
                lead_body='A context-based learning project that brings English, local languages, community voices and the cultural heritage of Vehari together through simple, accessible podcasts and stories.',
                primary_btn_text='Explore Podcasts',
                primary_btn_url='#podcasts',
                secondary_btn_text='Start Learning',
                secondary_btn_url='#learning',
                hero_image_url='/api/uploads/hero_art.jpeg',
                hero_image_alt='Illustration of young people creating podcasts and sharing stories',
                logo_float_url='/api/uploads/voices_logo.png',
                is_active=True
            )
            db.session.add(hero)
            print("Seeded Hero Section")

        # 5. Seed Statistics
        if Statistic.query.count() == 0:
            stats_data = [
                ('12', 'Months of project activity', 1),
                ('20', 'University students in the podcast intervention', 2),
                ('15', 'Community participants', 3),
                ('12', 'Practice group sessions', 4)
            ]
            for val, lbl, order in stats_data:
                db.session.add(Statistic(value=val, label=lbl, sort_order=order, is_active=True))
            print("Seeded Statistics")

        # 6. Seed Section Cards
        if SectionCard.query.count() == 0:
            cards_data = [
                # Home "The idea" cards
                ('home_idea', '🎙️', None, 'Multilingual Podcasting', 'Use simple podcasts with English alongside local languages such as Punjabi and Saraiki to provide authentic, accessible language input.', None, None, 1),
                ('home_idea', '📖', None, 'Cultural Storytelling', 'Use local folklore, historical narration, customs and rural experiences as meaningful contexts for language learning.', None, None, 2),
                ('home_idea', '📚', None, 'English Learning', 'Turn every conversation into opportunities to practise listening, speaking and vocabulary through questions, word lists and speaking prompts.', None, None, 3),

                # About "The challenge we are responding to"
                ('about_challenge', None, None, 'Conventional learning', 'Rote learning, grammar drills and standard textbooks may not always sustain learner attention or support cultural and linguistic identities.', None, None, 1),
                ('about_challenge', None, None, 'Limited authentic input', 'In EFL contexts, learners can have few opportunities to hear and use English naturally outside class.', None, None, 2),
                ('about_challenge', None, None, 'Underexplored context', 'The proposal identifies a need for more empirical research on podcasting in multilingual, rural and culturally specific settings such as Vehari.', None, None, 3),

                # Research Objectives
                ('research_objective', '01', None, 'Listening & speaking', 'Assess the impact of multilingual podcasting on improving English listening and speaking proficiency among EFL learners in Vehari.', None, None, 1),
                ('research_objective', '02', None, 'Vocabulary & culture', 'Evaluate the role of cultural storytelling in enhancing vocabulary acquisition and cultural awareness.', None, None, 2),
                ('research_objective', '03', None, 'Perceptions', 'Explore students\' and teachers\' perceptions of multilingual podcasts as a tool for English language instruction.', None, None, 3),
                ('research_objective', '04', None, 'Scalable model', 'Develop a scalable model for integrating podcasting and cultural storytelling into EFL curricula in multilingual settings.', None, None, 4),

                # Learning Resources
                ('learning_resource', '🎧', None, 'Listening Practice', 'Listen to a podcast, identify key ideas and answer comprehension questions.', ['Main-idea questions', 'Detail questions', 'Listening reflection'], None, 1),
                ('learning_resource', '🗣️', None, 'Speaking Practice', 'Use episode questions and local topics to encourage guided English conversation.', ['Opinion prompts', 'Follow-up questions', 'Short speaking tasks'], None, 2),
                ('learning_resource', '📖', None, 'Vocabulary', 'Build practical word lists from authentic conversations and cultural stories.', ['English word', 'Local-language meaning', 'Example sentence'], None, 3),
                ('learning_resource', '💬', None, 'Conversation Guides', 'Simple support for introducing guests, asking questions, following up and closing interviews.', None, None, 4),
                ('learning_resource', '🌍', None, 'Multilingual Learning', 'Use Punjabi, Saraiki and other familiar linguistic resources to support understanding while developing English.', None, None, 5),
                ('learning_resource', '👩‍🏫', None, 'Teacher Resources', 'Lesson ideas, discussion questions, vocabulary activities, assessment templates and the future how-to guide.', None, None, 6),

                # Gallery Themes
                ('gallery_theme', None, None, 'Podcast Recording', 'Add real recording-session photographs here.', None, None, 1),
                ('gallery_theme', None, None, 'University Sessions', 'Document student practice, mentor training and learning activities.', None, None, 2),
                ('gallery_theme', None, None, 'Community Sessions', 'Document the six planned community-centre practice sessions and engagement activities.', None, None, 3),
                ('gallery_theme', None, None, 'Behind the Scenes', 'Show planning, interviewing, editing and resource creation.', None, None, 4),
                ('gallery_theme', None, None, 'Events', 'Add photographs from the university and community dissemination events.', None, None, 5),
                ('gallery_theme', None, None, 'Campus & Community', 'Capture the places and people that give the project its local identity.', None, None, 6),

                # Outcomes
                ('outcome_item', None, '01', 'Better English', 'Improvement in English speaking, listening and vocabulary among the 20 university students, assessed before, during and after podcast sessions.', None, None, 1),
                ('outcome_item', None, '02', 'Community confidence', 'Evidence of increased confidence in using English among 15 community participants through group discussions and practice sessions.', None, None, 2),
                ('outcome_item', None, '03', 'Online resource collection', 'A free collection of podcasts, word lists and bilingual stories accessible to students, teachers and community members.', None, None, 3),
                ('outcome_item', None, '04', 'Research output', 'A journal article and a presentation at a local or regional conference to share the project\'s findings.', None, None, 4),
                ('outcome_item', None, '05', 'Repeatable teaching plan', 'An accessible guide showing how teachers and community leaders can use podcasts and local stories to teach English.', None, None, 5),

                # News & Events
                ('news_event', None, 'Planned', 'Student Mentor Training', 'Document the training of undergraduate student mentors who will support English learning through local languages.', None, None, 1),
                ('news_event', None, 'Planned', 'University Practice Sessions', 'Six group sessions at the university where participants listen, speak English and discuss local stories.', None, None, 2),
                ('news_event', None, 'Planned', 'Community Practice Sessions', 'Six sessions at community centres to extend the learning intervention beyond campus.', None, None, 3),
                ('news_event', None, 'Planned', 'Podcast Releases', 'Publish new conversations and stories with their transcripts and learning activities.', None, None, 4),
                ('news_event', None, 'Planned', 'University Dissemination Event', 'Present project results to students, teachers and other stakeholders.', None, None, 5),
                ('news_event', None, 'Planned', 'Community Dissemination Event', 'Share the project\'s learning, stories and results with the wider community.', None, None, 6),
            ]

            for grp, icon, tag, title, desc, bullets, link, order in cards_data:
                sc = SectionCard(
                    section_group=grp,
                    icon=icon,
                    tag=tag,
                    title=title,
                    description=desc,
                    link_url=link,
                    sort_order=order,
                    is_active=True
                )
                if bullets:
                    sc.set_bullets(bullets)
                db.session.add(sc)
            print("Seeded Section Cards")

        # 7. Seed Podcasts
        if Podcast.query.count() == 0:
            podcasts_data = [
                {
                    'title': 'Women Education in Vehari',
                    'slug': 'women-education-in-vehari',
                    'guest': 'Dr. Asma Kashif Shehzad',
                    'host': 'Abdullah',
                    'description': "A podcast conversation exploring women's education, opportunities and challenges in the local Vehari context.",
                    'category': 'education',
                    'tags': ['Education', 'Urdu'],
                    'audio_url': 'https://actions.google.com/sounds/v1/ambiences/outdoor_ambience.ogg',
                    'cover_image_url': '/api/uploads/podcast_women_edu.jpeg',
                    'transcript_url': '#transcript',
                    'learning_url': '#learning',
                    'sort_order': 1,
                    'is_featured': True
                },
                {
                    'title': 'Food of Vehari',
                    'slug': 'food-of-vehari',
                    'guest': 'Hassan Raza',
                    'host': 'Abdullah',
                    'description': 'A local food and culture conversation exploring tastes, traditions and the stories connected with food in Vehari.',
                    'category': 'food',
                    'tags': ['Food', 'Culture'],
                    'audio_url': 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
                    'cover_image_url': '/api/uploads/podcast_food.jpeg',
                    'transcript_url': '#transcript',
                    'learning_url': '#learning',
                    'sort_order': 2,
                    'is_featured': False
                },
                {
                    'title': 'Upcoming Local Voices',
                    'slug': 'upcoming-local-voices',
                    'guest': 'Community Guests & Youth',
                    'host': 'Project Team',
                    'description': 'Future episodes will feature folktales, local customs, rural experiences, youth perspectives and community stories.',
                    'category': 'culture',
                    'tags': ['Culture', 'Multilingual'],
                    'audio_url': None,
                    'cover_image_url': '/api/uploads/podcast_upcoming.jpeg',
                    'transcript_url': '#transcript',
                    'learning_url': '#learning',
                    'sort_order': 3,
                    'is_featured': False
                }
            ]
            for p in podcasts_data:
                pod = Podcast(
                    title=p['title'],
                    slug=p['slug'],
                    guest=p['guest'],
                    host=p['host'],
                    description=p['description'],
                    category=p['category'],
                    audio_url=p['audio_url'],
                    cover_image_url=p['cover_image_url'],
                    transcript_url=p['transcript_url'],
                    learning_url=p['learning_url'],
                    sort_order=p['sort_order'],
                    is_published=True,
                    is_featured=p['is_featured']
                )
                pod.set_tags(p['tags'])
                db.session.add(pod)
            print("Seeded Podcasts")

        # 8. Seed Stories
        if Story.query.count() == 0:
            stories_data = [
                ('Voices from local folklore', 'voices-from-local-folklore', 'Folklore', 'Short bilingual stories rooted in the oral traditions of Vehari, followed by English vocabulary and discussion prompts.', 1),
                ('Local customs & traditions', 'local-customs-traditions', 'Customs', 'Stories that explain how community practices, celebrations and everyday traditions are experienced and remembered.', 2),
                ('Stories of rural life', 'stories-of-rural-life', 'Rural life', 'Context-rich narratives about work, family, community and the environments in which learners live.', 3),
                ('Historical narration', 'historical-narration', 'History', 'Locally relevant historical accounts presented in accessible language and connected to English learning activities.', 4),
                ('Food & cultural memory', 'food-cultural-memory', 'Food', 'Food stories that connect language with tastes, places, family traditions and local identity.', 5),
                ('Young voices', 'young-voices', 'Youth', 'Student and youth perspectives that document aspirations, learning experiences and life in contemporary Vehari.', 6)
            ]
            for title, slug, tag, excerpt, order in stories_data:
                db.session.add(Story(
                    title=title,
                    slug=slug,
                    category_tag=tag,
                    excerpt=excerpt,
                    content=f"Full narrative and pedagogical exploration for {title}. Grounded in Vehari oral heritage.",
                    author='Voices of Vehari Research Team',
                    sort_order=order,
                    is_published=True
                ))
            print("Seeded Stories")

        # 9. Seed Gallery
        if GalleryItem.query.count() == 0:
            gallery_data = [
                ('Voices of Vehari project poster', 'Project Visual Presentation', '/api/uploads/gallery_poster.jpeg', 1),
                ('Illustration representing podcasting and storytelling', 'Creative Media Design', '/api/uploads/gallery_storytelling.jpeg', 2),
                ('COMSATS Vehari project visual', 'Campus Context', '/api/uploads/gallery_campus.jpeg', 3),
                ('Illustration of student podcast contributors', 'Youth Engagement', '/api/uploads/gallery_students.jpeg', 4),
                ('Project poster visual', 'Outreach & Documentation', '/api/uploads/gallery_event.jpeg', 5),
                ('Podcast and storytelling illustration', 'Media In Action', '/api/uploads/gallery_recording.jpeg', 6),
            ]
            for title, cap, url, order in gallery_data:
                db.session.add(GalleryItem(
                    title=title,
                    caption=cap,
                    image_url=url,
                    alt_text=title,
                    sort_order=order,
                    is_published=True
                ))
            print("Seeded Gallery Items")

        # 10. Seed Team Members
        if TeamMember.query.count() == 0:
            team_data = [
                # Leadership
                ('Dr. Muhammad Imran Saeed', 'leadership', 'Principal Investigator · Principal Author', 'IS', 1),
                ('Nazish Malik', 'leadership', 'Co-Principal Investigator · Co-author', 'NM', 2),
                # Mentors
                ('Muhammad Shoaib', 'mentor', 'Mentor', 'MS', 3),
                ('Muhammad Rashid', 'mentor', 'Mentor', 'MR', 4),
                ('Muhammad Irshad', 'mentor', 'Mentor', 'MI', 5),
                # Student team
                ('Khansa Saeed', 'student', 'Student Team', 'KS', 6),
                ('Maha Anwar', 'student', 'Student Team', 'MA', 7),
                ('Muhammad Suleman', 'student', 'Student Team', 'MS', 8),
                ('Noor Fatima', 'student', 'Student Team', 'NF', 9),
                ('Noreen Nehsat', 'student', 'Student Team', 'NN', 10),
                ('Aleeza Khadim', 'student', 'Student Team', 'AK', 11),
                ('Bassri Sattar', 'student', 'Student Team', 'BS', 12),
                # Contributors
                ('Abdullah', 'contributor', 'Podcast Host', 'AA', 13),
                ('Hassan Raza', 'contributor', 'Featured Guest · Food & Culture', 'HR', 14),
                ('Dr. Asma Kashif Shehzad', 'contributor', "Featured Guest · Women's Education", 'AK', 15)
            ]
            for name, role, desig, init, order in team_data:
                db.session.add(TeamMember(
                    name=name,
                    role_category=role,
                    designation=desig,
                    initials=init,
                    sort_order=order,
                    is_active=True
                ))
            print("Seeded Team Members")

        # 11. Seed Timeline Items
        if TimelineItem.query.count() == 0:
            phases = [
                (1, 'Months 1–3', 'Getting Ready', [
                    "Learn what people need: discuss with 30 university students and 15 community members through simple questionnaires or group interviews.",
                    "Helpers training: train 10–15 undergraduate students to become mentors who can support English learning using local languages such as Punjabi and Saraiki.",
                    "Easy resources: develop word lists, brief bilingual stories and conversation guides.",
                    "Venues: establish learning venues through a local university and two community centres such as a school or library."
                ]),
                (2, 'Months 4–9', 'Learning with Podcasts', [
                    "Podcast sessions: use weekly podcasts with 20 university students and 15 community residents. Episodes combine English learning with local stories such as folktales or customs in Punjabi and Saraiki. Each podcast includes simple questions, vocabulary training and suggestions for speaking.",
                    "Practice groups: conduct 12 group sessions — 6 at the university and 6 at community centres — where participants listen, speak English and discuss local stories.",
                    "Assess progression: use simple tests before, during and after sessions to examine progress in English skills such as clear speaking and understanding conversations."
                ]),
                (3, 'Months 10–12', 'Sharing & Finishing Up', [
                    "Resource collection: bring podcasts, word lists and stories together on a free digital resource page.",
                    "Two events: present project results at one university event and one community-centre event.",
                    "How-to guide: produce a short, accessible guide for teachers and community leaders on using podcasts and local stories to teach English."
                ])
            ]
            for p_num, dur, title, paras in phases:
                ti = TimelineItem(
                    phase_number=p_num,
                    duration=dur,
                    title=title,
                    sort_order=p_num,
                    is_active=True
                )
                ti.set_paragraphs(paras)
                db.session.add(ti)
            print("Seeded Timeline Items")

        # 12. Seed Academic References
        if AcademicReference.query.count() == 0:
            refs = [
                ('Rosell-Aguilar (2013)', 'Podcasting for language learning and its potential in technology-supported instruction.', 1),
                ('Hassan & Hoon (2013)', 'Review of podcast applications in language learning.', 2),
                ('Cenoz & Gorter (2013)', 'Plurilingual approaches and flexible boundaries between languages.', 3),
                ('Creese & Blackledge (2010)', 'Translanguaging as a pedagogy for multilingual classrooms.', 4),
                ('Byram (1997)', 'Intercultural communicative competence and learning across cultural differences.', 5),
                ('Kramsch (1993)', 'Context and culture in language teaching.', 6),
                ('Vandergrift & Goh (2012)', 'Teaching and learning second-language listening.', 7),
                ('Yeh, Chang & Yeh (2021)', 'Mobile-assisted language learning and listening skill development.', 8),
            ]
            for author, contrib, order in refs:
                db.session.add(AcademicReference(author=author, contribution=contrib, sort_order=order, is_active=True))
            print("Seeded Academic References")

        try:
            db.session.commit()
            print("[SUCCESS] Database seeding successfully completed!")
        except Exception as e:
            db.session.rollback()
            print(f"[INFO] Database seeding skipped or already completed: {e}")

if __name__ == '__main__':
    seed_database()
