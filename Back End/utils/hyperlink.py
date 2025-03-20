import pytesseract
import cv2
import re
import requests

def check_link(url):
    if not url.startswith(('http://', 'https://')):
        url = 'http://' + url
    try:
        response = requests.head(url, allow_redirects=True, timeout=5)
        return response.status_code >= 200 and response.status_code < 400
    except requests.exceptions.RequestException:
        return False

def evaluateLink(poster):
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    image = cv2.imread(poster)
    data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)

    url_pattern = r'\b(?:[a-zA-Z0-9-]+\.)+(com|edu|org|net|gov|mil|info|biz|co|io|ai|tech|me|us|uk|ca|in|pdf)\b'
    detected_links = []

    for i in range(len(data['text'])):
        word = data['text'][i]
        if re.search(url_pattern, word):
            link_status = "working" if check_link(word) else "broken"
            detected_links.append({'link': word, 'status': link_status})
            (x, y, w, h) = (data['left'][i], data['top'][i], data['width'][i], data['height'][i])
            cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 17), 2)
            cv2.putText(image, link_status, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 17), 1)


    cv2.imwrite(r"utils/Output/annotated_links.png", image)

    return detected_links

if __name__ == "__main__":
    poster = r'Input\205.png'
    links = evaluateLink(poster)
    print("\n✅ Detected Links:")
    for idx, link_info in enumerate(links, start=1):
        print(f"Link {idx}: {link_info['link']} - {link_info['status']}")
