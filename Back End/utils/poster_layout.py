import cv2
import spacy
from doclayout_yolo import YOLOv10
import pandas as pd
import warnings
import pytesseract
from PIL import Image
from ultralytics import YOLO
import numpy as np
import math
import base64

warnings.filterwarnings("ignore", category=FutureWarning)

class PosterComponentExtractor:
    def __init__(self, poster_path):
            self.poster_path = poster_path
            self.authors = []
            self.author_coords = []
            self.complex_logo_count = 0
            self.simple_logo_count = 0
            self.figure_count = 0
            self.diagram_count = 0
            self.caption_count = 0
            self.annotated_image = None
            self.title_coords = {}

            self.base_model = YOLOv10(r"utils\Models\base.pt")
            self.figure_model = YOLO(r'utils\Models\figure_classifier.pt')
            self.logo_model = YOLO(r"utils\Models\logo_classifier.pt")

            self.components = ['title', 'plain text', 'abandon', 'figure', 'figure_caption', 
                            'table', 'table_caption', 'table_footnote', 'isolate_formula', 'formula_caption']
            self.captions = ['table_caption', 'table_footnote', 'figure_caption']

            pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

    def count_words(self, input_string):
        words = input_string.split()
        return len(words)

    def count_persons(self, text):
        nlp = spacy.load("en_core_web_sm")
        count = 0
        doc = nlp(text)
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                self.authors.append(ent.text)
                count += 1
        return count

    def isAuthorSection(self, image_path):
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
        word_count = self.count_words(text)
        if word_count >= 25:
            return False
        if word_count < 25 and self.count_persons(text) >= 1:
            return True
        return False

    def process_component(self, index, x1, y1, x2, y2, cropped_image, component_count):
        component_type = self.components[index]
        handlers = {
            'plain text': self.handle_plain_text,
            'title': self.handle_title,
            'figure': self.handle_figure,
            'abandon': self.handle_figure,
            'table': self.handle_table,
            'table_caption': self.handle_caption,
            'table_footnote': self.handle_caption,
            'figure_caption': self.handle_caption
        }
        handler = handlers.get(component_type, self.handle_unknown)
        handler(x1, y1, x2, y2, cropped_image, component_count, component_type)

    def handle_plain_text(self, x1, y1, x2, y2, cropped_image, component_count, component_type):
        filename = f"utils/Buffer/components/{component_count}_{component_type}.jpg"
        cv2.imwrite(filename, cropped_image)

        if self.isAuthorSection(filename):
            text = pytesseract.image_to_string(cropped_image).strip()
            if text:
                self.author_coords.append((x1, y1, x2, y2, text))

        cv2.rectangle(self.annotated_image, (x1, y1), (x2, y2), (0, 0, 0), 2)
        cv2.putText(self.annotated_image, "Plain Text", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)

    def finalize_authors(self):
        if not self.author_coords or not self.title_coords:
            return

        max_index = max(self.title_coords, key=lambda k: (self.title_coords[k][2] - self.title_coords[k][0]) * (self.title_coords[k][3] - self.title_coords[k][1]))
        title_x1, title_y1, title_x2, title_y2, _ = self.title_coords[max_index]

        title_x, title_y = (title_x1 + title_x2) // 2, (title_y1 + title_y2) // 2

        closest_author = None
        min_distance = float("inf")

        for coords in self.author_coords:
            x1, y1, x2, y2, text = coords
            x, y = (x1 + x2) // 2, (y1 + y2) // 2
            distance = math.sqrt((x - title_x) ** 2 + (y - title_y) ** 2)

            if distance < min_distance:
                min_distance = distance
                closest_author = coords

        if closest_author and min_distance < 300:
            x1, y1, x2, y2, text = closest_author
            self.authors.append(text)
            cv2.rectangle(self.annotated_image, (x1, y1), (x2, y2), (255, 0, 0), 2)
            cv2.putText(self.annotated_image, "Authors", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
            
    def handle_title(self, x1, y1, x2, y2, cropped_image, component_count, component_type):
        filename = f"utils/Buffer/components/{component_count}_{component_type}.jpg"
        cv2.imwrite(filename, cropped_image)

        title_area = abs((y2 - y1) * (x2 - x1))
        self.title_coords[component_count] = (x1, y1, x2, y2, title_area)

        cv2.rectangle(self.annotated_image, (x1, y1), (x2, y2), (0, 255, 255), 2)
        cv2.putText(self.annotated_image, "Title", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)

    def finalize_titles(self):
        if self.title_coords:
            max_index = max(self.title_coords, key=lambda k: self.title_coords[k][4])
            max_title = self.title_coords[max_index]

            x1, y1, x2, y2, _ = max_title
            cv2.rectangle(self.annotated_image, (x1, y1), (x2, y2), (255, 0, 255), 2)
            cv2.putText(self.annotated_image, "Main Title", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 255), 2)

            for idx, (x1, y1, x2, y2, _) in self.title_coords.items():
                if idx != max_index:
                    cv2.rectangle(self.annotated_image, (x1, y1), (x2, y2), (0, 165, 255), 2)
                    cv2.putText(self.annotated_image, "Heading", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 165, 255), 2)

    def handle_figure(self, x1, y1, x2, y2, cropped_image, component_count, component_type):
        filename = f"utils/Buffer/components/{component_count}_{component_type}.jpg"
        cv2.imwrite(filename, cropped_image)

        figure_type = self.figure_model(filename, verbose=False)
        figure_name = figure_type[0].names[np.argmax(figure_type[0].probs.data.tolist())]

        figure_area = abs((y2 - y1) * (x2 - x1))

        if figure_name == "Logo":
            if figure_area >= 34000:
                self.diagram_count += 1
                cv2.rectangle(self.annotated_image, (x1, y1), (x2, y2), (255, 255, 0), 2)
                cv2.putText(self.annotated_image, "Diagram", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 0), 2)
            else:
                logo_type = self.logo_model(filename, verbose=False)
                logo_name = logo_type[0].names[np.argmax(logo_type[0].probs.data.tolist())]

                if logo_name == 'Simple':
                    self.simple_logo_count += 1
                    color, label = (0, 255, 0), "Simple Logo"
                    cv2.imwrite(f"utils/Buffer/labelled_components/{component_count}_simple_logo.jpg", cropped_image)
                else:
                    self.complex_logo_count += 1
                    color, label = (255, 0, 0), "Complex Logo"
                    cv2.imwrite(f"utils/Buffer/labelled_components/{component_count}_complex_logo.jpg", cropped_image)

                cv2.rectangle(self.annotated_image, (x1, y1), (x2, y2), color, 2)
                cv2.putText(self.annotated_image, label, (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

        elif figure_name in ['Pie Chart', 'Bar Graphs', 'Line graph']:
            self.figure_count += 1
            cv2.rectangle(self.annotated_image, (x1, y1), (x2, y2), (0, 0, 255), 2)
            cv2.putText(self.annotated_image, figure_name, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        else:
            self.diagram_count += 1
            cv2.rectangle(self.annotated_image, (x1, y1), (x2, y2), (255, 255, 0), 2)
            cv2.putText(self.annotated_image, "Diagram", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 0), 2)

    def handle_table(self, x1, y1, x2, y2, cropped_image, component_count, component_type):
        self.figure_count += 1
        cv2.rectangle(self.annotated_image, (x1, y1), (x2, y2), (255, 0, 255), 2)
        cv2.putText(self.annotated_image, "Table", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 255), 2)

    def handle_caption(self, x1, y1, x2, y2, cropped_image, component_count, component_type):
        self.caption_count += 1
        cv2.rectangle(self.annotated_image, (x1, y1), (x2, y2), (0, 128, 128), 2)
        cv2.putText(self.annotated_image, "Caption", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 128, 128), 2)

    def handle_unknown(self, x1, y1, x2, y2, cropped_image, component_count, component_type):
        cv2.rectangle(self.annotated_image, (x1, y1), (x2, y2), (128, 128, 128), 2)
        cv2.putText(self.annotated_image, "Unknown", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (128, 128, 128), 2)

    def extractComponents(self):
        image = cv2.imread(self.poster_path)
        self.annotated_image = image.copy()

        result = self.base_model.predict(
            self.poster_path,
            imgsz=1024,
            conf=0.2,
            device="cuda:0",
            verbose=False
        )

        boxes = result[0].boxes.data.cpu()
        component_count = 0

        for row in boxes:
            x1, y1, x2, y2, conf, index = map(int, row[:6])
            cropped_image = image[y1:y2, x1:x2]
            self.process_component(index, x1, y1, x2, y2, cropped_image, component_count)
            component_count += 1
        self.finalize_titles()
        self.finalize_authors()
        cv2.imwrite('utils/Output/extracted_components.png', self.annotated_image)

    def get_report(self):
        return {
            "Authors": list(set(self.authors)),
            "Simple Logo Count": self.simple_logo_count,
            "Complex Logo Count": self.complex_logo_count,
            "Figure Count": self.figure_count,
            "Diagram Count": self.diagram_count,
            "Caption Count": self.caption_count
        }

if __name__ == "__main__":
    poster_path = r"utils\Input\1.png"
    extractor = PosterComponentExtractor(poster_path)
    extractor.extractComponents()
    report = extractor.get_report()
    print("\n📊 Extraction Report:")
    for key, value in report.items():
        print(f"{key}: {value}")
    
