import React, { useState } from 'react';

export default function LinkedInOptimizer({ token, user }) {
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState(user?.target_role || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleOptimize = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ resumeText, targetRole })
      });
      setResult(await res.json());
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
      <div className="glass-card">
        <h3>LinkedIn Optimizer</h3>
        <form onSubmit={handleOptimize} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <input type="text" className="form-input" value={targetRole} onChange={e => setTargetRole(e.target.value)} required />
          <textarea className="form-textarea" placeholder="Paste Resume..." value={resumeText} onChange={e => setResumeText(e.target.value)} required />
          <button type="submit" className="btn btn-primary btn-full">Optimize Profile</button>
        </form>
      </div>
      <div className="glass-card">
        {loading ? <div className="spinner-wrapper"><div className="spinner"></div></div> : result ? (
          <div>
            <h4>headlines:</h4>
            <ul>{result.headlines?.map((h, i) => <li key={i} style={{ padding: '8px 0' }}>{h}</li>)}</ul>
            <h4 style={{ marginTop: '20px' }}>Summary Bio</h4>
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{result.about_summary}</p>
          </div>
        ) : <p>Optimize profile on the left.</p>}
      </div>
    </div>
  );
}
