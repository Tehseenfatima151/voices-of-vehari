import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import create_app
from app.extensions import db

sys.stdout.reconfigure(encoding='utf-8')

def run_e2e_verification():
    app = create_app()
    client = app.test_client()

    print("==================================================")
    print("STARTING COMPLETE END-TO-END VERIFICATION FLOW")
    print("==================================================")

    # 1. ADMIN LOGIN
    print("\n[STEP 1] Testing Admin Login...")
    login_res = client.post('/api/auth/login', json={
        'username': 'admin',
        'password': 'AdminPassword2026!'
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.data}"
    token = login_res.get_json()['token']
    auth_headers = {'Authorization': f'Bearer {token}'}
    print("[PASS] Admin successfully authenticated. JWT token acquired.")

    # 2. UPDATE HOME HERO TITLE
    print("\n[STEP 2] Admin updates Home Hero title...")
    updated_title = "Voices of Vehari - Stories That Shape Our Community"
    hero_res = client.put('/api/admin/hero', headers=auth_headers, json={
        'title': updated_title,
        'kicker': 'Community Research Initiative 2026'
    })
    assert hero_res.status_code == 200, f"Hero update failed: {hero_res.data}"
    print(f"[PASS] Hero updated in database to: '{updated_title}'")

    # 3. VERIFY PUBLIC WEBSITE RECEIVES UPDATED HERO TITLE
    print("\n[STEP 3] Verifying public endpoint GET /api/public/all reflects updated Hero...")
    pub_res = client.get('/api/public/all')
    assert pub_res.status_code == 200
    pub_hero = pub_res.get_json()['data']['hero']
    assert pub_hero['title'] == updated_title, f"Public hero did not update! Got: {pub_hero['title']}"
    print(f"[PASS] Public website successfully returned updated hero title: '{pub_hero['title']}'")

    # 4. ADMIN ADDS A PODCAST
    print("\n[STEP 4] Admin creates a new podcast episode...")
    new_podcast_title = "Echoes of Burewala - Agricultural Legacies"
    pod_res = client.post('/api/admin/podcasts', headers=auth_headers, json={
        'title': new_podcast_title,
        'guest': 'Chaudhry Riaz Ahmad',
        'host': 'Abdullah',
        'category': 'culture',
        'description': 'Exploring agricultural stories and irrigation folklore of rural Vehari.',
        'tags': ['Agriculture', 'Folklore', 'Punjabi'],
        'audio_url': 'https://example.com/audio/burewala_legacies.mp3',
        'is_published': True
    })
    assert pod_res.status_code == 201
    pod_id = pod_res.get_json()['data']['id']
    print(f"[PASS] Created podcast episode ID: {pod_id}")

    # 5. VERIFY PUBLIC PODCASTS CONTAINS NEW EPISODE
    print("\n[STEP 5] Verifying public endpoint GET /api/public/podcasts contains new episode...")
    pub_pod_res = client.get('/api/public/podcasts')
    assert pub_pod_res.status_code == 200
    all_pods = pub_pod_res.get_json()['data']
    matching_pod = next((p for p in all_pods if p['id'] == pod_id), None)
    assert matching_pod is not None, "New podcast not found on public website!"
    assert matching_pod['title'] == new_podcast_title
    print(f"[PASS] Public website lists new podcast: '{matching_pod['title']}'")

    # 6. ADMIN ADDS A STORY
    print("\n[STEP 6] Admin adds a new cultural story...")
    new_story_title = "The Ancient Weavers of Peer Murad"
    story_res = client.post('/api/admin/stories', headers=auth_headers, json={
        'title': new_story_title,
        'category_tag': 'Customs',
        'excerpt': 'A tribute to the generational textile craftspersons along the canal distributaries.',
        'content': 'Full story content documenting historic techniques and English learning vocabulary.',
        'author': 'Vehari Heritage Circle',
        'is_published': True
    })
    assert story_res.status_code == 201
    story_id = story_res.get_json()['data']['id']
    print(f"[PASS] Created story ID: {story_id}")

    # 7. VERIFY PUBLIC STORIES CONTAINS NEW STORY
    print("\n[STEP 7] Verifying public endpoint GET /api/public/stories contains new story...")
    pub_story_res = client.get('/api/public/stories')
    assert pub_story_res.status_code == 200
    all_stories = pub_story_res.get_json()['data']
    matching_story = next((s for s in all_stories if s['id'] == story_id), None)
    assert matching_story is not None, "New story not found on public website!"
    print(f"[PASS] Public website displays new story: '{matching_story['title']}'")

    # 8. ADMIN ADDS A GALLERY PHOTO
    print("\n[STEP 8] Admin adds a new gallery photo...")
    gallery_res = client.post('/api/admin/gallery', headers=auth_headers, json={
        'title': 'Bilingual Mentorship Workshop 2026',
        'caption': 'Undergraduate mentors testing bilingual discussion prompts in Vehari.',
        'category': 'university',
        'image_url': '/api/uploads/gallery_recording.jpeg',
        'alt_text': 'Students discussing in group circle'
    })
    assert gallery_res.status_code == 201
    gallery_id = gallery_res.get_json()['data']['id']
    print(f"[PASS] Added gallery item ID: {gallery_id}")

    # 9. VERIFY PUBLIC GALLERY CONTAINS PHOTO
    print("\n[STEP 9] Verifying public endpoint GET /api/public/gallery contains photo...")
    pub_gal_res = client.get('/api/public/gallery')
    assert pub_gal_res.status_code == 200
    all_gal = pub_gal_res.get_json()['data']
    matching_item = next((g for g in all_gal if g['id'] == gallery_id), None)
    assert matching_item is not None, "New gallery item not found on public website!"
    print(f"[PASS] Public website displays new photo: '{matching_item['title']}'")

    # 10. ADMIN ADDS A TEAM MEMBER
    print("\n[STEP 10] Admin adds a new team member...")
    team_res = client.post('/api/admin/team', headers=auth_headers, json={
        'name': 'Prof. Dr. Zainab Tariq',
        'role_category': 'leadership',
        'designation': 'External Advisory Board Member',
        'initials': 'ZT',
        'bio': 'Linguistics professor specializing in South Asian plurilingualism.'
    })
    assert team_res.status_code == 201
    member_id = team_res.get_json()['data']['id']
    print(f"[PASS] Added team member ID: {member_id}")

    # 11. VERIFY PUBLIC TEAM CONTAINS MEMBER
    print("\n[STEP 11] Verifying public endpoint GET /api/public/team contains new member...")
    pub_team_res = client.get('/api/public/team')
    assert pub_team_res.status_code == 200
    all_team = pub_team_res.get_json()['data']
    matching_member = next((m for m in all_team if m['id'] == member_id), None)
    assert matching_member is not None, "New team member not found on public website!"
    print(f"[PASS] Public website displays new team member: '{matching_member['name']}' ({matching_member['designation']})")

    # 12. PUBLIC USER SUBMITS CONTACT FORM INQUIRY
    print("\n[STEP 12] Public user submits contact inquiry from the website...")
    contact_res = client.post('/api/public/contact', json={
        'name': 'Samina Parveen',
        'email': 'samina@example.org',
        'intent': 'Suggest a topic',
        'message': 'Can you do an episode on rural women handcrafting ralli quilts in Vehari?'
    })
    assert contact_res.status_code == 201, f"Contact submission failed: {contact_res.data}"
    print("[PASS] Public user submitted inquiry successfully.")

    # 13. ADMIN CHECKS SUBMISSIONS
    print("\n[STEP 13] Admin checks inbox via GET /api/admin/submissions...")
    sub_res = client.get('/api/admin/submissions', headers=auth_headers)
    assert sub_res.status_code == 200
    all_subs = sub_res.get_json()['data']
    matching_sub = next((s for s in all_subs if s['name'] == 'Samina Parveen'), None)
    assert matching_sub is not None, "Contact submission not found in admin inbox!"
    assert matching_sub['status'] == 'unread'
    print(f"[PASS] Admin found user submission in inbox: '{matching_sub['message'][:50]}...'")

    # 14. ADMIN MARKS INQUIRY AS READ
    patch_res = client.patch(f"/api/admin/submissions/{matching_sub['id']}/status", headers=auth_headers, json={'status': 'read'})
    assert patch_res.status_code == 200
    assert patch_res.get_json()['data']['status'] == 'read'
    print("[PASS] Admin updated message status to 'read'.")

    # 15. CLEAN UP TEST ITEMS AND RESTORE HERO TITLE TO PRISTINE ORIGINAL
    print("\n[STEP 15] Cleaning up test items and restoring original Hero title...")
    client.put('/api/admin/hero', headers=auth_headers, json={
        'title': 'Voices of Vehari',
        'kicker': 'A research & community storytelling initiative'
    })
    client.delete(f'/api/admin/podcasts/{pod_id}', headers=auth_headers)
    client.delete(f'/api/admin/stories/{story_id}', headers=auth_headers)
    client.delete(f'/api/admin/gallery/{gallery_id}', headers=auth_headers)
    client.delete(f'/api/admin/team/{member_id}', headers=auth_headers)
    client.delete(f"/api/admin/submissions/{matching_sub['id']}", headers=auth_headers)

    # Verify hero restored
    verify_hero = client.get('/api/public/all').get_json()['data']['hero']
    assert verify_hero['title'] == 'Voices of Vehari'
    print("[PASS] Hero title successfully restored to: 'Voices of Vehari'")

    print("\n==================================================")
    print("ALL END-TO-END CMS VERIFICATION TESTS PASSED (100% SUCCESS)")
    print("==================================================")

if __name__ == '__main__':
    run_e2e_verification()
