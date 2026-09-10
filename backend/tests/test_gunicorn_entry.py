import os
import pytest
from app.models.user import AdminUser

def test_gunicorn_import_and_wsgi():
    """Verify that run.app can be imported Gunicorn-style and serves as WSGI callable."""
    import run
    app = getattr(run, "app", None)
    assert app is not None, "app object not found in run.py"
    assert callable(app), "app is not callable"
    assert callable(app.wsgi_app), "app.wsgi_app is not a valid WSGI callable"

def test_health_check_via_gunicorn_app():
    """Verify that /health works as expected via the Gunicorn entry point."""
    import run
    client = run.app.test_client()
    res = client.get("/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert data["app"] == "Voices of Vehari Backend API"

def test_seed_and_no_duplicate_admin():
    """Verify that database is seeded and duplicate admin users are not created."""
    import run
    with run.app.app_context():
        # Call seed again to verify idempotency
        from seed_data import seed_database
        seed_database(run.app)

        admin_count = AdminUser.query.filter_by(username="admin").count()
        assert admin_count == 1, f"Expected 1 admin, found {admin_count}"

def test_gunicorn_conf_port_handling():
    """Verify that gunicorn.conf.py reads Render's PORT environment variable."""
    conf_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "gunicorn.conf.py"))
    assert os.path.exists(conf_path), "gunicorn.conf.py must exist"

    # Test with custom PORT (e.g. Render default 10000)
    os.environ["PORT"] = "10000"
    conf_globals = {}
    with open(conf_path, "r", encoding="utf-8") as f:
        exec(f.read(), conf_globals)
    assert conf_globals.get("bind") == "0.0.0.0:10000"

    # Test with default fallback PORT
    if "PORT" in os.environ:
        del os.environ["PORT"]
    conf_globals = {}
    with open(conf_path, "r", encoding="utf-8") as f:
        exec(f.read(), conf_globals)
    assert conf_globals.get("bind") == "0.0.0.0:5000"
