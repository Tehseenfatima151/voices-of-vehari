import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import create_app
from seed_data import seed_database

# Top-level Flask app instance required by Vercel
app = create_app()

# Initialize database tables and initial seed data
try:
    with app.app_context():
        seed_database(app)
except Exception as e:
    print(f'[WARNING] Database initialization deferred: {e}')
