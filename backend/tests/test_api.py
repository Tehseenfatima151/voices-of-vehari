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
