from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import AdminUser

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = data.get('username') or data.get('email')
    password = data.get('password')

    if not identifier or not password:
        return jsonify({'success': False, 'message': 'Username/Email and password are required'}), 400

    user = AdminUser.query.filter(
        (AdminUser.username == identifier) | (AdminUser.email == identifier)
    ).first()

    if not user or not user.check_password(password):
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

    if not user.is_active:
        return jsonify({'success': False, 'message': 'Account is inactive. Contact system administrator.'}), 403

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = db.session.get(AdminUser, int(user_id))
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    return jsonify({
        'success': True,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = db.session.get(AdminUser, int(user_id))
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    data = request.get_json() or {}
    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'email' in data:
        existing = AdminUser.query.filter(AdminUser.email == data['email'], AdminUser.id != user.id).first()
        if existing:
            return jsonify({'success': False, 'message': 'Email already in use'}), 400
        user.email = data['email']
    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
        user.set_password(data['password'])

    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200
