import sys
import os
import traceback

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from run import app
except Exception as e:
    from flask import Flask, jsonify
    app = Flask(__name__)
    tb = traceback.format_exc()
    print(f'[FATAL STARTUP ERROR] {tb}')

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def error_handler(path):
        return jsonify({
            'success': False,
            'error': 'Serverless Function Startup Error',
            'details': str(e),
            'traceback': tb.splitlines()
        }), 500
