import os
import shutil
import uuid
import tempfile
import threading
import time
from flask import Flask, request, jsonify, send_file, abort
from werkzeug.utils import secure_filename
from conversion.conversion_matrix import CONVERSION_MATRIX
from conversion import converters
from utils.zip_utils import zip_files
from utils.security import generate_token, verify_token
from utils.clean_up import schedule_cleanup

app = Flask(__name__)

UPLOAD_DIR = "temp_uploads"
CONVERTED_DIR = "converted"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CONVERTED_DIR, exist_ok=True)

# Cleanup: delete files older than 30 min
CLEANUP_INTERVAL = 60 * 30  # seconds

def get_ext(filename):
    return filename.rsplit('.', 1)[-1].lower()

def allowed_file(filename):
    return '.' in filename and get_ext(filename) in CONVERSION_MATRIX

def common_outputs(exts):
    sets = [set(CONVERSION_MATRIX.get(e, [])) for e in exts]
    return list(set.intersection(*sets)) if sets else []

@app.route('/api/upload', methods=['POST'])
def upload():
    files = request.files.getlist('files[]')
    if not files:
        return jsonify({'error': 'No files uploaded'}), 400
    exts = []
    temp_files = []
    for file in files:
        if not allowed_file(file.filename):
            return jsonify({'error': f'Filetype not allowed: {file.filename}'}), 400
        ext = get_ext(file.filename)
        exts.append(ext)
        temp_name = f"{uuid.uuid4().hex}.{ext}"
        temp_path = os.path.join(UPLOAD_DIR, temp_name)
        file.save(temp_path)
        temp_files.append({'name': file.filename, 'path': temp_path, 'ext': ext})
    suggested = common_outputs(exts) if len(set(exts)) > 1 else CONVERSION_MATRIX[exts[0]]
    # Store session in token
    token = generate_token({
        "files": [f['path'] for f in temp_files],
        "original_names": [f['name'] for f in temp_files]
    })
    # Schedule deletion
    schedule_cleanup(temp_files, CLEANUP_INTERVAL)
    return jsonify({
        "token": token,
        "original_names": [f['name'] for f in temp_files],
        "extensions": exts,
        "suggested_outputs": suggested
    })

@app.route('/api/convert', methods=['POST'])
def convert():
    data = request.json
    token = data.get('token')
    out_ext = data.get('output_ext')
    token_data = verify_token(token)
    if not token_data:
        return jsonify({"error": "Invalid session"}), 403
    file_paths = token_data['files']
    orig_names = token_data['original_names']
    output_paths = []
    for i, in_path in enumerate(file_paths):
        in_ext = get_ext(orig_names[i])
        converter = converters.get_converter(in_ext, out_ext)
        if not converter:
            return jsonify({"error": f"Conversion {in_ext} to {out_ext} not supported."}), 400
        out_name = os.path.splitext(orig_names[i])[0] + '.' + out_ext
        out_path = os.path.join(CONVERTED_DIR, f"{uuid.uuid4().hex}_{secure_filename(out_name)}")
        try:
            converter(in_path, out_path)
            output_paths.append({"name": out_name, "path": out_path})
        except Exception as e:
            return jsonify({"error": f"Conversion failed: {str(e)}"}), 500
    # Single file: direct download, else zip
    if len(output_paths) == 1:
        out_token = generate_token({"file": output_paths[0]['path'], "name": output_paths[0]["name"]})
        schedule_cleanup([output_paths[0]], CLEANUP_INTERVAL)
        return jsonify({"download_url": f"/api/download/{out_token}", "file_name": output_paths[0]["name"]})
    else:
        # Zip all
        zip_name = f"{uuid.uuid4().hex}_converted.zip"
        zip_path = os.path.join(CONVERTED_DIR, zip_name)
        zip_files([f["path"] for f in output_paths], zip_path, [f["name"] for f in output_paths])
        out_token = generate_token({"file": zip_path, "name": zip_name})
        schedule_cleanup([{"path": zip_path}], CLEANUP_INTERVAL)
        return jsonify({"download_url": f"/api/download/{out_token}", "file_name": zip_name})

@app.route('/api/download/<token>', methods=['GET'])
def download(token):
    data = verify_token(token)
    if not data or not os.path.exists(data["file"]):
        abort(404)
    return send_file(data["file"], as_attachment=True, download_name=data["name"])

if __name__ == '__main__':
    app.run(debug=True)