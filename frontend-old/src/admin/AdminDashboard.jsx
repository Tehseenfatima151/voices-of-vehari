import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.getDashboardStats();
        setStats(res);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px', color: 'var(--muted)' }}>Loading dashboard statistics...</div>;
  }

  const counts = stats?.counts || {};
  const recentMessages = stats?.recent_messages || [];
  const recentPodcasts = stats?.recent_podcasts || [];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
          Overview Dashboard
        </h2>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Manage and monitor all content on the Voices of Vehari website.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="admin-grid-metrics">
        <div className="metric-card">
          <div className="metric-icon">🎙️</div>
          <div>
            <div className="metric-value">{counts.podcasts || 0}</div>
            <div className="metric-label">Total Podcasts ({counts.published_podcasts || 0} live)</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📖</div>
          <div>
            <div className="metric-value">{counts.stories || 0}</div>
            <div className="metric-label">Cultural Stories ({counts.published_stories || 0} live)</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🖼️</div>
          <div>
            <div className="metric-value">{counts.gallery || 0}</div>
            <div className="metric-label">Gallery Images</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div>
            <div className="metric-value">{counts.team || 0}</div>
            <div className="metric-label">Team Members</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📬</div>
          <div>
            <div className="metric-value" style={{ color: counts.unread_messages ? '#e5aa3a' : 'var(--navy)' }}>
              {counts.unread_messages || 0}
            </div>
            <div className="metric-label">Unread Inquiries</div>
          </div>
        </div>
      </div>

      <div className="two-col" style={{ gap: '24px' }}>
        {/* Recent Messages */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--navy)' }}>Recent Inquiries</h3>
            <Link to="/admin/submissions" style={{ color: 'var(--teal)', fontSize: '13px', fontWeight: 700 }}>
              View All ({counts.total_messages || 0}) →
            </Link>
          </div>

          {recentMessages.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>No messages received yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {recentMessages.map((m) => (
                <div key={m.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>{m.name}</strong>
                    <span className={`badge ${m.status === 'unread' ? 'draft' : 'published'}`}>{m.status}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--teal)', fontWeight: 600 }}>{m.intent}</div>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Management Actions */}
        <div className="admin-card">
          <h3 style={{ margin: '0 0 18px', fontSize: '18px', color: 'var(--navy)' }}>Quick CMS Shortcuts</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Link to="/admin/hero" className="btn ghost sm" style={{ justifyContent: 'flex-start', gap: '8px', padding: '12px' }}>
              <span>🌟</span> Edit Home Hero
            </Link>
            <Link to="/admin/podcasts" className="btn ghost sm" style={{ justifyContent: 'flex-start', gap: '8px', padding: '12px' }}>
              <span>🎙️</span> Add Podcast
            </Link>
            <Link to="/admin/stories" className="btn ghost sm" style={{ justifyContent: 'flex-start', gap: '8px', padding: '12px' }}>
              <span>📖</span> Add Story
            </Link>
            <Link to="/admin/gallery" className="btn ghost sm" style={{ justifyContent: 'flex-start', gap: '8px', padding: '12px' }}>
              <span>🖼️</span> Upload Photos
            </Link>
            <Link to="/admin/team" className="btn ghost sm" style={{ justifyContent: 'flex-start', gap: '8px', padding: '12px' }}>
              <span>👥</span> Manage Team
            </Link>
            <Link to="/admin/settings" className="btn ghost sm" style={{ justifyContent: 'flex-start', gap: '8px', padding: '12px' }}>
              <span>⚙️</span> Site Settings
            </Link>
          </div>

          <div style={{ marginTop: '20px', padding: '16px', background: '#eaf7f4', borderRadius: '12px', border: '1px solid #cce5e3' }}>
            <strong style={{ color: 'var(--navy)', display: 'block', fontSize: '14px', marginBottom: '4px' }}>
              Real-time synchronization active
            </strong>
            <p style={{ margin: 0, fontSize: '13px', color: '#33506c' }}>
              Any content published or modified here is immediately served via the Flask REST API to the public website.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
