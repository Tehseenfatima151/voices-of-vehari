import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

export const StoriesManager = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category_tag: 'Folklore',
    excerpt: '',
    content: '',
    author: 'Voices of Vehari Team',
    is_published: true,
  });

  const { addToast } = useToast();

  const loadStories = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminStories();
      setStories(res);
    } catch {
      addToast('Failed to load stories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      category_tag: 'Folklore',
      excerpt: '',
      content: '',
      author: 'Voices of Vehari Team',
      is_published: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (s) => {
    setEditingId(s.id);
    setFormData({
      title: s.title || '',
      category_tag: s.category_tag || 'Folklore',
      excerpt: s.excerpt || '',
      content: s.content || '',
      author: s.author || 'Voices of Vehari Team',
      is_published: s.is_published,
    });
    setModalOpen(true);
  };

  const handleTogglePublish = async (id) => {
    try {
      const res = await api.toggleStoryPublish(id);
      if (res.success) {
        addToast(res.message, 'success');
        loadStories();
      }
    } catch {
      addToast('Failed to toggle status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStory) return;
    try {
      await api.deleteStory(selectedStory.id);
      addToast('Story deleted', 'success');
      setDeleteModalOpen(false);
      setSelectedStory(null);
      loadStories();
    } catch {
      addToast('Failed to delete story', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateStory(editingId, formData);
        addToast('Story updated successfully', 'success');
      } else {
        await api.createStory(formData);
        addToast('New story created successfully', 'success');
      }
      setModalOpen(false);
      loadStories();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving story', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
            Cultural Stories Collection
          </h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Manage local folklore, customs, rural life, history, food, and youth community stories.
          </p>
        </div>
        <button className="btn primary sm" onClick={openCreateModal}>
          + Add New Story
        </button>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category Tag</th>
              <th>Excerpt</th>
              <th>Author</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Loading stories...</td>
              </tr>
            ) : stories.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No stories found. Add your first story!</td>
              </tr>
            ) : (
              stories.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong style={{ color: 'var(--navy)' }}>{s.title}</strong>
                  </td>
                  <td>
                    <span className="tag" style={{ margin: 0 }}>{s.category_tag}</span>
                  </td>
                  <td style={{ maxWidth: '350px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.excerpt}
                    </div>
                  </td>
                  <td style={{ fontSize: '13px' }}>{s.author}</td>
                  <td>
                    <button
                      onClick={() => handleTogglePublish(s.id)}
                      className={`badge ${s.is_published ? 'published' : 'draft'}`}
                      style={{ border: 0, cursor: 'pointer' }}
                    >
                      {s.is_published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn ghost sm" style={{ marginRight: '6px' }} onClick={() => openEditModal(s)}>
                      Edit
                    </button>
                    <button
                      className="btn danger sm"
                      onClick={() => {
                        setSelectedStory(s);
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
                {editingId ? 'Edit Cultural Story' : 'Add New Story'}
              </h3>
              <button style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: '20px' }} onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Story Title</label>
                  <input
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="two-col" style={{ gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Category Tag</label>
                    <select
                      className="form-control"
                      value={formData.category_tag}
                      onChange={(e) => setFormData({ ...formData, category_tag: e.target.value })}
                    >
                      <option value="Folklore">Folklore</option>
                      <option value="Customs">Customs</option>
                      <option value="Rural life">Rural life</option>
                      <option value="History">History</option>
                      <option value="Food">Food</option>
                      <option value="Youth">Youth</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Author / Contributor</label>
                    <input
                      className="form-control"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Short Excerpt (Shown on Cards)</label>
                  <textarea
                    rows="2"
                    className="form-control"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Full Narrative / Content</label>
                  <textarea
                    rows="5"
                    className="form-control"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter full text, translanguaging notes, and learning connections..."
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="story_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  />
                  <label htmlFor="story_published" style={{ fontSize: '14px', fontWeight: 600 }}>
                    Published (Visible on public Stories view)
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn ghost sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary sm">
                  {editingId ? 'Save Changes' : 'Create Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Story"
        message={`Are you sure you want to delete "${selectedStory?.title}"?`}
        confirmText="Delete Story"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default StoriesManager;
