import React, { useState, useEffect } from 'react';

export default function Dashboard({ token, user, setTab }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [tempRole, setTempRole] = useState(user?.target_role || '');
  const [tempLevel, setTempLevel] = useState(user?.experience_level || 'Beginner');
  const [tempName, setTempName] = useState(user?.full_name || '');
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => { fetchDashboardSummary(); }, [user]);

  const fetchDashboardSummary = async () => {
    try {
      const res = await fetch('/api/dashboard/summary', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setSummary(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ full_name: tempName, target_role: tempRole, experience_level: tempLevel })
      });
      if (res.ok) window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setProfileSaving(false);
      setEditingProfile(false);
    }
  };

  if (loading) return <div className="spinner-wrapper"><div className="spinner"></div></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="glass-card" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1)), var(--bg-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Hello, {user?.full_name || 'Innovator'} 👋</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome to your AI Career Success Center.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setTempName(user?.full_name || ''); setTempRole(user?.target_role || ''); setTempLevel(user?.experience_level || 'Beginner'); setEditingProfile(true); }}>⚙️ Edit Career Profile</button>
      </div>

      {editingProfile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h3 style={{ marginBottom: '20px' }}>Edit Career Settings</h3>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group"><label className="form-label">Full Name</label><input type="text" className="form-input" value={tempName} onChange={e => setTempName(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Target Role</label><input type="text" className="form-input" value={tempRole} onChange={e => setTempRole(e.target.value)} required /></div>
              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select className="form-select" value={tempLevel} onChange={e => setTempLevel(e.target.value)}>
                  <option value="Beginner">Beginner</option><option value="Junior">Junior</option><option value="Mid-Level">Mid-Level</option><option value="Senior">Senior</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingProfile(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={profileSaving}>{profileSaving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper icon-purple">📄</div>
          <div className="metric-content"><span className="metric-label">Latest Resume Score</span><span className="metric-value">{summary?.resumeScore !== null ? `${summary.resumeScore}/100` : 'N/A'}</span></div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper icon-blue">🗺️</div>
          <div className="metric-content"><span className="metric-label">Active Career Path</span><span className="metric-value">{summary?.activeRoadmap ? summary.activeRoadmap.role : 'None'}</span></div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper icon-green">📅</div>
          <div className="metric-content"><span className="metric-label">Learning Tasks</span><span className="metric-value">{summary?.learningProgress ? `${summary.learningProgress.completed}/${summary.learningProgress.total}` : '0/0'}</span></div>
        </div>
      </div>
    </div>
  );
}
