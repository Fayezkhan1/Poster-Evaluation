import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ResolutionAnalysis.css'

function ResolutionAnalysis() {
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

  const quality = data.image_accessibility || {}

  return (
    <div className="resolution-page">
      <button className="back-button" onClick={() => navigate('/analysis')}>
        ← Back to Analysis
      </button>
      
      <div className="container">
        <div className="card">
          <span className="icon"><i className="fas fa-universal-access"></i></span>
          <h2>Accessibility</h2>
          <div className={`value ${quality.Accessible ? 'pass' : 'fail'}`}>
            <i className={`fas fa-${quality.Accessible ? 'check' : 'times'}-circle`}></i>
            {quality.Accessible ? 'PASS' : 'FAIL'}
          </div>
        </div>

        <div className="card">
          <span className="icon"><i className="fas fa-tachometer-alt"></i></span>
          <h2>DPI</h2>
          <div className="value">{quality.DPI || 'N/A'}</div>
        </div>

        <div className="card">
          <span className="icon"><i className="fas fa-chart-bar"></i></span>
          <h2>Laplacian Variance</h2>
          <div className="value">{quality["Laplacian Variance"]?.toFixed(2) || 'N/A'}</div>
        </div>

        <div className="card">
          <span className="icon"><i className="fas fa-signal"></i></span>
          <h2>PSNR</h2>
          <div className="value">{quality.PSNR?.toFixed(2) || 'N/A'}</div>
        </div>

        <div className="card">
          <span className="icon"><i className="fas fa-expand-arrows-alt"></i></span>
          <h2>Resolution</h2>
          <div className="value">{quality.Resolution?.join(' x ') || 'N/A'}</div>
        </div>
      </div>
    </div>
  )
}

export default ResolutionAnalysis
