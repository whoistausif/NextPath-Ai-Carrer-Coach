import React, { useState, useEffect } from 'react';

export default function RoadmapGenerator({ token, user }) {
  const [role, setRole] = useState(user?.target_role || '');
  const [level, setLevel] = useState(user?.experience_level || 'Beginner');
  const [timeline, setTimeline] = useState('3 Months');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeNode, setActiveNode] = useState(1);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/roadmap/history', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        if (data.length > 0) setRoadmap(data[0].roadmap);
      }
    } catch (err) { console.error(err); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role, level, timeline })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setRoadmap(data);
      fetchHistory();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '30px' }}>
      <div className="glass-card">
        <h3 style={{ marginBottom: '16px' }}>Configure Path</h3>
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group"><label className="form-label">Target Role</label><input type="text" className="form-input" value={role} onChange={e => setRole(e.target.value)} required /></div>
          <div className="form-group">
            <label className="form-label">Experience</label>
            <select className="form-select" value={level} onChange={e => setLevel(e.target.value)}>
              <option value="Beginner">Beginner</option><option value="Junior">Junior</option><option value="Mid-Level">Mid-Level</option><option value="Senior">Senior</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Timeline</label>
            <select className="form-select" value={timeline} onChange={e => setTimeline(e.target.value)}>
              <option value="1 Month">1 Month</option><option value="3 Months">3 Months</option><option value="6 Months">6 Months</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>Build Roadmap</button>
        </form>
      </div>

      <div className="glass-card">
        {loading ? <div className="spinner-wrapper"><div className="spinner"></div></div> : roadmap ? (
          <div>
            <h2>{roadmap.role} Timeline</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{roadmap.summary}</p>
            <div className="roadmap-timeline">
              {roadmap.milestones?.map(node => (
                <div key={node.id} className="roadmap-node" onClick={() => setActiveNode(node.id)}>
                  <div className="roadmap-node-dot" style={{ borderColor: activeNode === node.id ? 'var(--secondary)' : 'var(--primary)' }}></div>
                  <div style={{ background: activeNode === node.id ? 'rgba(255,255,255,0.02)' : 'transparent', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}>
                    <div className="roadmap-node-header">
                      <h4>{node.title}</h4><span className="badge badge-success">{node.duration}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{node.description}</p>
                    {activeNode === node.id && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                        <div><strong>Skills:</strong> {node.key_skills?.join(', ')}</div>
                        <div style={{ marginTop: '8px' }}><strong>Action Items:</strong>
                          <ul style={{ paddingLeft: '20px' }}>{node.action_items?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : <p>Map your timeline milestones on the left.</p>}
      </div>
    </div>
  );
}
