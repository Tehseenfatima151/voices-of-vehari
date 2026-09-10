import os
from app import create_app
from seed_data import seed_database

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        # Ensure database tables and initial seed exist on startup
        seed_database()
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    print(f"Starting Voices of Vehari Backend API on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
