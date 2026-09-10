import sys
import os
import traceback

# --- Path setup ---
# Vercel serverless: file is at /var/task/api/index.py
# backend is at /var/task/backend/
_here = os.path.dirname(os.path.abspath(__file__))
_root = os.path.abspath(os.path.join(_here, '..'))
_backend = os.path.join(_root, 'backend')

for _p in [_root, _backend]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from app import create_app
    from seed_data import seed_database

    # Top-level Flask app instance - required by Vercel
    app = create_app()

    # Initialize database and seed data
    try:
        with app.app_context():
            seed_database(app)
    except Exception as seed_err:
        print('[WARNING] Seed deferred:', seed_err)

except Exception as import_err:
    # Expose the real error as a JSON response so we can debug
    from flask import Flask, jsonify
    app = Flask(__name__)
    _tb = traceback.format_exc()
    print('[FATAL IMPORT ERROR]', _tb)

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def _err(path):
        return jsonify({
            'error': 'Import failed',
            'message': str(import_err),
            'traceback': _tb.splitlines(),
            'sys_path': sys.path[:8],
            'cwd': os.getcwd(),
            'here': _here,
            'backend_exists': os.path.isdir(_backend),
        }), 500
