import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from utils.hyperlink import evaluateLink
from utils.poster_layout import PosterComponentExtractor
from utils.color_contrast import evaluateColorContrast
from utils.image_resolution import evaluate_image_accessibility
from utils.config import AccessibilityReport

app = Flask(__name__)
CORS(app)

def clear_directory(directory_path):
    if os.path.exists(directory_path):
        for filename in os.listdir(directory_path):
            file_path = os.path.join(directory_path, filename)
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Error: {e}")

def evaluatePoster(poster_path):
    images_to_be_cleared = [
        r'utils\Output\color_contrast.png',
        r"utils\Output\extracted_components.png",
        r"utils\Output/annotated_image.png",
        r'utils\Output/annotated_links.png'
    ]
    directories_to_be_cleared = [
        r'utils\Buffer\image_resolution',
        r"utils\Buffer\components",
        r"utils\Buffer\labelled_components"
    ]

    for image in images_to_be_cleared:
        if os.path.exists(image):
            os.remove(image)
    for directory in directories_to_be_cleared:
        if os.path.exists(directory):
            for filename in os.listdir(directory):
                file_path = os.path.join(directory, filename)
                os.remove(file_path)

    color_contrast_results = evaluateColorContrast(poster_path)
    image_accessibility_results = evaluate_image_accessibility(poster_path)
    link_results = evaluateLink(poster_path)
    extractor = PosterComponentExtractor(poster_path)
    extractor.extractComponents()
    poster_components = extractor.get_report()
    results = {}

    if color_contrast_results:
        results['color_contrast'] = {
            'sections': color_contrast_results['sections']
        }
    if image_accessibility_results:
        results['image_accessibility'] = image_accessibility_results
    if link_results:
        results['links'] = link_results
    if poster_components:
        results['poster_components'] = poster_components

    return results

@app.route("/evaluate", methods=["POST"])
def evaluate():
    clear_directory(r"utils/Input")
    poster = request.files["poster"]
    file_path = os.path.join("utils/Input", poster.filename)
    poster.save(file_path)
    result = evaluatePoster(file_path)
    return jsonify(result), 200

@app.route("/color-contrast")
def get_color_contrast_image():
    return send_file(r'utils/Output/color_contrast.png', mimetype="image/png")

@app.route("/poster-components")
def get_components_image():
    return send_file(r'utils/Output/extracted_components.png', mimetype="image/png")

if __name__ == "__main__":
    clear_directory(r"utils/Input")
    app.run(debug=True, port=5000)
