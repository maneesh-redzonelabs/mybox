import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function DashboardPage() {
  const [summary, setSummary] = useState({ familyMembers: 0, policies: 0, vehicles: 0 });

  useEffect(() => {
    let cancelled = false;
    api.getDashboardSummary().then((data) => {
      if (!cancelled) setSummary(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <p className="section-subtitle">Overview of everything linked to your account</p>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">&#128101;</div>
          <div className="stat-value">{summary.familyMembers}</div>
          <div className="stat-label">Family Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">&#128196;</div>
          <div className="stat-value">{summary.policies}</div>
          <div className="stat-label">Policies</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">&#128663;</div>
          <div className="stat-value">{summary.vehicles}</div>
          <div className="stat-label">Vehicles</div>
        </div>
      </div>
    </div>
  );
}
