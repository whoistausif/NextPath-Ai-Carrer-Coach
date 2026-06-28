import React, { useState } from 'react';

export default function CodingEnvironment({ token }) {
  const [topic, setTopic] = useState('Algorithms');
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [selectedLang, setSelectedLang] = useState('javascript');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState(null);

  const fetchChallenge = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/coding/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ topic, difficulty })
      });
      const data = await res.json();
      setChallenge(data);
      setCode(data.starter_code[selectedLang] || '');
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleSubmitCode = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/coding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ problemTitle: challenge.title, code, language: selectedLang })
      });
      setReport(await res.json());
    } catch (err) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card">
        <form onSubmit={fetchChallenge} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <select className="form-select" value={topic} onChange={e => setTopic(e.target.value)}><option value="Algorithms">Algorithms</option></select>
          <select className="form-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="Medium">Medium</option></select>
          <button type="submit" className="btn btn-primary">Load Challenge</button>
        </form>
      </div>

      {challenge ? (
        <div className="coding-container">
          <div className="glass-card" style={{ overflowY: 'auto' }}>
            <h3>{challenge.title}</h3>
            <p style={{ marginTop: '12px' }}>{challenge.problem_statement}</p>
          </div>
          <div className="code-sandbox-editor">
            <div className="editor-header">
              <span>Editor</span>
              <button className="btn btn-accent" onClick={handleSubmitCode} disabled={submitting}>Run evaluation</button>
            </div>
            <textarea className="editor-textarea" value={code} onChange={e => setCode(e.target.value)} />
            {report && <div className="glass-card" style={{ margin: '20px' }}>Score: {report.score}% - Complexity: {report.time_complexity}</div>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
