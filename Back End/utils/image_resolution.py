import cv2
from skimage.metrics import peak_signal_noise_ratio
from PIL import Image
import os

def load_image(image_path):
    return cv2.imread(image_path)

def calculate_psnr(image1, image2):
    psnr_value = peak_signal_noise_ratio(image1, image2)
    return psnr_value

def calculate_laplacian_variance(image):
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray_image, cv2.CV_64F).var()
    return laplacian_var

def get_image_resolution_and_dpi(image_path):
    with Image.open(image_path) as img:
        width, height = img.size
        dpi = img.info.get('dpi', (72, 72))
    return width, height, dpi
def save_grayscale_image(image, output_path):
    
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    cv2.imwrite(output_path, gray_image)
    return gray_image
def generate_reference_image(image, output_path):
    enhanced_image = cv2.GaussianBlur(image, (5, 5), 0)
    enhanced_image = cv2.addWeighted(image, 1.5, enhanced_image, -0.5, 0)
    cv2.imwrite(output_path, enhanced_image)
    return enhanced_image

def evaluate_image_accessibility(image_path, reference_image_path=None):
    image = load_image(image_path)
    psnr_threshold = 30
    ssim_threshold = 0.8
    laplacian_variance_threshold = 100
    min_resolution = (800, 600)
    min_dpi = 72
    grayscale_image_path = r"utils/Buffer\image_resolution\grayscale_image.jpg"
    os.makedirs(os.path.dirname(grayscale_image_path), exist_ok=True)
    save_grayscale_image(image, grayscale_image_path)

    if reference_image_path:
        reference_image = load_image(reference_image_path)
        psnr_value = calculate_psnr(reference_image, image)
    else:
        reference_image_path = r"utils/Buffer\image_resolution\high_quality_reference.jpg"
        os.makedirs(os.path.dirname(reference_image_path), exist_ok=True)
        reference_image = generate_reference_image(image, reference_image_path)
        psnr_value = calculate_psnr(reference_image, image)

    laplacian_variance = calculate_laplacian_variance(image)
    width, height, dpi = get_image_resolution_and_dpi(image_path)

    accessible = True
    failure_count = 0

    if psnr_value is not None and psnr_value < psnr_threshold:
        failure_count += 1

    if laplacian_variance < laplacian_variance_threshold:
        failure_count += 1

    if (width, height) < min_resolution:
        failure_count += 1

    if dpi[0] < min_dpi:
        failure_count += 1

    max_failures_allowed = 2
    accessible = failure_count <= max_failures_allowed
    
    evaluation_result = {
        'PSNR': psnr_value,
        'Laplacian Variance': laplacian_variance,
        'Resolution': (width, height),
        'DPI': dpi[0],
        'Accessible': accessible
    }

    return evaluation_result


if __name__ == "__main__":
    image_path = r"Input\205.png"
    evaluate_image_accessibility(image_path)




