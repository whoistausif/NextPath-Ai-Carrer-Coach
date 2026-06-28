import React, { useState } from 'react';

export default function CoverLetterGenerator({ token }) {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState('Professional');
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ resumeText, jobDescription, tone })
      });
      setLetter(await res.json());
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
      <div className="glass-card">
        <h3>Cover Letter Form</h3>
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <textarea className="form-textarea" placeholder="Paste Resume accomplishments..." value={resumeText} onChange={e => setResumeText(e.target.value)} required />
          <textarea className="form-textarea" placeholder="Paste Job Description..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} required />
          <select className="form-select" value={tone} onChange={e => setTone(e.target.value)}>
            <option value="Professional">Professional</option><option value="Enthusiastic">Enthusiastic</option><option value="Creative">Creative</option>
          </select>
          <button type="submit" className="btn btn-primary btn-full">Generate Letter</button>
        </form>
      </div>
      <div className="glass-card">
        {loading ? <div className="spinner-wrapper"><div className="spinner"></div></div> : letter ? (
          <div>
            <h3>{letter.subject}</h3>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: '20px', fontFamily: 'serif' }}>{letter.full_letter}</pre>
          </div>
        ) : <p>Generate Cover Letter above.</p>}
      </div>
    </div>
  );
}
