import os
import io
import pytest
from app import create_app
from app.config import Config
from app.extensions import db
from app.models import AdminUser, Podcast, Story, HeroSection, GalleryItem, TeamMember, ContactSubmission

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        # Seed test admin
        admin = AdminUser(username='testadmin', email='testadmin@vehari.edu', full_name='Test Admin')
        admin.set_password('Secret123!')
        db.session.add(admin)

        # Seed sample hero
        hero = HeroSection(title='Voices of Vehari Test Hero', kicker='Test Kicker')
        db.session.add(hero)
        db.session.commit()

        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_token(client):
    res = client.post('/api/auth/login', json={
        'username': 'testadmin',
        'password': 'Secret123!'
    })
    return res.get_json()['token']

# 1. AUTHENTICATION TESTS
def test_login_success(client):
    res = client.post('/api/auth/login', json={
        'username': 'testadmin',
        'password': 'Secret123!'
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'token' in data
    assert data['user']['username'] == 'testadmin'

def test_login_invalid_password(client):
    res = client.post('/api/auth/login', json={
        'username': 'testadmin',
        'password': 'WrongPassword'
    })
    assert res.status_code == 401
    assert res.get_json()['success'] is False

def test_login_nonexistent_user(client):
    res = client.post('/api/auth/login', json={
        'username': 'nonexistent',
        'password': 'Password123'
    })
    assert res.status_code == 401

def test_auth_me_protected(client, auth_token):
    # Without token
    res = client.get('/api/auth/me')
    assert res.status_code == 401

    # With token
    res = client.get('/api/auth/me', headers={'Authorization': f'Bearer {auth_token}'})
    assert res.status_code == 200
    assert res.get_json()['user']['username'] == 'testadmin'

# 2. PUBLIC API TESTS
def test_public_all_content(client):
    res = client.get('/api/public/all')
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'hero' in data['data']
    assert data['data']['hero']['title'] == 'Voices of Vehari Test Hero'

def test_public_contact_submission(client):
    res = client.post('/api/public/contact', json={
        'name': 'Ahmad Khan',
        'email': 'ahmad@example.com',
        'intent': 'Suggest a guest',
        'message': 'I would love to recommend a guest from Burewala.'
    })
    assert res.status_code == 201
    assert res.get_json()['success'] is True

def test_public_contact_validation(client):
    res = client.post('/api/public/contact', json={
        'name': '',
        'email': 'bademail',
        'message': ''
    })
    assert res.status_code == 400
    assert res.get_json()['success'] is False

# 3. ADMIN CRUD & PROTECTED ENDPOINTS
def test_admin_hero_update(client, auth_token):
    # Without token
    res = client.put('/api/admin/hero', json={'title': 'Unauthorized Title'})
    assert res.status_code == 401

    # With token
    res = client.put('/api/admin/hero', headers={'Authorization': f'Bearer {auth_token}'}, json={
        'title': 'New Dynamic Hero Title',
        'kicker': 'Updated Kicker'
    })
    assert res.status_code == 200
    assert res.get_json()['data']['title'] == 'New Dynamic Hero Title'

    # Verify reflected in public API
    public_res = client.get('/api/public/all')
    assert public_res.get_json()['data']['hero']['title'] == 'New Dynamic Hero Title'

def test_admin_podcast_crud(client, auth_token):
    # CREATE
    res = client.post('/api/admin/podcasts', headers={'Authorization': f'Bearer {auth_token}'}, json={
        'title': 'Agricultural Traditions of Mailsi',
        'guest': 'Farmer Union Leader',
        'category': 'culture',
        'description': 'Discussion on cotton belt challenges and heritage.',
        'tags': ['Agriculture', 'Punjabi']
    })
    assert res.status_code == 201
    pod_id = res.get_json()['data']['id']
    assert res.get_json()['data']['title'] == 'Agricultural Traditions of Mailsi'

    # UPDATE
    res = client.put(f'/api/admin/podcasts/{pod_id}', headers={'Authorization': f'Bearer {auth_token}'}, json={
        'title': 'Agricultural Traditions of Mailsi (Updated)'
    })
    assert res.status_code == 200
    assert res.get_json()['data']['title'] == 'Agricultural Traditions of Mailsi (Updated)'

    # TOGGLE PUBLISH
    res = client.patch(f'/api/admin/podcasts/{pod_id}/toggle-publish', headers={'Authorization': f'Bearer {auth_token}'})
    assert res.status_code == 200
    assert res.get_json()['data']['is_published'] is False

    # Should not appear in public active podcasts
    pub_res = client.get('/api/public/podcasts')
    assert not any(p['id'] == pod_id for p in pub_res.get_json()['data'])

    # Toggle back to published
    res = client.patch(f'/api/admin/podcasts/{pod_id}/toggle-publish', headers={'Authorization': f'Bearer {auth_token}'})
    assert res.status_code == 200
    assert res.get_json()['data']['is_published'] is True

    pub_res = client.get('/api/public/podcasts')
    assert any(p['id'] == pod_id for p in pub_res.get_json()['data'])

    # DELETE
    res = client.delete(f'/api/admin/podcasts/{pod_id}', headers={'Authorization': f'Bearer {auth_token}'})
    assert res.status_code == 200

# 4. FILE UPLOAD TEST
def test_file_upload_validation(client, auth_token):
    # Test valid image upload
    data = {
        'file': (io.BytesIO(b"fake image data content"), 'test_image.png'),
        'alt_text': 'Test Alt'
    }
    res = client.post('/api/admin/media/upload', headers={'Authorization': f'Bearer {auth_token}'},
                       data=data, content_type='multipart/form-data')
    assert res.status_code == 201
    assert res.get_json()['success'] is True
    assert 'public_url' in res.get_json()['data']

    # Test invalid file type (e.g. .exe)
    bad_data = {
        'file': (io.BytesIO(b"bad content"), 'virus.exe')
    }
    bad_res = client.post('/api/admin/media/upload', headers={'Authorization': f'Bearer {auth_token}'},
                          data=bad_data, content_type='multipart/form-data')
    assert bad_res.status_code == 400
    assert bad_res.get_json()['success'] is False

# 5. TEACHER GUIDE PUBLIC & ADMIN TESTS
def test_teacher_guide_public_and_admin(client, auth_token):
    # Admin: Create new Teacher Guide Article
    create_res = client.post('/api/admin/teacher-guide/articles', headers={'Authorization': f'Bearer {auth_token}'}, json={
        'title': 'Test Pedagogical Storytelling Guide',
        'category': 'Speaking',
        'short_description': 'Guide on teaching through storytelling.',
        'content': 'Comprehensive instructions for teachers.',
        'materials': ['Cue cards', 'Audio clips'],
        'steps': ['Step 1: Introduction', 'Step 2: Practice'],
        'level': 'Beginner',
        'estimated_time': '30 mins'
    })
    assert create_res.status_code == 201
    art_id = create_res.get_json()['data']['id']
    assert create_res.get_json()['data']['title'] == 'Test Pedagogical Storytelling Guide'

    # Check public all contains teacherGuide and the created article
    res = client.get('/api/public/all')
    assert res.status_code == 200
    tg = res.get_json()['data']['teacherGuide']
    assert 'resources' in tg
    assert len(tg['resources']) > 0
    assert tg['resources'][0]['id'] == art_id

    # Standalone public endpoint
    tg_res = client.get('/api/public/teacher-guide')
    assert tg_res.status_code == 200
    assert len(tg_res.get_json()['data']['resources']) > 0

    # Admin: Update Article
    update_res = client.put(f'/api/admin/teacher-guide/articles/{art_id}', headers={'Authorization': f'Bearer {auth_token}'}, json={
        'title': 'Test Pedagogical Storytelling Guide (Updated)'
    })
    assert update_res.status_code == 200
    assert update_res.get_json()['data']['title'] == 'Test Pedagogical Storytelling Guide (Updated)'

    # Admin: Toggle Publish
    toggle_res = client.patch(f'/api/admin/teacher-guide/articles/{art_id}/toggle-publish', headers={'Authorization': f'Bearer {auth_token}'})
    assert toggle_res.status_code == 200
    assert toggle_res.get_json()['data']['is_published'] is False

    # After toggling off publish, it should not appear in public active resources
    tg_res2 = client.get('/api/public/teacher-guide')
    assert not any(r['id'] == art_id for r in tg_res2.get_json()['data']['resources'])

    # Admin: Delete Article
    del_res = client.delete(f'/api/admin/teacher-guide/articles/{art_id}', headers={'Authorization': f'Bearer {auth_token}'})
    assert del_res.status_code == 200

    # Admin: Test Lesson Plan template update
    lp_res = client.put('/api/admin/teacher-guide/lesson-plan', headers={'Authorization': f'Bearer {auth_token}'}, json={
        'topic': 'Updated Topic For Testing'
    })
    assert lp_res.status_code == 200
    assert lp_res.get_json()['data']['topic'] == 'Updated Topic For Testing'
