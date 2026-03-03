import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LinksAnalysis.css'

function LinksAnalysis() {
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

  const links = data.links || []

  return (
    <div className="links-page">
      <button className="back-button" onClick={() => navigate('/analysis')}>
        ← Back to Analysis
      </button>
      
      <h1>Links Analysis</h1>

      <div className="container">
        <table>
          <thead>
            <tr>
              <th>Link</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {links.length > 0 ? (
              links.map((linkObj, i) => (
                <tr key={i}>
                  <td>
                    <a href={`https://${linkObj.link}`} target="_blank" rel="noopener noreferrer">
                      {linkObj.link}
                    </a>
                  </td>
                  <td className={linkObj.status === 'working' ? 'status-working' : 'status-broken'}>
                    {linkObj.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" style={{color: 'red', textAlign: 'center'}}>
                  No links available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LinksAnalysis
