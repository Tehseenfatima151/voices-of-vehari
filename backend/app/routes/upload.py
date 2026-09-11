import os
import traceback
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.media_file import MediaFile
from app.utils.file_helpers import save_uploaded_file

upload_bp = Blueprint('upload', __name__, url_prefix='/api/admin/media')

@upload_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file part in request'}), 400

        file = request.files['file']
        alt_text = request.form.get('alt_text', '')

        file_info, error = save_uploaded_file(file)
        if error:
            return jsonify({'success': False, 'message': error}), 400

        media_entry = MediaFile(
            filename=file_info['filename'],
            original_name=file_info['original_name'],
            file_type=file_info['file_type'],
            mime_type=file.content_type,
            file_size=file_info['file_size'],
            file_path=file_info['file_path'],
            public_url=file_info['public_url'],
            alt_text=alt_text or file_info['original_name']
        )
        db.session.add(media_entry)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'data': media_entry.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        err_msg = str(e)
        print('[UPLOAD ERROR]', traceback.format_exc())
        return jsonify({'success': False, 'message': f'Upload error: {err_msg}'}), 500

@upload_bp.route('/', methods=['GET'])
@jwt_required()
def list_media():
    file_type = request.args.get('type')
    query = MediaFile.query
    if file_type:
        query = query.filter_by(file_type=file_type)
    files = query.order_by(MediaFile.created_at.desc()).all()
    return jsonify({
        'success': True,
        'data': [f.to_dict() for f in files]
    }), 200

@upload_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_media(id):
    media = db.session.get(MediaFile, id)
    if not media:
        return jsonify({'success': False, 'message': 'Media file not found'}), 404

    try:
        if os.path.exists(media.file_path):
            os.remove(media.file_path)
    except OSError:
        pass

    db.session.delete(media)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Media file deleted'}), 200