import cv2
import numpy as np

def get_relative_luminance(color):
    """Calculate relative luminance according to WCAG 2.1."""
    # Color is in RGB [0, 255]
    rgb = np.array(color) / 255.0
    # Convert to linear RGB
    linear_rgb = np.where(rgb <= 0.03928, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    # Calculate luminance
    return 0.2126 * linear_rgb[0] + 0.7152 * linear_rgb[1] + 0.0722 * linear_rgb[2]

def calculate_contrast_ratio(color1, color2):
    """Calculate contrast ratio between two RGB colors."""
    l1 = get_relative_luminance(color1)
    l2 = get_relative_luminance(color2)
    
    lighter = max(l1, l2)
    darker = min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)

def analyze_contrast(image_path):
    """Analyze text and background colors in an image crop."""
    try:
        img = cv2.imread(image_path)
        if img is None or img.size == 0:
            return None
            
        # Convert BGR to RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Flatten pixels and convert to float32 for OpenCV K-Means
        pixels = img.reshape((-1, 3)).astype(np.float32)
        
        # If the image is extremely small or has only one color, handle gracefully
        if pixels.shape[0] < 2:
            return None
            
        # Check if there are at least 2 unique colors
        unique_colors = np.unique(pixels, axis=0)
        if len(unique_colors) < 2:
            # If only one color, contrast is 1:1
            color = unique_colors[0].tolist()
            return {
                "text_color": color,
                "bg_color": color,
                "contrast_ratio": 1.0,
                "wcag_status": "Fail",
                "details": {
                    "AA_normal": False, "AA_large": False,
                    "AAA_normal": False, "AAA_large": False
                }
            }

        # Define criteria and run K-Means
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        k = 2
        ret, label, center = cv2.kmeans(pixels, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
        
        # Get centers as integers
        colors = center.astype(int)
        
        # Count pixels for each color to identify background
        counts = np.bincount(label.flatten())
        
        # Assume background is the more dominant color
        bg_idx = np.argmax(counts)
        text_idx = 1 - bg_idx
        
        bg_color = colors[bg_idx].tolist()
        text_color = colors[text_idx].tolist()
        
        ratio = calculate_contrast_ratio(bg_color, text_color)
        
        def get_wcag_status(r):
            status = {
                "AA_normal": bool(r >= 4.5),
                "AA_large": bool(r >= 3.0),
                "AAA_normal": bool(r >= 7.0),
                "AAA_large": bool(r >= 4.5)
            }
            
            if r >= 7.0:
                summary = "AAA"
            elif r >= 4.5:
                summary = "AA"
            elif r >= 3.0:
                summary = "Large Text Only"
            else:
                summary = "Fail"
                
            return status, summary

        wcag_details, summary = get_wcag_status(ratio)
        
        return {
            "text_color": text_color,
            "bg_color": bg_color,
            "contrast_ratio": float(round(ratio, 2)),
            "wcag_status": summary,
            "details": wcag_details
        }
    except Exception as e:
        print(f"Contrast Analysis Error: {e}")
        return None

