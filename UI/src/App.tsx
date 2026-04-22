import { useState, useRef } from 'react'
import './index.css'

interface ResolutionResult {
  width: number;
  height: number;
  threshold: string;
  status: 'Pass' | 'Fail';
}

interface HyperlinkResult {
  url: string;
  status: 'valid' | 'invalid';
}

interface LayoutComponent {
  type: string;
  filename: string;
  url: string;
  box: number[];
  confidence: number;
  contrast?: any;
  figure_type?: string;
  has_caption?: boolean;
}

interface EvaluationResponse {
  resolution: ResolutionResult;
  hyperlinks: HyperlinkResult[] | null;
  components: LayoutComponent[];
  annotated_image_url?: string;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResults(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('active');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('active');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('active');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResults(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:5000/evaluate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data: EvaluationResponse = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to process the poster.');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'title': return 'badge-title';
      case 'figure': return 'badge-figure';
      case 'plain_text': return 'badge-plain_text';
      case 'table': return 'badge-table';
      default: return 'badge-default';
    }
  };

  const groupComponents = (components: LayoutComponent[]) => {
    const groups: { [key: string]: LayoutComponent[] } = {};
    components.forEach(comp => {
      const type = comp.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      if (!groups[type]) groups[type] = [];
      groups[type].push(comp);
    });
    return groups;
  };

  return (
    <div className="container">
      <h1>Poster Analyzer</h1>
      <p className="subtitle">AI-Powered Accessibility & Layout Evaluation</p>

      {!results && !loading && (
        <div 
          className="upload-area"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
          <div className="upload-icon">🟢</div>
          <div className="upload-text" style={{ color: 'var(--text-main)' }}>
            {file ? file.name : 'Click or drag a poster image here'}
          </div>
          {!file && <div className="upload-hint">Upload your poster to begin analysis</div>}
          
          {preview && (
            <img src={preview} alt="Preview" style={{ marginTop: '20px', maxHeight: '200px', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }} />
          )}
        </div>
      )}

      {file && !results && !loading && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button className="btn" onClick={handleUpload}>
            Analyze Poster
          </button>
        </div>
      )}

      {loading && (
        <div className="loader-container">
          <div className="spinner"></div>
          <h2>Analyzing your poster...</h2>
          <p style={{ color: 'var(--text-muted)' }}>Running layout detection and link validation</p>
        </div>
      )}

      {error && (
        <div className="glass" style={{ padding: '2rem', textAlign: 'center', border: '2px solid var(--accent-red)', background: '#fffafb' }}>
          <h2 style={{ color: 'var(--accent-red)' }}>Analysis Error</h2>
          <p>{error}</p>
          <button className="btn" style={{ marginTop: '1rem', background: 'var(--accent-red)' }} onClick={() => setError(null)}>Try Again</button>
        </div>
      )}

