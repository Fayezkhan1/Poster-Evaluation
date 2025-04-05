const backToUpload = document.getElementById('backToUpload');

// Go back to Upload Page
backToUpload.addEventListener('click', () => {
    window.location.href = 'index.html';
});

document.addEventListener('DOMContentLoaded', () => {
    // Get the analysis data from sessionStorage
    const analysisData = JSON.parse(sessionStorage.getItem('analysisData'));
    if (!analysisData) {
        window.location.href = 'index.html';
        return;
    }

    // Update filename if available
    const fileName = document.getElementById('fileName');
    const originalFileName = sessionStorage.getItem('originalFileName');
    if (originalFileName) {
        fileName.textContent = originalFileName;
    }

    // Display the image if available
    const uploadedImage = document.getElementById('uploadedImage');
    
    // Check which type of image data we received
    if (analysisData.annotated_image) {
        uploadedImage.src = `data:image/png;base64,${analysisData.annotated_image}`;
    } else if (analysisData.color_contrast && analysisData.color_contrast.annotated_image) {
        uploadedImage.src = `data:image/png;base64,${analysisData.color_contrast.annotated_image}`;
    } else {
        // If no annotated image, try to get the original image
        const originalImage = sessionStorage.getItem('originalImage');
        if (originalImage) {
            uploadedImage.src = originalImage;
        } else {
            console.error('No image data available');
            uploadedImage.alt = 'Image data not available';
        }
    }

    // Log the data we received for debugging
    console.log('Received analysis data:', analysisData);

    // Display color contrast metrics
    const contrastMetrics = document.getElementById('contrastMetrics');
    const contrastHtml = analysisData.color_contrast.map(contrast => `
        <p>Section ${contrast.section}:</p>
        <ul>
            <li>Accessibility: ${contrast.accessibility}</li>
            <li>Contrast Ratio: ${contrast.contrast_ratio.toFixed(2)}</li>
        </ul>
    `).join('');
    contrastMetrics.innerHTML = contrastHtml;

    // Display image accessibility metrics
    const imageMetrics = document.getElementById('imageMetrics');
    const imgAccessibility = analysisData.image_accessibility;
    imageMetrics.innerHTML = `
        <ul>
            <li>Status: ${imgAccessibility.Accessible ? 'Accessible' : 'Not Accessible'}</li>
            <li>DPI: ${imgAccessibility.DPI}</li>
            <li>Resolution: ${imgAccessibility.Resolution[0]} x ${imgAccessibility.Resolution[1]}</li>
            <li>PSNR: ${imgAccessibility.PSNR.toFixed(2)}</li>
        </ul>
    `;

    // Display links metrics
    const linkMetrics = document.getElementById('linkMetrics');
    const linksHtml = analysisData.links.map(link => `
        <p>${link.link}: <span style="color: ${link.status === 'working' ? 'green' : 'red'}">${link.status}</span></p>
    `).join('');
    linkMetrics.innerHTML = linksHtml || 'No links found';

    // Display poster components metrics
    const componentMetrics = document.getElementById('componentMetrics');
    const components = analysisData.poster_components;
    componentMetrics.innerHTML = `
        <ul>
            <li>Authors: ${components.Authors.join(', ')}</li>
            <li>Captions: ${components.Caption_Count}</li>
            <li>Complex Logos: ${components.Complex_Logo_Count}</li>
            <li>Simple Logos: ${components.Simple_Logo_Count}</li>
            <li>Diagrams: ${components.Diagram_Count}</li>
            <li>Figures: ${components.Figure_Count}</li>
        </ul>
    `;
});
