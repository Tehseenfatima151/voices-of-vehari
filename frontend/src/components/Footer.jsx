import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = ({ settings }) => {
  return (
    <footer>
      <div className="container" style={{ textAlign: 'center', padding: '40px 20px 30px' }}>
        <p style={{ margin: '0 0 8px', fontSize: '15px' }}>
          <strong>{settings?.site_name || 'Voices of Vehari'}</strong> · {settings?.campus || 'COMSATS University Islamabad, Vehari Campus'}
        </p>
        <p style={{ margin: '0 0 14px', color: 'var(--muted)', fontSize: '14px' }}>
          {settings?.footer_text || 'Enhancing English Proficiency through Multilingual Podcasting and Cultural Storytelling.'}
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Link
            to="/admin"
            title="CMS Admin Portal"
            style={{
              fontSize: '12px',
              color: 'var(--muted, #64748b)',
              textDecoration: 'none',
              opacity: 0.45,
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.color = 'var(--navy, #062e61)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.45';
              e.currentTarget.style.color = 'var(--muted, #64748b)';
            }}
          >
            <span>🔒</span>
            <span>Staff Portal</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
