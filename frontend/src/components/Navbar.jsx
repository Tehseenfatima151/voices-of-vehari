import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { formatImageUrl } from '../utils/mediaUrlHelper';

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
    { href: '#teacher-guide', label: 'Teacher Guide' },
    { href: '#vocabulary', label: 'Vocabulary' },
    { href: '#audio-transcripts', label: 'Audio & Transcripts' },
    { href: '#gallery', label: 'Gallery' },
    { href: '#team', label: 'Team' },
    { href: '#outcomes', label: 'Impact' },
    { href: '#news', label: 'News & Events' },
    { href: '#contact', label: 'Contact' },
  ];

  const logoSrc = formatImageUrl(settings?.logo_url) || '/assets/voices_logo.png';

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
              const normalizedHash = currentHash.replace(/^#\/?/, '#');
              const isActive = normalizedHash === item.href;
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
              const normalizedHash = currentHash.replace(/^#\/?/, '#');
              const isActive = normalizedHash === item.href;
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

          </div>
        )}
      </div>
    </>
  );
};

export default Navbar;