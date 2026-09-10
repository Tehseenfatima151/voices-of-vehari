import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def get_file_type(filename):
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    if ext in current_app.config['ALLOWED_IMAGE_EXTENSIONS']:
        return 'image'
    elif ext in current_app.config['ALLOWED_AUDIO_EXTENSIONS']:
        return 'audio'
    return 'document'

def save_uploaded_file(file_obj, subfolder=''):
    if not file_obj or file_obj.filename == '':
        return None, 'No file provided'

    filename = secure_filename(file_obj.filename)
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    allowed = current_app.config['ALLOWED_IMAGE_EXTENSIONS'].union(
        current_app.config['ALLOWED_AUDIO_EXTENSIONS']
    )
    if not allowed_file(filename, allowed):
        return None, f"File type .{ext} not allowed. Supported: {', '.join(allowed)}"

    target_dir = current_app.config['UPLOAD_FOLDER']
    if subfolder:
        target_dir = os.path.join(target_dir, subfolder)
    os.makedirs(target_dir, exist_ok=True)

    # Unique filename to prevent overwrite
    unique_name = f"{uuid.uuid4().hex[:10]}_{filename}"
    file_path = os.path.join(target_dir, unique_name)
    file_obj.save(file_path)

    file_size = os.path.getsize(file_path)
    file_type = get_file_type(filename)
    public_url = f"/api/uploads/{unique_name}"

    return {
        'filename': unique_name,
        'original_name': filename,
        'file_type': file_type,
        'file_size': file_size,
        'file_path': file_path,
        'public_url': public_url
    }, None
