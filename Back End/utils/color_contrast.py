import cv2
import numpy as np
from PIL import Image
import os
import base64

def contrast_ratio(rgb1, rgb2):
    
    def luminance(rgb):
        r, g, b = rgb
        r = r / 255
        g = g / 255
        b = b / 255

        def adjust(c):
            return 0.03928 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

        return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b)

    l1 = luminance(rgb1)
    l2 = luminance(rgb2)

    return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)

def hex_to_rgb(hex_color):
    
    hex_color = hex_color.strip("#")
    return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))

def evaluate_accessibility(contrast_ratio):
    
    if contrast_ratio >= 7:
        return "AAA"
    elif contrast_ratio >= 4.5:
        return "AA"
    else:
        return "Fail"

def get_dominant_color(image):
   
    pixels = np.array(image)
    pixels = pixels.reshape(-1, 3)  

   
    mean_color = pixels.mean(axis=0)
    return tuple(map(int, mean_color))

def extract_text_color(region):
    
    text_color_pixels = []
    mask = np.zeros(region.shape[:2], dtype=np.uint8)
    gray = cv2.cvtColor(region, cv2.COLOR_RGB2GRAY)
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)

    
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for contour in contours:
        cv2.drawContours(mask, [contour], -1, 255, -1)
        masked_image = cv2.bitwise_and(region, region, mask=mask)
        dominant_color = get_dominant_color(masked_image)
        text_color_pixels.append(dominant_color)

    
    return tuple(np.mean(text_color_pixels, axis=0).astype(int)) if text_color_pixels else (0, 0, 0)

def extract_sections(image_path):
    
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

    
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

   
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)

    
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

    
    contours, _ = cv2.findContours(morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    sections = []
    for contour in contours:
        
        if cv2.contourArea(contour) > 500:  
            x, y, w, h = cv2.boundingRect(contour)
            section = image[y:y + h, x:x + w]  
            sections.append((section, (x, y, w, h)))

    return sections

def overlay_results(image_path, results):
    # Read image if it doesn't exist yet
    if not os.path.exists(r'utils/Output/color_contrast.png'):
        image = cv2.imread(image_path)
    else:
        image = cv2.imread(r'utils/Output/color_contrast.png')

    for result in results:
        section = result['section']
        contrast_ratio_value = result['contrast_ratio']
        accessibility = result['accessibility']
        x, y, w, h = result['bbox']
        
        cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        
        text = f"Section {section}: {contrast_ratio_value:.2f} ({accessibility})"
        cv2.putText(image, text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1, cv2.LINE_AA)

    output_image_path = r'utils/Output/color_contrast.png'
    cv2.imwrite(output_image_path, image)

def image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    return encoded_string

def evaluateColorContrast(image_path):
    image = Image.open(image_path)

    background_color = get_dominant_color(np.array(image))
   
    sections = extract_sections(image_path)
   
    results = []
    for i, (section, bbox) in enumerate(sections):
        text_color = extract_text_color(section)
        ratio = contrast_ratio(text_color, background_color)
        accessibility = evaluate_accessibility(ratio)

        result = {
            'section': i + 1,
            'contrast_ratio': ratio,
            'accessibility': accessibility
        }
        results.append(result)
        
        result_with_bbox = result.copy()
        result_with_bbox['bbox'] = bbox
        overlay_results(image_path, [result_with_bbox])
    
    return {
        'sections': results
    }


if __name__ == "__main__":
    image_path = r'Input\205.png'  
    evaluateColorContrast(image_path)