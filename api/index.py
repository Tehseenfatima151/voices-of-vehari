import sys
import os

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app import create_app
from seed_data import seed_database

app = create_app()

try:
    with app.app_context():
        seed_database(app)
except Exception as e:
    print("[INIT DB DEFERRED]", e)
