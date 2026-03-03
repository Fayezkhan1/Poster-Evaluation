class AccessibilityReport:
    def __init__(self):
        self.color_contrast = {}

    def add_color_contrast(self, section_number, contrast_ratio, accessibility_level):
        """
        Adds color contrast data for a specific section.
        """
        self.color_contrast[section_number] = (contrast_ratio, accessibility_level)

    def get_color_contrast(self):
        """
        Returns the color contrast dictionary.
        """
        return self.color_contrast

    def add_image_resolution(self, psnr, laplacian_variance, resolution, dpi, accessible):
        """
        Adds image resolution evaluation results.
        """
        self.image_resolution = {
            'PSNR': psnr,
            'Laplacian Variance': laplacian_variance,
            'Resolution': resolution,
            'DPI': dpi,
            'Accessible': accessible
        }

    def get_image_resolution(self):
        return self.image_resolution
    
    def add_links(self, links):
        self.links = links

    def get_links(self):
        return self.links

    def __repr__(self):
        return f"AccessibilityReport(color_contrast={self.color_contrast})"
