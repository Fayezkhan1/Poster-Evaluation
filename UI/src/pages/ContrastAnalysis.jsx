import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ContrastAnalysis.css'

function ContrastAnalysis() {
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
  const failingSections = totalSections - passingSections
  const passRate = totalSections > 0 ? Math.round((passingSections / totalSections) * 100) : 0

  return (
    <div className="contrast-page">
      <div className="container">
        <button className="back-button" onClick={() => navigate('/analysis')}>
          ← Back to Analysis
        </button>
        <h1>Color Contrast Analysis</h1>

        <div className="summary">
          <h2>Analysis Summary</h2>
          <div className="summary-stats">
            <div className="stat-item">
              <div className="stat-value">{totalSections}</div>
              <div className="stat-label">Total Sections</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{passingSections}</div>
              <div className="stat-label">Passing Sections</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{failingSections}</div>
              <div className="stat-label">Failing Sections</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{passRate}%</div>
              <div className="stat-label">Pass Rate</div>
            </div>
          </div>
        </div>

        <div className="image-section">
          <img 
            src={`http://localhost:5000/color-contrast?t=${Date.now()}`}
            alt="Color contrast analysis"
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Section</th>
                <th>Contrast Ratio</th>
                <th>Status</th>
                <th>Accessibility Level</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section, i) => (
                <tr key={i}>
                  <td>Section {section.section}</td>
                  <td>{section.contrast_ratio.toFixed(2)}</td>
                  <td>
                    <span className={`status ${section.accessibility !== 'Fail' ? 'pass' : 'fail'}`}>
                      {section.accessibility !== 'Fail' ? 'Pass' : 'Fail'}
                    </span>
                  </td>
                  <td>{section.accessibility === 'Fail' ? 'Not Accessible' : section.accessibility}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ContrastAnalysis
