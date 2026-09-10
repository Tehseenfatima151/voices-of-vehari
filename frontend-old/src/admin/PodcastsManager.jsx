import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

export const PodcastsManager = () => {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    guest: '',
    host: '',
    category: 'education',
    tags: '',
    description: '',
    audio_url: '',
    cover_image_url: '',
    is_published: true,
  });

  const { addToast } = useToast();

  const loadPodcasts = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminPodcasts();
      setPodcasts(res);
    } catch {
      addToast('Failed to load podcasts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPodcasts();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      guest: '',
      host: '',
      category: 'education',
      tags: 'Education, Multilingual',
      description: '',
      audio_url: '',
      cover_image_url: '/assets/podcast_upcoming.jpeg',
      is_published: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingId(p.id);
    setFormData({
      title: p.title || '',
      guest: p.guest || '',
      host: p.host || '',
      category: p.category || 'education',
      tags: (p.tags || []).join(', '),
      description: p.description || '',
      audio_url: p.audio_url || '',
      cover_image_url: p.cover_image_url || '',
      is_published: p.is_published,
    });
    setModalOpen(true);
  };

  const handleTogglePublish = async (id) => {
    try {
      const res = await api.togglePodcastPublish(id);
      if (res.success) {
        addToast(res.message, 'success');
        loadPodcasts();
      }
    } catch {
      addToast('Failed to update status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPodcast) return;
    try {
      await api.deletePodcast(selectedPodcast.id);
      addToast('Podcast deleted successfully', 'success');
      setDeleteModalOpen(false);
      setSelectedPodcast(null);
      loadPodcasts();
    } catch {
      addToast('Failed to delete podcast', 'error');
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const res = await api.uploadMedia(file, `${field} for podcast`);
      if (res.success && res.data) {
        setFormData((prev) => ({ ...prev, [field]: res.data.public_url }));
        addToast('File uploaded successfully!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Upload failed', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    try {
      if (editingId) {
        await api.updatePodcast(editingId, payload);
        addToast('Podcast updated successfully!', 'success');
      } else {
        await api.createPodcast(payload);
        addToast('New podcast episode created!', 'success');
      }
      setModalOpen(false);
      loadPodcasts();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving podcast', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
            Podcast Episodes
          </h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Manage podcast episodes, audio recordings, guest information, and categories.
          </p>
        </div>
        <button className="btn primary sm" onClick={openCreateModal}>
          + Add New Episode
        </button>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Episode</th>
              <th>Category</th>
              <th>Guest / Host</th>
              <th>Audio</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Loading episodes...</td>
              </tr>
            ) : podcasts.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No episodes found. Add your first episode!</td>
              </tr>
            ) : (
              podcasts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={p.cover_image_url || '/assets/podcast_upcoming.jpeg'}
                        alt={p.title}
                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '10px' }}
                        onError={(e) => { e.target.src = '/assets/podcast_upcoming.jpeg'; }}
                      />
                      <div>
                        <strong style={{ color: 'var(--navy)', display: 'block' }}>{p.title}</strong>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                          {(p.tags || []).map((t, idx) => (
                            <span key={idx} className="tag" style={{ fontSize: '10px', padding: '2px 6px', margin: 0 }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span style={{ textTransform: 'capitalize' }}>{p.category}</span></td>
                  <td>
                    {p.guest && <div style={{ fontSize: '13px' }}>Guest: {p.guest}</div>}
                    {p.host && <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Host: {p.host}</div>}
                  </td>
                  <td>
                    {p.audio_url ? (
                      <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: '13px' }}>✓ Audio Linked</span>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Placeholder</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleTogglePublish(p.id)}
                      className={`badge ${p.is_published ? 'published' : 'draft'}`}
                      style={{ border: 0, cursor: 'pointer' }}
                      title="Click to toggle publish status"
                    >
                      {p.is_published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn ghost sm" style={{ marginRight: '6px' }} onClick={() => openEditModal(p)}>
                      Edit
                    </button>
                    <button
                      className="btn danger sm"
                      onClick={() => {
                        setSelectedPodcast(p);
                        setDeleteModalOpen(true);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit / Create Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--navy)' }}>
                {editingId ? 'Edit Podcast Episode' : 'Add New Episode'}
              </h3>
              <button style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: '20px' }} onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Episode Title</label>
                  <input
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="two-col" style={{ gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Featured Guest</label>
                    <input
                      className="form-control"
                      value={formData.guest}
                      onChange={(e) => setFormData({ ...formData, guest: e.target.value })}
                      placeholder="e.g. Dr. Asma Kashif Shehzad"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Host</label>
                    <input
                      className="form-control"
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      placeholder="e.g. Abdullah"
                    />
                  </div>
                </div>

                <div className="two-col" style={{ gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="education">Education</option>
                      <option value="culture">Culture</option>
                      <option value="food">Food</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tags (comma-separated)</label>
                    <input
                      className="form-control"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="e.g. Urdu, Education, Community"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Summary</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                {/* Audio URL / Upload */}
                <div className="form-group">
                  <label className="form-label">Audio URL or Upload Recording</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      className="form-control"
                      value={formData.audio_url}
                      onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                      placeholder="https://... or /api/uploads/..."
                    />
                    <label className="btn ghost sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Upload Audio
                      <input
                        type="file"
                        accept="audio/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, 'audio_url')}
                      />
                    </label>
                  </div>
                </div>

                {/* Cover Image */}
                <div className="form-group">
                  <label className="form-label">Cover Image URL or Upload</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      className="form-control"
                      value={formData.cover_image_url}
                      onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                      placeholder="/api/uploads/..."
                    />
                    <label className="btn ghost sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Upload Cover
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, 'cover_image_url')}
                      />
                    </label>
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  />
                  <label htmlFor="is_published" style={{ fontSize: '14px', fontWeight: 600 }}>
                    Published (Visible on public website)
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn ghost sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary sm">
                  {editingId ? 'Save Changes' : 'Create Episode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Podcast Episode"
        message={`Are you sure you want to delete "${selectedPodcast?.title}"? This action cannot be undone.`}
        confirmText="Delete Episode"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default PodcastsManager;
