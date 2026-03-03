import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Upload.css'

function Upload() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showAnalyze, setShowAnalyze] = useState(false)
  const navigate = useNavigate()

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile)
    setProgress(0)
    setShowAnalyze(false)
    
    // Simulate upload progress
    setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setShowAnalyze(true)
      }, 500)
    }, 100)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleAnalyze = async () => {
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('poster', file)

      const response = await fetch('http://localhost:5000/evaluate', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze: ${response.status}`)
      }

      const result = await response.json()
      
      const analysisData = {
        "Simple Logo Count": result.poster_components?.["Simple Logo Count"] || 0,
        "Complex Logo Count": result.poster_components?.["Complex Logo Count"] || 0,
        "Diagram Count": result.poster_components?.["Diagram Count"] || 0,
        "Caption Count": result.poster_components?.["Caption Count"] || 0,
        "Figure Count": result.poster_components?.["Figure Count"] || 0,
        "color_contrast": result.color_contrast || {},
        "image_accessibility": result.image_accessibility || {},
        "Authors": result.poster_components?.Authors || [],
        "links": result.links || []
      }

      sessionStorage.setItem('analysisData', JSON.stringify(analysisData))
      sessionStorage.setItem('originalFileName', file.name)
      
      navigate('/analysis')
    } catch (error) {
      console.error('Error:', error)
      alert('Error analyzing file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="upload-page">
      <header className="header">
        <div className="header-left">
          <i className="fa-solid fa-file"></i>
          <h1>A11Y PDF</h1>
        </div>
      </header>

      <div className="content">
        <h2>Document Accessibility</h2>
        <p>Analyze Document and Poster accessibility with stats</p>

        {!file ? (
          <div
            className="upload-box"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <i className="fa-solid fa-upload"></i>
            <p className="upload-title">Drag and drop to upload</p>
            <p>or</p>
            <button onClick={() => document.getElementById('fileInput').click()}>
              Choose file
            </button>
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="file-container">
            <div className="file-info">
              <i className="fa-solid fa-file"></i>
              <span>{file.name}</span>
            </div>
            
            {progress < 100 && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            )}

            {showAnalyze && (
              <button 
                className="analyze-btn" 
                onClick={handleAnalyze}
                disabled={uploading}
              >
                {uploading ? 'Analyzing...' : 'Analyze'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Upload
