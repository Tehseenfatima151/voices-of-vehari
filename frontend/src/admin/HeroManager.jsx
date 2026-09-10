import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const HeroManager = () => {
  const [hero, setHero] = useState({
    kicker: '',
    title: '',
    lead_strong: '',
    lead_body: '',
    primary_btn_text: '',
    primary_btn_url: '',
    secondary_btn_text: '',
    secondary_btn_url: '',
    hero_image_url: '',
    hero_image_alt: '',
    logo_float_url: '',
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const res = await api.getHero();
        if (res) setHero(res);
      } catch (err) {
        addToast('Failed to load hero section', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchHero();
  }, [addToast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHero((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await api.uploadMedia(file, `${fieldName} upload`);
      if (res.success && res.data) {
        setHero((prev) => ({
          ...prev,
          [fieldName]: res.data.public_url
        }));
        addToast('Image uploaded successfully!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Image upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.updateHero(hero);
      if (res.success) {
        addToast('Hero section updated successfully! View the public site to see changes.', 'success');
      }
    } catch (err) {
      addToast('Error saving hero section', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--muted)' }}>Loading Hero Section settings...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
          Home Hero Section
        </h2>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Manage the hero banner, titles, lead paragraphs, action buttons and artwork on the homepage.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="admin-card">
        <div className="form-group">
          <label className="form-label">Hero Kicker (Top Eyebrow)</label>
          <input
            name="kicker"
            className="form-control"
            value={hero.kicker}
            onChange={handleChange}
            placeholder="e.g. A research & community storytelling initiative"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Hero Main Title (H1)</label>
          <input
            name="title"
            className="form-control"
            value={hero.title}
            onChange={handleChange}
            placeholder="e.g. Voices of Vehari"
            required
            style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Lead Heading (Bold Paragraph)</label>
          <textarea
            name="lead_strong"
            rows="2"
            className="form-control"
            value={hero.lead_strong}
            onChange={handleChange}
            placeholder="e.g. Enhancing English Proficiency through Multilingual Podcasting and Cultural Storytelling."
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Lead Subtitle (Body Paragraph)</label>
          <textarea
            name="lead_body"
            rows="3"
            className="form-control"
            value={hero.lead_body}
            onChange={handleChange}
            placeholder="Detailed description of the project"
            required
          />
        </div>

        <div className="two-col" style={{ gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Primary Button Text</label>
            <input
              name="primary_btn_text"
              className="form-control"
              value={hero.primary_btn_text}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Primary Button Target URL</label>
            <input
              name="primary_btn_url"
              className="form-control"
              value={hero.primary_btn_url}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="two-col" style={{ gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Secondary Button Text</label>
            <input
              name="secondary_btn_text"
              className="form-control"
              value={hero.secondary_btn_text}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Secondary Button Target URL</label>
            <input
              name="secondary_btn_url"
              className="form-control"
              value={hero.secondary_btn_url}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="two-col" style={{ gap: '20px', marginTop: '10px' }}>
          {/* Hero Art */}
          <div className="form-group">
            <label className="form-label">Hero Artwork Image</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                name="hero_image_url"
                className="form-control"
                value={hero.hero_image_url}
                onChange={handleChange}
                placeholder="/api/uploads/..."
              />
              <label className="btn ghost sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {uploading ? '...' : 'Upload'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleImageUpload(e, 'hero_image_url')}
                />
              </label>
            </div>
            {hero.hero_image_url && (
              <div style={{ marginTop: '10px' }}>
                <img
                  src={hero.hero_image_url}
                  alt="Preview"
                  style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--line)' }}
                  onError={(e) => { e.target.src = '/assets/hero_art.jpeg'; }}
                />
              </div>
            )}
          </div>

          {/* Floating Logo */}
          <div className="form-group">
            <label className="form-label">Floating Artwork Logo</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                name="logo_float_url"
                className="form-control"
                value={hero.logo_float_url}
                onChange={handleChange}
                placeholder="/api/uploads/..."
              />
              <label className="btn ghost sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {uploading ? '...' : 'Upload'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleImageUpload(e, 'logo_float_url')}
                />
              </label>
            </div>
            {hero.logo_float_url && (
              <div style={{ marginTop: '10px' }}>
                <img
                  src={hero.logo_float_url}
                  alt="Preview"
                  style={{ maxHeight: '80px', background: 'white', padding: '8px', borderRadius: '12px', border: '1px solid var(--line)' }}
                  onError={(e) => { e.target.src = '/assets/voices_logo.png'; }}
                />
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Saving Changes...' : 'Save Hero Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HeroManager;
