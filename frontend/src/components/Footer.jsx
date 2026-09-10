import React from 'react';

export const Footer = ({ settings }) => {
  return (
    <footer>
      <div className="container" style={{ textAlign: 'center', padding: '40px 20px 30px' }}>
        <p style={{ margin: '0 0 8px', fontSize: '15px' }}>
          <strong>{settings?.site_name || 'Voices of Vehari'}</strong> · {settings?.campus || 'COMSATS University Islamabad, Vehari Campus'}
        </p>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
          {settings?.footer_text || 'Enhancing English Proficiency through Multilingual Podcasting and Cultural Storytelling.'}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
