import os
import shutil
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from image_resolution import evaluate_resolution
from hyperlink import evaluate_hyperlinks
from poster_layout import extract_layout_components

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'temp_uploads')

def init_upload_folder():
    if os.path.exists(UPLOAD_FOLDER):
        shutil.rmtree(UPLOAD_FOLDER)
    os.makedirs(UPLOAD_FOLDER)

init_upload_folder()

@app.route('/temp_uploads/<filename>')
def serve_temp_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/evaluate', methods=['POST'])
def evaluate_poster():
    if 'image' not in request.files:
        return jsonify({"error": "No image part"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Clear temp folder for the new request
    init_upload_folder()

    # Save file temporarily
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        # Evaluate Poster
        resolution_results = evaluate_resolution(file_path)
        hyperlink_results = evaluate_hyperlinks(file_path)
        # 3. Extract layout components and get annotated image
        components, annotated_image_url = extract_layout_components(file_path, UPLOAD_FOLDER)
        
        return jsonify({
            "resolution": resolution_results,
            "hyperlinks": hyperlink_results,
            "components": components,
            "annotated_image_url": annotated_image_url
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
