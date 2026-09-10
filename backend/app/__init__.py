import os
from flask import Flask, jsonify
from app.config import Config
from app.extensions import db, jwt, cors
from app.routes import auth_bp, public_bp, admin_cms_bp, upload_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Ensure uploads directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

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

    # Generic Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'message': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

    @app.route('/health')
    def health_check():
        return jsonify({'status': 'healthy', 'app': 'Voices of Vehari Backend API'}), 200

    return app