      {results && (
        <div className="components-section">
          <div className="stats-grid">
            <div className="glass stat-card">
              <div className="stat-label">Resolution</div>
              <div className={`stat-value ${results.resolution.status === 'Pass' ? 'status-pass' : 'status-fail'}`}>
                {results.resolution.status}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {results.resolution.width} x {results.resolution.height}px
              </p>
            </div>

            <div className="glass stat-card">
              <div className="stat-label">Hyperlinks</div>
              <div className="stat-value">
                {results.hyperlinks ? results.hyperlinks.length : 0}
              </div>
              {results.hyperlinks && results.hyperlinks.length > 0 && (
                <div className="links-list">
                  {results.hyperlinks.map((link, idx) => (
                    <div key={idx} className="link-item" style={{ background: '#f8fafc' }}>
                      <a href={link.url} target="_blank" rel="noreferrer" className="link-url">{link.url}</a>
                      <span className={`badge ${link.status === 'valid' ? 'badge-title' : 'badge-default'}`} style={link.status === 'invalid' ? {background: '#fee2e2', color: '#991b1b'} : {}}>
                        {link.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="glass stat-card">
              <div className="stat-label">Components</div>
              <div className="stat-value">
                {results.components?.length || 0}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Detected by YOLOv10
              </p>
            </div>
          </div>

          {results.annotated_image_url && (
            <div className="glass" style={{ marginBottom: '3rem', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: '#fff' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>Annotated Poster Layout</h3>
              </div>
              <img 
                src={results.annotated_image_url} 
                alt="Annotated Poster" 
                style={{ width: '100%', height: 'auto', display: 'block' }} 
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2>Poster Components</h2>
            <button className="btn" style={{ background: '#f1f5f9', color: '#475569', boxShadow: 'none' }} onClick={() => { setResults(null); setFile(null); setPreview(null); }}>
              Reset
            </button>
          </div>

          {results.components && results.components.length > 0 ? (
            Object.entries(groupComponents(results.components)).map(([category, items]) => (
              <div key={category} style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-green-secondary)', marginBottom: '1.5rem', borderBottom: '2px solid var(--accent-green-light)', paddingBottom: '0.5rem', display: 'inline-block' }}>
                  {category}
                </h3>
                <div className="components-grid">
                  {items.map((comp, idx) => {
                    const isSelected = selectedId === `${category}-${idx}`;
                    return (
                      <div 
                        key={idx} 
                        className={`glass component-card ${isSelected ? 'expanded' : ''}`}
                        onClick={() => setSelectedId(isSelected ? null : `${category}-${idx}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="component-img-container">
                          <img src={comp.url} alt={comp.filename} className="component-img" loading="lazy" />
                        </div>
                        <div className="component-info" style={{ background: '#fff' }}>
                          <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {(comp.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        
                        {isSelected && comp.type === 'figure' && (
                          <div className="contrast-details" style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: '#fff', animation: 'fadeIn 0.3s ease' }}>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>Figure Analysis</h4>
                            
                            <div style={{ padding: '1rem', background: 'var(--accent-green-light)', borderRadius: '12px', marginBottom: '1rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Classification</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-green-secondary)' }}>{comp.figure_type || "Unknown"}</span>
                              </div>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Descriptive Caption Present</span>
                                <span className={`badge ${comp.has_caption ? 'badge-title' : 'badge-default'}`} style={!comp.has_caption ? {background: '#fee2e2', color: '#991b1b'} : {}}>
                                  {comp.has_caption ? 'Yes' : 'Missing'}
                                </span>
                              </div>
                            </div>
                            
                            {!comp.has_caption && (
                               <p style={{ fontSize: '0.8rem', color: 'var(--accent-red)' }}>⚠️ Accessibility Warning: This figure lacks an immediate descriptive caption.</p>
                            )}
                          </div>
                        )}

                        {isSelected && comp.contrast && (
                          <div className="contrast-details" style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: '#fff', animation: 'fadeIn 0.3s ease' }}>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>Accessibility Analysis</h4>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                              <div className="color-box">
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Text</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: `rgb(${comp.contrast.text_color.join(',')})`, border: '1px solid #e2e8f0' }}></div>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>RGB({comp.contrast.text_color.join(',')})</span>
                                </div>
                              </div>
                              <div className="color-box">
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Background</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: `rgb(${comp.contrast.bg_color.join(',')})`, border: '1px solid #e2e8f0' }}></div>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>RGB({comp.contrast.bg_color.join(',')})</span>
                                </div>
                              </div>
                            </div>

                            <div style={{ padding: '1rem', background: 'var(--accent-green-light)', borderRadius: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Contrast Ratio</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-green-secondary)' }}>{comp.contrast.contrast_ratio}:1</span>
                              </div>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>WCAG Compliance</span>
                                <span className={`badge ${comp.contrast.wcag_status !== 'Fail' ? 'badge-title' : 'badge-default'}`} style={comp.contrast.wcag_status === 'Fail' ? {background: '#fee2e2', color: '#991b1b'} : {}}>
                                  {comp.contrast.wcag_status}
                                </span>
                              </div>
                            </div>

                            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <p>• AA Normal: {comp.contrast.details.AA_normal ? '✅' : '❌'} (Min 4.5:1)</p>
                              <p>• AA Large: {comp.contrast.details.AA_large ? '✅' : '❌'} (Min 3.0:1)</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
              <p>No components detected in this poster.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App
