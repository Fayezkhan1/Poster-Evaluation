import pytesseract
import cv2
import re
import requests
import os

def check_link(url):
    if not url.startswith(('http://', 'https://')):
        url = 'http://' + url
    try:
        response = requests.head(url, allow_redirects=True, timeout=5)
        return response.status_code >= 200 and response.status_code < 400
    except requests.exceptions.RequestException:
        return False

def evaluate_hyperlinks(poster):
    tesseract_path = os.getenv("TESSERACT_CMD", r'C:\dev\tesseract\tesseract.exe')
    pytesseract.pytesseract.tesseract_cmd = tesseract_path
    
    image = cv2.imread(poster)
    if image is None:
        return None
        
    data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)

    url_pattern = r'\b(?:[a-zA-Z0-9-]+\.)+(com|edu|org|net|gov|mil|info|biz|co|io|ai|tech|me|us|uk|ca|in|pdf)\b'
    detected_links = []

    for i in range(len(data['text'])):
        word = data['text'][i]
        if re.search(url_pattern, word):
            link_status = "valid" if check_link(word) else "invalid"
            detected_links.append({
                'url': word, 
                'status': link_status
            })

    return detected_links if detected_links else None

