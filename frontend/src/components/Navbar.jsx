import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar = ({ settings, activeHash = '#index' }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const currentHash = location.hash || '#index';

  const navLinks = [
    { href: '#index', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#research', label: 'Research' },
    { href: '#methodology', label: 'Methodology' },
    { href: '#podcasts', label: 'Podcasts' },
    { href: '#stories', label: 'Stories' },
    { href: '#learning', label: 'Learning' },
    { href: '#audio-transcripts', label: 'Audio & Transcripts' },
    { href: '#gallery', label: 'Gallery' },
    { href: '#team', label: 'Team' },
    { href: '#outcomes', label: 'Impact' },
    { href: '#news', label: 'News & Events' },
    { href: '#contact', label: 'Contact' },
  ];

  const logoSrc = settings?.logo_url || '/assets/voices_logo.png';

  return (
    <>
      <div className="standaloneNav">
        <div className="inner">
          <a className="standaloneBrand" href="#index">
            <img src={logoSrc} alt={settings?.site_name || 'Voices of Vehari'} onError={(e) => { e.target.src = '/assets/voices_logo.png'; }} />
          </a>

          {/* Desktop Nav Links */}
          <div className="desktopNavLinks">
            {navLinks.map((item) => {
              const isActive = currentHash === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={isActive ? 'active' : ''}
                >
                  {item.label}
                </a>
              );
            })}
            <Link to="/admin" className="admin-nav-pill" title="Go to Admin CMS Panel">
              Admin CMS
            </Link>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            className="mobileMenuBtn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileOpen && (
          <div className="mobileNavDrawer">
            {navLinks.map((item) => {
              const isActive = currentHash === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={isActive ? 'active' : ''}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              );
            })}
            <Link
              to="/admin"
              className="admin-nav-pill-mobile"
              onClick={() => setMobileOpen(false)}
            >
              ⚙ Go to Admin CMS Panel
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Navbar;