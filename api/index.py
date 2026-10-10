import sys
import os

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app import create_app
from seed_data import seed_database

app = create_app()

class VercelPathFixMiddleware:
    """
    On Vercel, serverless function rewrites may set environ['PATH_INFO']
    to the destination filename (e.g. '/api/index.py' or '/api').
    This middleware restores the original request URI so Flask matches routes correctly.
    """
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        path_info = environ.get('PATH_INFO', '')
        if path_info in ('/api/index.py', '/api', '/api/', '/api/index'):
            req_uri = (
                environ.get('REQUEST_URI') or
                environ.get('HTTP_X_MATCHED_PATH') or
                environ.get('HTTP_X_FORWARDED_URI') or
                environ.get('RAW_URI') or
                ''
            )
            if req_uri:
                clean_path = req_uri.split('?')[0]
                if clean_path and clean_path not in ('/api/index.py', '/api/index'):
                    environ['PATH_INFO'] = clean_path

        current_path = environ.get('PATH_INFO', '')
        # If the path does not start with /api (e.g. /public/all or /admin/podcasts), prepend /api
        if current_path.startswith('/public/') or current_path.startswith('/admin/') or current_path.startswith('/auth/') or current_path.startswith('/upload/'):
            environ['PATH_INFO'] = '/api' + current_path

        return self.wsgi_app(environ, start_response)

app.wsgi_app = VercelPathFixMiddleware(app.wsgi_app)

@app.route('/')
@app.route('/api')
@app.route('/api/')
def vercel_root_ping():
    return {'status': 'healthy', 'message': 'Voices of Vehari API is live'}, 200

@app.route('/api/health')
def vercel_api_health():
    return {'status': 'healthy', 'app': 'Voices of Vehari Backend API'}, 200

try:
    with app.app_context():
        seed_database(app)
except Exception as e:
    print("[INIT DB DEFERRED]", e)
