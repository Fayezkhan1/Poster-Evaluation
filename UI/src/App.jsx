import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Upload from './pages/Upload'
import Analysis from './pages/Analysis'
import ContrastAnalysis from './pages/ContrastAnalysis'
import ResolutionAnalysis from './pages/ResolutionAnalysis'
import LinksAnalysis from './pages/LinksAnalysis'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/contrast" element={<ContrastAnalysis />} />
        <Route path="/resolution" element={<ResolutionAnalysis />} />
        <Route path="/links" element={<LinksAnalysis />} />
      </Routes>
    </Router>
  )
}

export default App
