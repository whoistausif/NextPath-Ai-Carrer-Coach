import React, { useState, useEffect } from 'react';

export default function ResumeAnalyzer({ token, user }) {
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState(user?.target_role || '');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/resume/history', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        if (data.length > 0) setReport(data[0].analysis);
      }
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    if (file) formData.append('resume', file);
    else formData.append('resumeText', resumeText);
    formData.append('targetRole', targetRole);
    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      setReport(data.analysis);
      fetchHistory();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.5fr', gap: '30px' }}>
      <div className="glass-card">
        <h3>Upload Resume</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div className="form-group"><label className="form-label">Target Role</label><input type="text" className="form-input" value={targetRole} onChange={e => setTargetRole(e.target.value)} required /></div>
          <input type="file" accept=".pdf,.txt" onChange={e => setFile(e.target.files[0])} />
          <textarea className="form-textarea" placeholder="Or paste text..." value={resumeText} onChange={e => setResumeText(e.target.value)} disabled={file !== null} />
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>Analyze Compatibility</button>
        </form>
      </div>

      <div className="glass-card">
        {loading ? <div className="spinner-wrapper"><div className="spinner"></div></div> : report ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Compatibility score: {report.score}</h2>
            </div>
            <div className="resume-grid" style={{ marginTop: '20px' }}>
              <div><h4>Strengths</h4><ul>{report.strengths?.map((str, i) => <li key={i}>{str}</li>)}</ul></div>
              <div><h4>Gaps</h4><ul>{report.gaps?.map((gap, i) => <li key={i}>{gap}</li>)}</ul></div>
            </div>
            {report.bullet_improvements && (
              <div style={{ marginTop: '20px' }}>
                <h4>Optimizations</h4>
                {report.bullet_improvements.map((item, idx) => (
                  <div key={idx} className="feedback-item">
                    <div className="comparison-box">
                      <div className="diff-text diff-minus">Before: {item.original}</div>
                      <div className="diff-text diff-plus">After: {item.revised}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : <p>Upload file on the left.</p>}
      </div>
    </div>
  );
}
