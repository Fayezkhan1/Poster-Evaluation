document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOM Loaded");
  
    const uploadBox = document.getElementById('uploadBox');
    const chooseFileBtn = document.getElementById('chooseFileBtn');
    const fileInput = document.getElementById('fileInput');
    const progressContainer = document.getElementById('progressContainer');
    const fileNameDisplay = document.getElementById('fileName');
    const analyzeBtnContainer = document.getElementById('analyzeBtnContainer');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBar = document.getElementById('progressBar');
  
    let currentFile = null;
  
    chooseFileBtn?.addEventListener('click', () => fileInput?.click());
  
    uploadBox?.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.style.backgroundColor = '#e0f7ff';
    });
  
    uploadBox?.addEventListener('dragleave', () => {
        uploadBox.style.backgroundColor = 'transparent';
    });
  
    uploadBox?.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.style.backgroundColor = 'transparent';
        if (e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
  
    fileInput?.addEventListener('change', () => {
        if (fileInput.files[0]) {
            handleFileUpload(fileInput.files[0]);
        }
    });
  
    function handleFileUpload(file) {
        currentFile = file;
        if (fileNameDisplay) fileNameDisplay.textContent = file.name;
  
        sessionStorage.setItem('originalFileName', file.name);
  
        const reader = new FileReader();
        reader.onload = function (e) {
            sessionStorage.setItem('originalImage', e.target.result);
        };
        reader.readAsDataURL(file);
  
        uploadBox.style.display = 'none';
        progressContainer.style.display = 'flex';
        progressBarContainer.style.display = 'block';
        analyzeBtnContainer.style.display = 'none';
  
        progressBar.style.width = '0%';
        progressBar.style.transition = 'width 2s ease-in-out';
  
        setTimeout(() => {
            progressBar.style.width = '100%';
  
            setTimeout(() => {
                progressBarContainer.style.display = 'none';
                analyzeBtnContainer.style.display = 'block';
            }, 2000);
        }, 100);
    }
  
    analyzeBtn?.addEventListener('click', async () => {
        if (!currentFile) {
            alert('Please upload a file first');
            return;
        }
  
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';
  
        try {
            const formData = new FormData();
            formData.append('poster', currentFile);

            console.log('Sending file to API:', currentFile.name);
            console.log('File size:', currentFile.size);

            // First, send the poster for evaluation
            const response = await fetch('http://localhost:5000/evaluate', {
                method: 'POST',
                body: formData
            });
            
            console.log('API Response status:', response.status);
            console.log('API Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error response:', errorText);
                throw new Error(`Failed to analyze image: ${response.status} ${errorText}`);
            }
            
            const result = await response.json();
            console.log('API Response data:', result);

            // Transform the data to match our expected format
            const analysisData = {
                "Simple Logo Count": result.poster_components["Simple Logo Count"] || 0,
                "Complex Logo Count": result.poster_components["Complex Logo Count"] || 0,
                "Diagram Count": result.poster_components["Diagram Count"] || 0,
                "Caption Count": result.poster_components["Caption Count"] || 0,
                "color_contrast": result.color_contrast || {},
                "image_accessibility": result.image_accessibility || {},
                "Authors": result.poster_components.Authors || [],
                "Figure Count": result.poster_components["Figure Count"] || 0,
                "links": result.links || []
            };

            console.log('Transformed analysis data:', analysisData);

            // Store the analysis data in sessionStorage
            sessionStorage.setItem('analysisData', JSON.stringify(analysisData));

            // Don't try to update DOM elements here since we're about to redirect
            console.log("✅ Redirecting to analysis.html...");
            window.location.href = 'analysis.html';
        } catch (error) {
            console.error('❌ Error during analysis:', error);
            alert('Error analyzing file. Please try again.');
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'Analyze';
        }
    });
  
    // ✅ Handle Widget Click for Contrast Analysis (Now Considering All Sections)
    if (window.location.pathname.includes('analysis.html')) {
        console.log("✅ Analysis Page Loaded");
  
        setTimeout(() => {
            const widget = document.getElementById('widget');
  
            if (widget) {
                console.log("✅ Widget detected, adding event listener...");
                widget.addEventListener('click', () => {
                  console.log("✅ Widget clicked, navigating to contrast_analysis.html...");
              
                  // ✅ Retrieve contrast data dynamically
                  const analysisData = JSON.parse(sessionStorage.getItem('analysisData'));
              
                  if (!analysisData || !analysisData.color_contrast || !analysisData.color_contrast.sections) {
                      console.error("❌ Contrast data missing in sessionStorage!");
                      alert("Contrast data is missing. Please re-analyze the file.");
                      return;
                  }
              
                  // ✅ Store ALL sections dynamically
                  const contrastSummary = {
                      "annotated_image": analysisData.color_contrast.annotated_image || "default_contrast.png",
                      "lowest_contrast": analysisData.color_contrast.sections.reduce((min, sec) => Math.min(min, sec.contrast_ratio), Infinity).toFixed(2),
                      "highest_contrast": analysisData.color_contrast.sections.reduce((max, sec) => Math.max(max, sec.contrast_ratio), -Infinity).toFixed(2),
                      "average_contrast": (analysisData.color_contrast.sections.reduce((sum, sec) => sum + sec.contrast_ratio, 0) / analysisData.color_contrast.sections.length).toFixed(2),
                      "pass_count": analysisData.color_contrast.sections.filter(sec => sec.accessibility !== "Fail").length,
                      "fail_count": analysisData.color_contrast.sections.filter(sec => sec.accessibility === "Fail").length,
                      "total_sections": analysisData.color_contrast.sections.length,
                      "sections": analysisData.color_contrast.sections // ✅ Store the sections array
                  };
              
                  // ✅ Store in sessionStorage
                  sessionStorage.setItem('contrastImagePath', contrastSummary.annotated_image);
                  sessionStorage.setItem('contrastData', JSON.stringify(contrastSummary));
              
                  // ✅ Navigate to contrast analysis page
                  window.location.href = 'contrast_analysis.html';
              });
              
            } else {
                console.error("❌ Widget not found!");
            }

            // Resolution widget
            const resolutionWidget = document.getElementById('resolutionWidget');
            if (resolutionWidget) {
                console.log("✅ Resolution widget detected, adding event listener...");
                resolutionWidget.addEventListener('click', () => {
                    console.log("✅ Resolution widget clicked, navigating to color_resolution.html...");
              
                    // ✅ Retrieve resolution data dynamically
                    const analysisData = JSON.parse(sessionStorage.getItem('analysisData'));
              
                    if (!analysisData || !analysisData.image_accessibility) {
                        console.error("❌ Resolution data missing in sessionStorage!");
                        alert("Resolution data is missing. Please re-analyze the file.");
                        return;
                    }
              
                    // ✅ Store resolution data with the same pattern as contrast
                    const resolutionSummary = {
                        "dpi": analysisData.image_accessibility.dpi || 0,
                        "psnr": analysisData.image_accessibility.psnr || 0,
                        "laplacian": analysisData.image_accessibility.laplacian || 0,
                        "resolution": [
                            analysisData.image_accessibility.width || 0,
                            analysisData.image_accessibility.height || 0
                        ],
                        "is_accessible": analysisData.image_accessibility.is_accessible || false,
                        "resolution_image": analysisData.image_accessibility.resolution_image || "default_resolution.png"
                    };
              
                    // ✅ Store in sessionStorage (following contrast pattern)
                    sessionStorage.setItem('resolutionImagePath', resolutionSummary.resolution_image);
                    sessionStorage.setItem('resolutionData', JSON.stringify(resolutionSummary));
              
                    // ✅ Navigate to resolution analysis page
                    window.location.href = 'color_resolution.html';
                });
            } else {
                console.error("❌ Resolution widget not found!");
            }
        }, 500); // Ensures the DOM is ready
    }
    
    const linksWidget = document.getElementById("linksWidget");
  
    if (linksWidget) {
        linksWidget.addEventListener("click", () => {
            console.log("✅ Links Widget Clicked!");
  
            // ✅ Retrieve and Store Links Data
            const analysisData = JSON.parse(sessionStorage.getItem('analysisData'));
  
            if (!analysisData || !analysisData.links) {
                console.error("❌ No links data found!");
                alert("No links data available.");
                return;
            }
  
            sessionStorage.setItem('linksData', JSON.stringify(analysisData.links));
  
            // ✅ Navigate to Links Analysis Page
            console.log("✅ Redirecting to links_analysis.html...");
            window.location.href = "links_analysis.html";
        });
  
        // ✅ Update Links Count
        const linksData = JSON.parse(sessionStorage.getItem('analysisData'))?.links;
        if (linksData) {
            document.getElementById("linksCount").innerText = linksData.length;
        }
    }
    const complexWidget = document.getElementById("complexWidget");
  
