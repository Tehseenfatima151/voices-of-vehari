import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const TimelineManager = () => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    phase_number: 1,
    duration: '',
    title: '',
    paragraphs: '',
  });

  const { addToast } = useToast();

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminTimeline();
      setTimeline(res);
    } catch {
      addToast('Failed to load methodology timeline', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, []);

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      phase_number: item.phase_number,
      duration: item.duration || '',
      title: item.title || '',
      paragraphs: (item.paragraphs || []).join('\n\n'),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      paragraphs: formData.paragraphs.split('\n\n').map((p) => p.trim()).filter(Boolean),
    };

    try {
      await api.updateTimeline(editingItem.id, payload);
      addToast('Timeline phase updated successfully!', 'success');
      setModalOpen(false);
      loadTimeline();
    } catch (err) {
      addToast('Failed to update timeline', 'error');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
          Methodology Timeline Phases
        </h2>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Manage the 12-month implementation methodology phases and activity breakdowns.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {loading ? (
          <div style={{ color: 'var(--muted)' }}>Loading timeline...</div>
        ) : (
          timeline.map((item) => (
            <div key={item.id} className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '14px', borderRadius: '50%' }}>
                    {item.phase_number}
                  </div>
                  <div>
                    <span className="eyebrow" style={{ margin: 0 }}>{item.duration}</span>
                    <h3 style={{ margin: 0, color: 'var(--navy)' }}>{item.title}</h3>
                  </div>
                </div>
                <button className="btn ghost sm" onClick={() => openEditModal(item)}>
                  Edit Phase
                </button>
              </div>

              <div style={{ color: '#4d6078', fontSize: '14px', display: 'grid', gap: '10px' }}>
                {(item.paragraphs || []).map((p, pIdx) => (
                  <p key={pIdx} style={{ margin: 0 }}>{p}</p>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--navy)' }}>Edit Methodology Phase {editingItem?.phase_number}</h3>
              <button style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: '20px' }} onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="two-col" style={{ gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Duration Label</label>
                    <input
                      className="form-control"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g. Months 1–3"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phase Title</label>
                    <input
                      className="form-control"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Getting Ready"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Activities / Paragraphs (Separate paragraphs with double enter)</label>
                  <textarea
                    rows="8"
                    className="form-control"
                    value={formData.paragraphs}
                    onChange={(e) => setFormData({ ...formData, paragraphs: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn ghost sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineManager;
