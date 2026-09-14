import os
import shutil
import json
from app import create_app
from app.extensions import db
from app.models import (
    AdminUser, SiteSettings, HeroSection, SectionCard, Statistic,
    Podcast, Story, GalleryItem, TeamMember,
    TimelineItem, AcademicReference, MediaFile,
    TeacherGuideArticle, TeacherGuideActivity, TeacherGuideStrategy,
    TeacherGuidePrompt, TeacherGuideLessonPlan
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

        # Ensure new column video_url exists if table was previously created
        try:
            with db.engine.connect() as conn:
                conn.execute(db.text("ALTER TABLE podcasts ADD COLUMN video_url VARCHAR(500);"))
                conn.commit()
        except Exception:
            pass

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

        # 2. Seed Admin User (idempotent: ensures active admin user with correct password)
        admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@voicesofvehari.edu.pk')
        admin_password = os.environ.get('ADMIN_PASSWORD', 'AdminPassword2026!')
        admin_user = AdminUser.query.filter(
            (AdminUser.username == admin_username) | (AdminUser.email == admin_email)
        ).first()
        if not admin_user:
            admin_user = AdminUser(
                username=admin_username,
                email=admin_email,
                full_name='Voices of Vehari Admin',
                role='admin',
                is_active=True
            )
            admin_user.set_password(admin_password)
            db.session.add(admin_user)
            print(f"Created default admin user: {admin_username}")
        else:
            admin_user.set_password(admin_password)
            admin_user.is_active = True
            print(f"Verified default admin user password: {admin_username}")
        
        try:
            db.session.commit()
        except Exception as admin_commit_err:
            db.session.rollback()
            print("[INFO] Admin user commit deferred:", admin_commit_err)

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

        # 13. Seed Teacher Guide Articles
        if TeacherGuideArticle.query.count() == 0:
            articles_data = [
                {
                    'title': 'Teaching English Through Local Stories',
                    'slug': 'teaching-english-through-local-stories',
                    'category': 'Lesson Ideas',
                    'short_description': 'A practical approach to using local stories and community experiences to develop reading, vocabulary and discussion skills.',
                    'level': 'Intermediate',
                    'estimated_time': '30–45 minutes',
                    'materials': [
                        'A short printed folk narrative or audio clip',
                        'Guided reading sheet with vocabulary list',
                        'Discussion cue cards'
                    ],
                    'steps': [
                        'Warm-up (5 mins): Ask students if they know any oral folktales passed down by grandparents in Vehari.',
                        'Vocabulary Preview (8 mins): Pre-teach 5-6 key English terms using pictures and local language equivalents (Saraiki/Punjabi).',
                        'Active Reading / Listening (12 mins): Students read or listen to the local narrative in pairs, identifying characters and challenges.',
                        'Paired Discussion (10 mins): Students answer 3 open-ended comprehension prompts regarding the story message.',
                        'Reflection & Wrap-up (5 mins): Brief teacher-led plenary summarizing how cultural themes connect to student lives.'
                    ],
                    'display_order': 1
                },
                {
                    'title': 'Using Cultural Traditions for Speaking Practice',
                    'slug': 'using-cultural-traditions-for-speaking-practice',
                    'category': 'Speaking',
                    'short_description': 'Classroom activities that help students discuss local traditions while practicing useful English expressions and conversation skills.',
                    'level': 'Beginner–Intermediate',
                    'estimated_time': '25–40 minutes',
                    'materials': [
                        'Conversation starter strips',
                        'Sentence frame cards (e.g., "In our family, we usually...", "The most special part is...")'
                    ],
                    'steps': [
                        'Brainstorming (5 mins): Elicit local celebrations, harvests, and gatherings onto the board.',
                        'Sentence Patterns (8 mins): Model question forms (e.g., "How do you celebrate...?", "What foods are prepared?").',
                        'Speed Mingling (15 mins): Students circulate and interview two peers about their favourite custom in English.',
                        'Class Sharing (8 mins): Invite volunteer pairs to summarize their partner\'s answers to the class.'
                    ],
                    'display_order': 2
                },
                {
                    'title': 'From Personal Experience to English Writing',
                    'slug': 'from-personal-experience-to-english-writing',
                    'category': 'Writing',
                    'short_description': 'A step-by-step classroom activity that helps students turn everyday experiences into short descriptive English paragraphs.',
                    'level': 'Intermediate',
                    'estimated_time': '40–50 minutes',
                    'materials': [
                        'Sensory word bank (sight, sound, smell, feel)',
                        'Paragraph template with topic sentence, supporting details, and conclusion'
                    ],
                    'steps': [
                        'Experience Recall (7 mins): Students write down 4 memories of a visit to the local bazaar or rural fields.',
                        'Sensory Mapping (10 mins): Students map English adjectives to describe sounds, smells, and colors from their memory.',
                        'Drafting (15 mins): Guided drafting of a 5-6 sentence descriptive paragraph.',
                        'Peer Review (10 mins): Exchange with a partner to check past tense verbs and punctuation.',
                        'Showcase (8 mins): Wall gallery walk or selected reading aloud.'
                    ],
                    'display_order': 3
                },
                {
                    'title': 'Building Vocabulary from Everyday Life',
                    'slug': 'building-vocabulary-from-everyday-life',
                    'category': 'Vocabulary',
                    'short_description': 'Use familiar places, objects and routines from students\' daily lives to introduce and practice new English vocabulary.',
                    'level': 'Beginner',
                    'estimated_time': '20–30 minutes',
                    'materials': [
                        'Real-life photo cards of Vehari landmarks and daily objects',
                        'Vocabulary matching worksheet'
                    ],
                    'steps': [
                        'Object Flash (5 mins): Show photos of everyday items/landmarks and ask for their English names.',
                        'Concept Check (8 mins): Provide definition matching and example sentences in everyday context.',
                        'Pair Challenge (10 mins): Students compose 3 sentences describing their daily walk or commute using the new words.',
                        'Review (5 mins): Quick exit-ticket quiz.'
                    ],
                    'display_order': 4
                },
                {
                    'title': 'Discussion Activities for Young Learners',
                    'slug': 'discussion-activities-for-young-learners',
                    'category': 'Speaking',
                    'short_description': 'Simple discussion prompts designed to encourage students to express opinions, describe experiences and listen to their classmates.',
                    'level': 'Beginner–Intermediate',
                    'estimated_time': '25–35 minutes',
                    'materials': [
                        'Opinion scale cards (Agree / Disagree)',
                        'Topic prompt cards'
                    ],
                    'steps': [
                        'Icebreaker (5 mins): Model opinion expressions ("In my opinion...", "I prefer... because...").',
                        'Corner Debate (12 mins): Present a simple scenario (e.g., "City life vs. village life in Vehari") and group students.',
                        'Group Discussion (10 mins): Each group formulates 2 reasons supporting their viewpoint in English.',
                        'Synthesis (5 mins): Reflect on vocabulary learned during the friendly exchange.'
                    ],
                    'display_order': 5
                },
                {
                    'title': 'Using Student Voices in the Classroom',
                    'slug': 'using-student-voices-in-the-classroom',
                    'category': 'Student Engagement',
                    'short_description': 'Strategies for making students active participants by using their own stories, opinions and experiences as learning material.',
                    'level': 'Intermediate',
                    'estimated_time': '30–45 minutes',
                    'materials': [
                        'Smartphone voice recorder (or pair speaking format)',
                        'Interview questionnaire worksheet'
                    ],
                    'steps': [
                        'Topic Selection (5 mins): Student pairs decide on a topic (e.g. favourite local dish, sports hero, memory).',
                        'Question Prep (10 mins): Pairs draft 3 open-ended interview questions in English.',
                        'Mock Recording (15 mins): One student acts as host, the other as guest, practicing English interview etiquette.',
                        'Feedback (10 mins): Peers give two compliments and one gentle suggestion for pronunciation.'
                    ],
                    'display_order': 6
                }
            ]
            for art in articles_data:
                article = TeacherGuideArticle(
                    title=art['title'],
                    slug=art['slug'],
                    category=art['category'],
                    short_description=art['short_description'],
                    content=art['short_description'],
                    level=art['level'],
                    estimated_time=art['estimated_time'],
                    author='Voices of Vehari Team',
                    display_order=art['display_order'],
                    is_published=True
                )
                article.set_materials(art['materials'])
                article.set_steps(art['steps'])
                db.session.add(article)
            print("Seeded Teacher Guide Articles")

        # 14. Seed Featured Classroom Activity
        if TeacherGuideActivity.query.count() == 0:
            activity = TeacherGuideActivity(
                title='Tell Your Story',
                purpose='Help students practice speaking and narrative skills by sharing a familiar personal or local experience.',
                estimated_time='35 minutes',
                level='Intermediate',
                teacher_tip='Encourage students to choose experiences from their own community, family, school or daily life.',
                is_published=True
            )
            activity.set_objectives([
                'Practice past tense',
                'Improve speaking confidence',
                'Build descriptive vocabulary',
                'Develop listening skills'
            ])
            activity.set_steps([
                'Choose a familiar experience (family event, visit, trip, or school memory).',
                'Write 5–7 keywords in English related to the event.',
                'Prepare a short 1–2 minute story with a clear beginning, middle, and end.',
                'Share the story with a partner in English.',
                'Ask and answer two follow-up questions with your partner.',
                'Present the story or your partner\'s story to the class.'
            ])
            db.session.add(activity)
            print("Seeded Teacher Guide Activity")

        # 15. Seed Teaching Strategies
        if TeacherGuideStrategy.query.count() == 0:
            strategies_data = [
                ('01', 'Start with Familiar Topics', 'Begin lessons with places, people and experiences students already understand.', '💡', 1),
                ('02', 'Encourage Student Voice', 'Allow students to contribute their own stories and opinions.', '🎙️', 2),
                ('03', 'Use Pair Work', 'Give students opportunities to practice English with classmates before speaking to the whole class.', '👥', 3),
                ('04', 'Teach Vocabulary in Context', 'Introduce new words through meaningful stories and situations rather than isolated lists.', '📚', 4),
                ('05', 'Connect Reading with Speaking', 'After reading a short text, ask students to discuss it with a partner.', '📖', 5),
                ('06', 'Make Writing Personal', 'Let students write about real experiences before moving toward more formal writing tasks.', '✍️', 6)
            ]
            for num, title, desc, icon, order in strategies_data:
                db.session.add(TeacherGuideStrategy(
                    strategy_number=num,
                    title=title,
                    description=desc,
                    icon=icon,
                    display_order=order,
                    is_published=True
                ))
            print("Seeded Teacher Guide Strategies")

        # 16. Seed Classroom Prompts
        if TeacherGuidePrompt.query.count() == 0:
            prompts_data = [
                ('Describe a place in Vehari that is important to you.', 'Local Community', 1),
                ('What tradition does your family enjoy?', 'Culture & Tradition', 2),
                ('Tell your partner about a memorable school day.', 'Personal Experience', 3),
                ('What changes would you like to see in your community?', 'Community & Society', 4),
                ('Describe your daily routine in English.', 'Daily Life', 5),
                ('Tell a short story about someone who inspires you.', 'Inspiration & Values', 6)
            ]
            for prompt_text, cat, order in prompts_data:
                db.session.add(TeacherGuidePrompt(
                    prompt=prompt_text,
                    category=cat,
                    display_order=order,
                    is_published=True
                ))
            print("Seeded Teacher Guide Prompts")

        # 17. Seed Lesson Plan Template
        if TeacherGuideLessonPlan.query.first() is None:
            lp = TeacherGuideLessonPlan(
                title='Simple Lesson Plan Template',
                description='A practical, culturally-responsive lesson structure for classroom English teachers.',
                topic='e.g. Local Harvests & Markets in Vehari',
                learning_objective='e.g. By the end of class, students will be able to describe a market scene using 5 new sensory adjectives.',
                english_skills='Speaking, Vocabulary, Listening, Reading',
                vocabulary='e.g. stall, vendor, barter, fresh, bustling, fragrant',
                warmup_activity='5-minute photo prompt & partner brainstorming of familiar local places',
                main_activity='Contextual reading or listening from Voices of Vehari story archive',
                pair_group_activity='Role-play interview between local vendor and customer in English',
                assessment='Formative observation of peer interaction and 2-minute oral presentation',
                homework='Write a 4-sentence reflection on their favorite family custom in English'
            )
            db.session.add(lp)
            print("Seeded Teacher Guide Lesson Plan Template")

        try:
            db.session.commit()
            print("[SUCCESS] Database seeding successfully completed!")
        except Exception as e:
            db.session.rollback()
            print(f"[INFO] Database seeding skipped or already completed: {e}")

if __name__ == '__main__':
    seed_database()
