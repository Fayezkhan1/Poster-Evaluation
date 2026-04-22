import cv2
from skimage.metrics import peak_signal_noise_ratio
from PIL import Image


def evaluate_resolution(image_path):
    MIN_WIDTH = 1024
    MIN_HEIGHT = 768
    
    with Image.open(image_path) as img:
        width, height = img.size
        
    is_accessible = width >= MIN_WIDTH and height >= MIN_HEIGHT
    
    return {
        "width": width,
        "height": height,
        "threshold": f"{MIN_WIDTH}x{MIN_HEIGHT}",
        "status": "Pass" if is_accessible else "Fail"
    }