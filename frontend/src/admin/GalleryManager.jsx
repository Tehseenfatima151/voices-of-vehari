import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

export const GalleryManager = () => {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    category: 'general',
    image_url: '',
    alt_text: '',
  });

  const { addToast } = useToast();

  const loadGallery = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminGallery();
      setGallery(res);
    } catch {
      addToast('Failed to load gallery', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await api.uploadMedia(file, formData.alt_text || file.name);
      if (res.success && res.data) {
        setFormData((prev) => ({
          ...prev,
          image_url: res.data.public_url,
          title: prev.title || file.name.split('.')[0],
        }));
        addToast('Image uploaded successfully!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image_url) {
      addToast('Please upload an image or provide an image URL', 'error');
      return;
    }

    try {
      await api.createGalleryItem(formData);
      addToast('Image added to gallery!', 'success');
      setModalOpen(false);
      setFormData({ title: '', caption: '', category: 'general', image_url: '', alt_text: '' });
      loadGallery();
    } catch (err) {
      addToast('Failed to save gallery item', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    try {
      await api.deleteGalleryItem(selectedItem.id);
      addToast('Gallery photo deleted', 'success');
      setDeleteModalOpen(false);
      setSelectedItem(null);
      loadGallery();
    } catch {
      addToast('Failed to delete photo', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
            Visual Gallery
          </h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Visual archive of podcast recordings, student workshops, mentor training and events.
          </p>
        </div>
        <button
          className="btn primary sm"
          onClick={() => {
            setFormData({ title: '', caption: '', category: 'general', image_url: '', alt_text: '' });
            setModalOpen(true);
          }}
        >
          + Add New Photo
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', padding: '20px' }}>Loading gallery photos...</div>
      ) : gallery.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--muted)' }}>No images in gallery yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {gallery.map((item) => (
            <div key={item.id} className="admin-card" style={{ padding: '14px', position: 'relative' }}>
              <img
                src={item.image_url}
                alt={item.alt_text || item.title}
                style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px' }}
                onError={(e) => { e.target.src = '/assets/gallery_poster.jpeg'; }}
              />
              <div style={{ marginTop: '12px' }}>
                <strong style={{ fontSize: '15px', color: 'var(--navy)', display: 'block' }}>{item.title}</strong>
                {item.caption && (
                  <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--muted)' }}>{item.caption}</p>
                )}
              </div>
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
                <span className="badge published" style={{ fontSize: '11px' }}>Live</span>
                <button
                  className="btn danger sm"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  onClick={() => {
                    setSelectedItem(item);
                    setDeleteModalOpen(true);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Photo Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--navy)' }}>Add Gallery Photo</h3>
              <button style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: '20px' }} onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Upload Image File</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={handleFileUpload}
                  />
                  {uploading && <div style={{ fontSize: '12px', color: 'var(--teal)', marginTop: '4px' }}>Uploading...</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Or Image URL</label>
                  <input
                    className="form-control"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="/api/uploads/... or https://..."
                    required
                  />
                </div>

                {formData.image_url && (
                  <div style={{ marginBottom: '16px' }}>
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      style={{ maxHeight: '140px', borderRadius: '10px', border: '1px solid var(--line)' }}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Caption / Description</label>
                  <input
                    className="form-control"
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alt Text (Accessibility & SEO)</label>
                  <input
                    className="form-control"
                    value={formData.alt_text}
                    onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn ghost sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary sm" disabled={uploading}>
                  Save to Gallery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Photo"
        message={`Delete "${selectedItem?.title}" from the public gallery?`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default GalleryManager;
