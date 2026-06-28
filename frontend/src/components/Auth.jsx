import React, { useState } from 'react';

export default function Auth({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister 
      ? { email, password, full_name: fullName, target_role: targetRole, experience_level: experienceLevel }
      : { email, password };
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onAuthSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">NextPath AI</div>
          <h3 className="auth-title">{isRegister ? 'Create Your Account' : 'Welcome Back'}</h3>
        </div>
        {error && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid var(--danger)', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>⚠️ {error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Target Role</label>
                <input type="text" className="form-input" value={targetRole} onChange={e => setTargetRole(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select className="form-select" value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}>
                  <option value="Beginner">Beginner (0-1 yrs)</option>
                  <option value="Junior">Junior (1-3 yrs)</option>
                  <option value="Mid-Level">Mid-Level (3-5 yrs)</option>
                  <option value="Senior">Senior (5+ yrs)</option>
                </select>
              </div>
            </>
          )}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Sign In')}</button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button onClick={() => { setIsRegister(!isRegister); setError(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', textDecoration: 'underline' }}>
            {isRegister ? 'Sign In instead' : 'Create an Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
