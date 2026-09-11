import os
from flask import Flask, jsonify, send_from_directory
from app.config import Config
from app.extensions import db, jwt, cors
from app.routes import auth_bp, public_bp, admin_cms_bp, upload_bp

def create_app(config_class=Config):
    # Determine frontend build dist directory inside backend
    dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))

    app = Flask(__name__, static_folder=dist_dir, static_url_path="")
    app.config.from_object(config_class)

    # Ensure uploads directory exists
    try:
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    except OSError:
        pass

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}},
        supports_credentials=True
    )

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(public_bp)
    app.register_blueprint(admin_cms_bp)
    app.register_blueprint(upload_bp)

    # JWT Error handlers
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({
            'success': False,
            'message': 'Missing or invalid authentication token. Please log in.'
        }), 401

    @jwt.expired_token_loader
    def expired_token_response(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'Authentication token has expired. Please log in again.'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({
            'success': False,
            'message': 'Signature verification failed or token is malformed.'
        }), 401

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

    @app.route('/health')
    def health_check():
        return jsonify({'status': 'healthy', 'app': 'Voices of Vehari Backend API'}), 200

    # Serve React frontend for any non-API route
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path.startswith('api/') or path == 'health':
            return jsonify({'success': False, 'message': 'Resource not found'}), 404
            
        # If file exists in dist (e.g. assets, favicon, etc.), serve it
        target = os.path.join(dist_dir, path)
        if path and os.path.exists(target) and os.path.isfile(target):
            return send_from_directory(dist_dir, path)
            
        # Otherwise fallback to index.html for client-side routing
        index_file = os.path.join(dist_dir, 'index.html')
        if os.path.exists(index_file):
            return send_from_directory(dist_dir, 'index.html')
            
        return jsonify({'success': False, 'message': 'Frontend index.html not found'}), 404

    return app