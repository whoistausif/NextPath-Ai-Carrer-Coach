import React, { useState } from 'react';

export default function SkillGapAnalyzer({ token, user, setTab }) {
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState(user?.target_role || '');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ resumeText, targetRole, jobDescription })
      });
      setAnalysis(await res.json());
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleTriggerLearningPlan = () => {
    if (!analysis) return;
    const missing = analysis.missing_skills?.map(s => s.skill).join(', ');
    localStorage.setItem('pending_skills_to_learn', missing);
    setTab('learning');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '30px' }}>
      <div className="glass-card">
        <h3>Skill Gap Analysis</h3>
        <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <input type="text" className="form-input" value={targetRole} onChange={e => setTargetRole(e.target.value)} required />
          <textarea className="form-textarea" placeholder="Paste Resume..." value={resumeText} onChange={e => setResumeText(e.target.value)} required />
          <textarea className="form-textarea" placeholder="Paste Job Description..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} required />
          <button type="submit" className="btn btn-primary btn-full">Run Gap Analysis</button>
        </form>
      </div>
      <div className="glass-card">
        {loading ? <div className="spinner-wrapper"><div className="spinner"></div></div> : analysis ? (
          <div>
            <h3>Matching skills match ratio: {analysis.match_percentage}%</h3>
            <div style={{ marginTop: '20px' }}>
              <h4>Matching Skills</h4>
              <p>{analysis.matching_skills?.join(', ')}</p>
            </div>
            <div style={{ marginTop: '20px' }}>
              <h4>Missing Skills</h4>
              <ul>{analysis.missing_skills?.map((sk, idx) => <li key={idx}><strong>{sk.skill}</strong> - {sk.priority} ({sk.learning_difficulty})</li>)}</ul>
            </div>
            <button className="btn btn-accent btn-full" style={{ marginTop: '20px' }} onClick={handleTriggerLearningPlan}>Generate Study Plan</button>
          </div>
        ) : <p>Compare skills above.</p>}
      </div>
    </div>
  );
}
