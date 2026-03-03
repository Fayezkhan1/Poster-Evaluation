import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Analysis.css'

function Analysis() {
  const [data, setData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const analysisData = sessionStorage.getItem('analysisData')
    if (!analysisData) {
      navigate('/')
      return
    }
    setData(JSON.parse(analysisData))
  }, [navigate])

  if (!data) return null

  const sections = data.color_contrast?.sections || []
  const totalSections = sections.length
  const passingSections = sections.filter(s => s.accessibility !== "Fail").length
  const contrastPercentage = totalSections > 0 ? Math.round((passingSections / totalSections) * 100) : 0

  const quality = data.image_accessibility || {}
  const meetsThresholds = [
    quality.PSNR >= 30,
    quality.Resolution?.[0] >= 800 && quality.Resolution?.[1] >= 600,
    quality["Laplacian Variance"] >= 100,
    quality.DPI >= 72
  ]
  const passingThresholds = meetsThresholds.filter(Boolean).length
  const isQualityPass = passingThresholds >= 3

  return (
    <div className="analysis-page">
      <div className="container">
        <h1>Poster Analysis Results</h1>

        <div className="poster-section">
          <h2><i className="fas fa-image"></i> Poster Components Analysis</h2>
          <img 
            src={`http://localhost:5000/poster-components?t=${Date.now()}`}
            alt="Components analysis"
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>

        <div className="metrics-grid">
          <div className="metric-card" onClick={() => navigate('/contrast')}>
            <h2><i className="fas fa-adjust"></i> Color Contrast Evaluation</h2>
            <div className="circular-progress" style={{
              background: `conic-gradient(${contrastPercentage >= 70 ? '#2ec4b6' : '#ef476f'} ${contrastPercentage * 3.6}deg, #f0f3f9 0deg)`
            }}>
              <div className="progress-value">{contrastPercentage}%</div>
            </div>
            <div className="metric-details">
              {passingSections} of {totalSections} sections pass accessibility standards
            </div>
          </div>

          <div className="metric-card" onClick={() => navigate('/resolution')}>
            <h2><i className="fas fa-expand"></i> Color Resolution Quality</h2>
            <div className="circular-progress" style={{
              background: `conic-gradient(${isQualityPass ? '#2ec4b6' : '#ef476f'} ${isQualityPass ? 360 : 0}deg, #f0f3f9 0deg)`
            }}>
              <div className="progress-value">{isQualityPass ? 'PASS' : 'FAIL'}</div>
            </div>
            <div className="metric-details">
              Resolution: {quality.Resolution?.join('x') || 'N/A'}<br/>
              DPI: {quality.DPI || 'N/A'}<br/>
              PSNR: {quality.PSNR?.toFixed(2) || 'N/A'}
            </div>
          </div>
        </div>

        <div className="results-grid">
          <div className="count-section">
            <h3><i className="fas fa-star"></i> Simple Logo Count</h3>
            <div className="count-value">{data["Simple Logo Count"] || 0}</div>
          </div>
          
          <div className="count-section">
            <h3><i className="fas fa-certificate"></i> Complex Logo Count</h3>
            <div className="count-value">{data["Complex Logo Count"] || 0}</div>
          </div>
          
          <div className="count-section">
            <h3><i className="fas fa-project-diagram"></i> Diagram Count</h3>
            <div className="count-value">{data["Diagram Count"] || 0}</div>
          </div>
          
          <div className="count-section">
            <h3><i className="fas fa-closed-captioning"></i> Caption Count</h3>
            <div className="count-value">{data["Caption Count"] || 0}</div>
          </div>

          <div className="count-section">
            <h3><i className="fas fa-image"></i> Figure Count</h3>
            <div className="count-value">{data["Figure Count"] || 0}</div>
          </div>
        </div>

        <div className="additional-info">
          <div className="info-card">
            <h2><i className="fas fa-users"></i> Authors</h2>
            <ul>
              {data.Authors?.length > 0 ? (
                data.Authors.map((author, i) => <li key={i}>{author}</li>)
              ) : (
                <li>No authors found</li>
              )}
            </ul>
          </div>
          
          <div className="info-card" onClick={() => navigate('/links')} style={{cursor: 'pointer'}}>
            <h2><i className="fas fa-link"></i> Links</h2>
            <ul>
              {data.links?.length > 0 ? (
                data.links.map((link, i) => (
                  <li key={i}>
                    <a href={`http://${link.link}`} target="_blank" rel="noopener noreferrer">
                      {link.link}
                    </a> ({link.status})
                  </li>
                ))
              ) : (
                <li>No links found</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analysis
