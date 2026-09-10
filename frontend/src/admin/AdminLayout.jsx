import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully', 'info');
    navigate('/admin/login');
  };

  const navSections = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/hero', icon: '🌟', label: 'Home Hero' },
    { path: '/admin/podcasts', icon: '🎙️', label: 'Podcasts' },
    { path: '/admin/stories', icon: '📖', label: 'Stories' },
    { path: '/admin/gallery', icon: '🖼️', label: 'Gallery' },
    { path: '/admin/team', icon: '👥', label: 'Team Members' },
    { path: '/admin/cards', icon: '🗂️', label: 'Content Cards' },
    { path: '/admin/stats', icon: '📈', label: 'Statistics' },
    { path: '/admin/timeline', icon: '⏳', label: 'Methodology' },
    { path: '/admin/submissions', icon: '📬', label: 'Inquiries' },
    { path: '/admin/media', icon: '📁', label: 'Media Library' },
    { path: '/admin/settings', icon: '⚙️', label: 'Site Settings' },
  ];

  return (
    <div className="admin-wrapper">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileNavOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <img src="/assets/voices_logo.png" alt="Voices of Vehari" onError={(e) => { e.target.style.display = 'none'; }} />
          <div>
            <strong style={{ fontSize: '15px', color: 'white', display: 'block' }}>Voices of Vehari</strong>
            <span style={{ fontSize: '12px', color: '#88a6cb' }}>CMS Admin Panel</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {navSections.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileNavOpen(false)}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: '#fca5a5',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px'
            }}
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              className="btn ghost sm"
              style={{ display: 'none' }}
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              ☰
            </button>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--navy)' }}>Content Management</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn ghost sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>🌐</span> View Public Site
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '12px', borderLeft: '1px solid var(--line)' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--navy)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '14px' }}>
                {user?.username ? user.username[0].toUpperCase() : 'A'}
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', display: 'block' }}>
                  {user?.full_name || user?.username || 'Administrator'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Logged in</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Admin Pages */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
