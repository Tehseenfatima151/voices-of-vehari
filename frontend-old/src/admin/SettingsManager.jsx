import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const SettingsManager = () => {
  const [settings, setSettings] = useState({
    site_name: '',
    tagline: '',
    campus: '',
    address: '',
    contact_email: '',
    contact_phone: '',
    pi_name: '',
    copi_name: '',
    logo_url: '',
    footer_text: '',
    footer_copyright: '',
    meta_title: '',
    meta_description: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.getSettings();
        if (res) setSettings(res);
      } catch {
        addToast('Failed to load site settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const res = await api.uploadMedia(file, 'Site Logo');
      if (res.success && res.data) {
        setSettings((prev) => ({ ...prev, logo_url: res.data.public_url }));
        addToast('Logo uploaded successfully!', 'success');
      }
    } catch {
      addToast('Logo upload failed', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings(settings);
      addToast('Site settings updated successfully! View the public site to see changes.', 'success');
    } catch {
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--muted)' }}>Loading site settings...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
          Site Settings & Identity
        </h2>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Manage global branding, university campus information, leadership contacts and SEO metadata.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="admin-card">
        <h3 style={{ margin: '0 0 18px', color: 'var(--navy)', fontSize: '18px' }}>Branding & General Information</h3>
        
        <div className="two-col" style={{ gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Website Name</label>
            <input
              name="site_name"
              className="form-control"
              value={settings.site_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">University Campus / Institution</label>
            <input
              name="campus"
              className="form-control"
              value={settings.campus}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Project Tagline</label>
          <input
            name="tagline"
            className="form-control"
            value={settings.tagline}
            onChange={handleChange}
            required
          />
        </div>

        {/* Logo */}
        <div className="form-group">
          <label className="form-label">Site Logo</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              name="logo_url"
              className="form-control"
              value={settings.logo_url}
              onChange={handleChange}
            />
            <label className="btn ghost sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {uploadingLogo ? '...' : 'Upload Logo'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleLogoUpload}
              />
            </label>
          </div>
          {settings.logo_url && (
            <div style={{ marginTop: '10px' }}>
              <img
                src={settings.logo_url}
                alt="Logo preview"
                style={{ height: '48px', background: 'white', padding: '4px', border: '1px solid var(--line)', borderRadius: '8px' }}
                onError={(e) => { e.target.src = '/assets/voices_logo.png'; }}
              />
            </div>
          )}
        </div>

        <h3 style={{ margin: '28px 0 18px', color: 'var(--navy)', fontSize: '18px', borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
          Contact & Location Details
        </h3>

        <div className="two-col" style={{ gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Contact Email</label>
            <input
              type="email"
              name="contact_email"
              className="form-control"
              value={settings.contact_email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input
              name="contact_phone"
              className="form-control"
              value={settings.contact_phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="two-col" style={{ gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Principal Investigator (PI)</label>
            <input
              name="pi_name"
              className="form-control"
              value={settings.pi_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Co-Principal Investigator (Co-PI)</label>
            <input
              name="copi_name"
              className="form-control"
              value={settings.copi_name}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Physical Campus Address</label>
          <textarea
            name="address"
            rows="2"
            className="form-control"
            value={settings.address}
            onChange={handleChange}
          />
        </div>

        <h3 style={{ margin: '28px 0 18px', color: 'var(--navy)', fontSize: '18px', borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
          Footer & SEO Metadata
        </h3>

        <div className="form-group">
          <label className="form-label">Footer Copyright Text</label>
          <input
            name="footer_copyright"
            className="form-control"
            value={settings.footer_copyright}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Default SEO Title Tag</label>
          <input
            name="meta_title"
            className="form-control"
            value={settings.meta_title}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Default Meta Description</label>
          <textarea
            name="meta_description"
            rows="2"
            className="form-control"
            value={settings.meta_description}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Saving Settings...' : 'Save Site Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsManager;
