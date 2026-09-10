import os
from app import create_app
from seed_data import seed_database

app = create_app()

# Initialize database tables and seed initial content
# Runs both when imported by Gunicorn (gunicorn run:app) and when executed directly
try:
    with app.app_context():
        seed_database(app)
except Exception as e:
    print(f"[WARNING] Database initialization deferred: {e}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    print(f"Starting Voices of Vehari Backend API on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
