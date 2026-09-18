import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

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
    { path: '/admin/teacher-guide', icon: '📚', label: 'Teacher Guide' },
    { path: '/admin/vocabulary', icon: '📖', label: 'Vocabulary' },
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
      {/* Mobile Backdrop Overlay */}
      {mobileNavOpen && (
        <div
          className="admin-backdrop"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileNavOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <img src="/assets/voices_logo.png" alt="Voices of Vehari" onError={(e) => { e.target.style.display = 'none'; }} />
          <div>
            <strong style={{ fontSize: '15px', color: 'white', display: 'block' }}>Voices of Vehari</strong>
            <span style={{ fontSize: '12px', color: '#88a6cb' }}>CMS Admin Panel</span>
          </div>
          <button
            className="admin-close-btn"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
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
              className="admin-mobile-hamburger"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label="Toggle admin sidebar"
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
              <span>🌐</span> <span className="hide-on-mobile">View Public Site</span>
            </Link>

            {/* Modernized Profile Avatar & Interactive Dropdown */}
            <div style={{ position: 'relative' }} ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '5px 12px 5px 6px',
                  borderRadius: '30px',
                  border: profileDropdownOpen ? '1px solid #1665c0' : '1px solid var(--line, #e2e8f0)',
                  background: profileDropdownOpen ? '#f0f7ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: profileDropdownOpen
                    ? '0 0 0 3px rgba(22, 101, 192, 0.15)'
                    : '0 1px 3px rgba(0,0,0,0.04)',
                }}
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
              >
                {/* Avatar with gradient & online status dot */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1665c0 0%, #078f92 100%)',
                      color: '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      fontSize: '15px',
                      boxShadow: '0 2px 6px rgba(22, 101, 192, 0.3)',
                    }}
                  >
                    {user?.full_name ? user.full_name[0].toUpperCase() : (user?.username ? user.username[0].toUpperCase() : 'A')}
                  </div>
                  {/* Green online indicator dot */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-1px',
                      right: '-1px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#10b981',
                      border: '2px solid #ffffff',
                    }}
                  />
                </div>

                {/* User info labels */}
                <div className="hide-on-mobile" style={{ textAlign: 'left', lineHeight: 1.25 }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy, #0f172a)', display: 'block' }}>
                    {user?.full_name || user?.username || 'Voices of Vehari Admin'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#1665c0', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1665c0' }}></span>
                    Administrator
                  </span>
                </div>

                {/* Chevron icon */}
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--muted, #64748b)',
                    transition: 'transform 0.2s ease',
                    transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    marginLeft: '2px',
                  }}
                >
                  ▼
                </span>
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '260px',
                    background: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(15, 23, 42, 0.08)',
                    padding: '8px',
                    zIndex: 99999,
                    animation: 'fadeIn 0.15s ease',
                  }}
                >
                  {/* Profile Header */}
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1665c0 0%, #078f92 100%)',
                        color: 'white',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 800,
                        fontSize: '17px',
                        flexShrink: 0,
                      }}
                    >
                      {user?.full_name ? user.full_name[0].toUpperCase() : (user?.username ? user.username[0].toUpperCase() : 'A')}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.full_name || 'Voices of Vehari Admin'}
                      </strong>
                      <span style={{ fontSize: '12px', color: '#64748b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.email || 'admin@voicesofvehari.edu.pk'}
                      </span>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div style={{ padding: '6px 0' }}>
                    <Link
                      to="/admin/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#334155',
                        textDecoration: 'none',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: '16px' }}>⚙️</span> Site Settings
                    </Link>

                    <Link
                      to="/admin/teacher-guide"
                      onClick={() => setProfileDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#334155',
                        textDecoration: 'none',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: '16px' }}>📚</span> Teacher Guide
                    </Link>

                    <a
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setProfileDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#334155',
                        textDecoration: 'none',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: '16px' }}>🌐</span> View Public Website
                    </a>
                  </div>

                  {/* Sign Out Button */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#dc2626',
                        background: 'transparent',
                        border: 0,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: '16px' }}>🚪</span> Sign Out
                    </button>
                  </div>
                </div>
              )}
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