import os
import cv2
import torch
from doclayout_yolo import YOLOv10
from color_contrast import analyze_contrast
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

CLASSES = [
    'title', 'plain_text', 'abandon', 'figure', 'figure_caption', 
    'table', 'table_caption', 'table_footnote', 'isolate_formula', 'formula_caption'
]

TEXTUAL_CLASSES = [
    'title', 'plain_text', 'figure_caption', 'table_caption', 
    'table_footnote', 'isolate_formula', 'formula_caption'
]

def classify_figure_with_gemini(image_path):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Unknown Figure"
        
    try:
        client = genai.Client(api_key=api_key)
        with open(image_path, "rb") as f:
            image_bytes = f.read()
            
        prompt = "What type of figure is this? (e.g., Bar Graph, Line Chart, Pie Chart, Diagram, Photograph, Logo). Return only the short category name."
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt, types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")],
        )
        return response.text.strip()
    except Exception as e:
        print(f"Gemini error: {e}")
        return "Unknown Figure"

def link_captions(components):
    figures = [c for c in components if c['type'] == 'figure']
    captions = [c for c in components if c['type'] == 'figure_caption']
    
    for fig in figures:
        fig_box = fig['box']
        fig['has_caption'] = False
        
        for cap in captions:
            cap_box = cap['box']
            vertical_dist = cap_box[1] - fig_box[3]
            # Caption should be just below the figure (allow up to 200px gap)
            is_below = -50 <= vertical_dist <= 200
            
            overlap_x = max(0, min(fig_box[2], cap_box[2]) - max(fig_box[0], cap_box[0]))
            is_overlapping = overlap_x > 0
            
            if is_below and is_overlapping:
                fig['has_caption'] = True
                break
    return components

def extract_layout_components(image_path, output_dir):
    model_path = os.path.join(os.path.dirname(__file__), "base.pt")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"YOLO model not found at {model_path}")
    
    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    model = YOLOv10(model_path)
    
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("Could not read image for layout extraction.")
        
    result = model.predict(image_path, imgsz=1024, conf=0.2, device=device, verbose=False)
    boxes = result[0].boxes.data.cpu()

    # Generate and save annotated image
    annotated_img = result[0].plot(labels=False, probs=False)
    annotated_filename = "annotated_poster.jpg"
    annotated_filepath = os.path.join(output_dir, annotated_filename)
    cv2.imwrite(annotated_filepath, annotated_img)
    annotated_url = f"http://localhost:5000/temp_uploads/{annotated_filename}"
    
    counts = {cls: 0 for cls in CLASSES}
    components = []
    
    for row in boxes:
        x1, y1, x2, y2, conf, index = map(int, row[:6])
        if index < len(CLASSES):
            cls_name = CLASSES[index]
        else:
            cls_name = "unknown"
            
        if cls_name == "plain text":
            cls_name = "plain_text"
            
        counts[cls_name] = counts.get(cls_name, 0) + 1
        count = counts[cls_name]
        
        y1, y2 = max(0, y1), min(image.shape[0], y2)
        x1, x2 = max(0, x1), min(image.shape[1], x2)
        cropped = image[y1:y2, x1:x2]
        
        if cropped.size == 0:
            continue
            
        filename = f"{cls_name}_{count}.jpg"
        filepath = os.path.join(output_dir, filename)
        cv2.imwrite(filepath, cropped)
        
        comp_info = {
            "type": cls_name,
            "filename": filename,
            "url": f"http://localhost:5000/temp_uploads/{filename}",
            "box": [x1, y1, x2, y2],
            "confidence": float(row[4])
        }

        if cls_name in TEXTUAL_CLASSES:
            contrast_data = analyze_contrast(filepath)
            if contrast_data:
                comp_info["contrast"] = contrast_data
                
        if cls_name == "figure":
            comp_info["figure_type"] = classify_figure_with_gemini(filepath)
        
        components.append(comp_info)
        
    # Link captions before returning
    components = link_captions(components)
    return components, annotated_url


