import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = ({ settings }) => {
  return (
    <footer>
      <div className="container" style={{ textAlign: 'center', padding: '40px 20px 30px' }}>
        <p style={{ margin: '0 0 8px', fontSize: '15px' }}>
          <strong>{settings?.site_name || 'Voices of Vehari'}</strong> · {settings?.campus || 'COMSATS University Islamabad, Vehari Campus'}
        </p>
        <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: '14px' }}>
          {settings?.footer_text || 'Enhancing English Proficiency through Multilingual Podcasting and Cultural Storytelling.'}
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Link
            to="/admin/login"
            title="CMS Admin Portal"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--navy, #062e61)',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              padding: '6px 14px',
              borderRadius: '20px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e2e8f0';
              e.currentTarget.style.borderColor = '#94a3b8';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <span style={{ fontSize: '12px' }}>🔒</span>
            <span>Admin Login</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