if (complexWidget) {
    complexWidget.addEventListener("click", () => {  // ✅ Corrected the variable name
        console.log("✅ Complex Widget Clicked!");
  
        // ✅ Retrieve and Store Complex Logo Count Data
        const analysisData = JSON.parse(sessionStorage.getItem('analysisData'));
  
        if (!analysisData || !analysisData.poster_components) {
            console.error("❌ No complex logo data found!");
            alert("No complex logo data available.");
            return;
        }
  
        sessionStorage.setItem('Complex_Logo_Count', JSON.stringify(analysisData.poster_components.Complex_Logo_Count));
  
        // ✅ Navigate to Complex Logo Analysis Page
        console.log("✅ Redirecting to complex_logo_analysis.html...");
        window.location.href = "complex_logo_analysis.html";
    });
  
    // ✅ Update Complex Logo Count Display
    const complexLogoCount = JSON.parse(sessionStorage.getItem('analysisData'))?.poster_components?.Complex_Logo_Count;
    if (complexLogoCount !== undefined) {
        document.getElementById("Complex_Logo_Count").innerText = complexLogoCount;
    } else {
        document.getElementById("Complex_Logo_Count").innerText = "N/A";
    }
}
  
const simpleLogoCount = JSON.parse(sessionStorage.getItem('analysisData'))?.poster_components?.Simple_Logo_Count;
if (simpleLogoCount !== undefined) {
    document.getElementById("Simple").innerText = simpleLogoCount;
} else {
    document.getElementById("Simple").innerText = "N/A";
}
  
const diagramCount = JSON.parse(sessionStorage.getItem('analysisData'))?.poster_components?.Diagram_Count;
if (diagramCount !== undefined) {
    document.getElementById("diagram").innerText = diagramCount;
} else {
    document.getElementById("diagram").innerText = "N/A";
}
  
const captionCount = JSON.parse(sessionStorage.getItem('analysisData'))?.poster_components?.Caption_Count;
if (captionCount !== undefined) {
    document.getElementById("caption").innerText = captionCount;
} else {
    document.getElementById("caption").innerText = "N/A";
}
});
  