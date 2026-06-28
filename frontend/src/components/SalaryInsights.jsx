import React, { useState } from 'react';

export default function SalaryInsights({ token, user }) {
  const [role, setRole] = useState(user?.target_role || '');
  const [location, setLocation] = useState('United States');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role, location })
      });
      setData(await res.json());
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '30px' }}>
      <div className="glass-card">
        <h3>Salary insights</h3>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <input type="text" className="form-input" value={role} onChange={e => setRole(e.target.value)} required />
          <select className="form-select" value={location} onChange={e => setLocation(e.target.value)}>
            <option value="United States">United States</option><option value="India">India</option>
          </select>
          <button type="submit" className="btn btn-primary btn-full">Search Salaries</button>
        </form>
      </div>

      <div className="glass-card">
        {data ? (
          <div>
            <h3>Brackets for {data.role}</h3>
            <div className="chart-container" style={{ marginTop: '20px' }}>
              <div className="chart-bar-row">
                <div className="chart-bar-wrapper">
                  <div className="chart-bar-fill" style={{ width: '70%' }}></div>
                  <div className="chart-bar-value">Mid Range median: {data.ranges?.mid?.median}</div>
                </div>
              </div>
            </div>
          </div>
        ) : <p>Define role on the left.</p>}
      </div>
    </div>
  );
}
