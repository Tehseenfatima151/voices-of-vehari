import sys
import os

# --- Path setup (Vercel: /var/task/api/index.py, backend at /var/task/backend) ---
_here = os.path.dirname(os.path.abspath(__file__))
_root = os.path.abspath(os.path.join(_here, '..'))
_backend = os.path.join(_root, 'backend')

for _p in [_root, _backend]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from app import create_app
from seed_data import seed_database

# Top-level Flask app assignment - MUST be at module level for Vercel to detect it
app = create_app()

# Seed database (idempotent - safe to run on every cold start)
try:
    with app.app_context():
        seed_database(app)
except Exception as _seed_err:
    print('[WARNING] Seed deferred:', _seed_err)
