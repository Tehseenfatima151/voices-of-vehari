import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

export const CardsManager = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('home_idea');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    section_group: 'home_idea',
    icon: '',
    tag: '',
    title: '',
    description: '',
    bullets: '',
    is_active: true,
  });

  const { addToast } = useToast();

  const groups = [
    { key: 'home_idea', label: 'Home: The Idea (3)' },
    { key: 'about_challenge', label: 'About: Challenges (3)' },
    { key: 'research_objective', label: 'Research: Objectives (4)' },
    { key: 'learning_resource', label: 'Learning: Resources (6)' },
    { key: 'outcome_item', label: 'Outcomes: Planned (5)' },
    { key: 'news_event', label: 'News & Events (6)' },
    { key: 'gallery_theme', label: 'Gallery: Themes (6)' },
  ];

  const loadCards = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminCards(selectedGroup);
      setCards(res);
    } catch {
      addToast('Failed to load cards', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [selectedGroup]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      section_group: selectedGroup,
      icon: '',
      tag: '',
      title: '',
      description: '',
      bullets: '',
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingId(c.id);
    setFormData({
      section_group: c.section_group,
      icon: c.icon || '',
      tag: c.tag || '',
      title: c.title || '',
      description: c.description || '',
      bullets: (c.bullets || []).join('\n'),
      is_active: c.is_active,
    });
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCard) return;
    try {
      await api.deleteCard(selectedCard.id);
      addToast('Card deleted', 'success');
      setDeleteModalOpen(false);
      setSelectedCard(null);
      loadCards();
    } catch {
      addToast('Failed to delete card', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      bullets: formData.bullets
        ? formData.bullets.split('\n').map((b) => b.trim()).filter(Boolean)
        : [],
    };

    try {
      if (editingId) {
        await api.updateCard(editingId, payload);
        addToast('Card updated successfully', 'success');
      } else {
        await api.createCard(payload);
        addToast('New card added successfully', 'success');
      }
      setModalOpen(false);
      loadCards();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving card', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
            Content Cards & Section Blocks
          </h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Manage modular cards across Home, About, Research, Learning, Outcomes, and News sections.
          </p>
        </div>
        <button className="btn primary sm" onClick={openCreateModal}>
          + Add New Card
        </button>
      </div>

      <div className="filters">
        {groups.map((g) => (
          <button
            key={g.key}
            className={`filter ${selectedGroup === g.key ? 'active' : ''}`}
            onClick={() => setSelectedGroup(g.key)}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Icon/Tag</th>
              <th>Card Title</th>
              <th>Description</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>Loading cards...</td>
              </tr>
            ) : cards.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>No cards in this section yet.</td>
              </tr>
            ) : (
              cards.map((c) => (
                <tr key={c.id}>
                  <td style={{ width: '100px' }}>
                    {c.icon && <span style={{ fontSize: '20px' }}>{c.icon}</span>}
                    {c.tag && <span className="tag" style={{ margin: 0 }}>{c.tag}</span>}
                  </td>
                  <td>
                    <strong style={{ color: 'var(--navy)' }}>{c.title}</strong>
                    {c.bullets && c.bullets.length > 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                        {c.bullets.length} bullet point(s)
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '13px', maxWidth: '400px' }}>
                    {c.description}
                  </td>
                  <td>
                    <span className={`badge ${c.is_active ? 'active' : 'inactive'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn ghost sm" style={{ marginRight: '6px' }} onClick={() => openEditModal(c)}>
                      Edit
                    </button>
                    <button
                      className="btn danger sm"
                      onClick={() => {
                        setSelectedCard(c);
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

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--navy)' }}>
                {editingId ? 'Edit Section Card' : 'Add Section Card'}
              </h3>
              <button style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: '20px' }} onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Target Section Group</label>
                  <select
                    className="form-control"
                    value={formData.section_group}
                    onChange={(e) => setFormData({ ...formData, section_group: e.target.value })}
                  >
                    {groups.map((g) => (
                      <option key={g.key} value={g.key}>{g.label}</option>
                    ))}
                  </select>
                </div>

                <div className="two-col" style={{ gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Icon / Emoji (Optional)</label>
                    <input
                      className="form-control"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="e.g. 🎙️ or 01"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Badge Tag (Optional)</label>
                    <input
                      className="form-control"
                      value={formData.tag}
                      onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                      placeholder="e.g. Planned"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Card Title</label>
                  <input
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bullet Items (One per line, optional)</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    value={formData.bullets}
                    onChange={(e) => setFormData({ ...formData, bullets: e.target.value })}
                    placeholder="Main-idea questions&#10;Detail questions"
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="card_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <label htmlFor="card_active" style={{ fontSize: '14px', fontWeight: 600 }}>
                    Active (Visible on public website)
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn ghost sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary sm">
                  {editingId ? 'Save Changes' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Card"
        message={`Delete card "${selectedCard?.title}"?`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default CardsManager;
