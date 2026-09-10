import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

export const StatsManager = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    value: '',
    label: '',
    sort_order: 0,
    is_active: true,
  });

  const { addToast } = useToast();

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminStatistics();
      setStats(res);
    } catch {
      addToast('Failed to load statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ value: '', label: '', sort_order: stats.length + 1, is_active: true });
    setModalOpen(true);
  };

  const openEditModal = (s) => {
    setEditingId(s.id);
    setFormData({
      value: s.value || '',
      label: s.label || '',
      sort_order: s.sort_order || 0,
      is_active: s.is_active,
    });
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStat) return;
    try {
      await api.deleteStatistic(selectedStat.id);
      addToast('Statistic deleted', 'success');
      setDeleteModalOpen(false);
      setSelectedStat(null);
      loadStats();
    } catch {
      addToast('Failed to delete statistic', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateStatistic(editingId, formData);
        addToast('Statistic updated successfully', 'success');
      } else {
        await api.createStatistic(formData);
        addToast('Statistic added successfully', 'success');
      }
      setModalOpen(false);
      loadStats();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving statistic', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
            Homepage Project Statistics
          </h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Manage the "Project at a glance" numerical indicators displayed on the homepage.
          </p>
        </div>
        <button className="btn primary sm" onClick={openCreateModal}>
          + Add Statistic
        </button>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Number / Metric</th>
              <th>Description Label</th>
              <th>Order</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>Loading statistics...</td>
              </tr>
            ) : stats.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>No statistics found.</td>
              </tr>
            ) : (
              stats.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong style={{ fontSize: '24px', color: 'var(--navy)' }}>{s.value}</strong>
                  </td>
                  <td>
                    <span style={{ color: '#28405f', fontWeight: 600 }}>{s.label}</span>
                  </td>
                  <td>{s.sort_order}</td>
                  <td>
                    <span className={`badge ${s.is_active ? 'active' : 'inactive'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn ghost sm" style={{ marginRight: '6px' }} onClick={() => openEditModal(s)}>
                      Edit
                    </button>
                    <button
                      className="btn danger sm"
                      onClick={() => {
                        setSelectedStat(s);
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

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--navy)' }}>
                {editingId ? 'Edit Metric' : 'Add Metric'}
              </h3>
              <button style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: '20px' }} onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="two-col" style={{ gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Value (e.g. 12, 20, 100+)</label>
                    <input
                      className="form-control"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sort Order</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description Label</label>
                  <input
                    className="form-control"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="e.g. Months of project activity"
                    required
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="stat_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <label htmlFor="stat_active" style={{ fontSize: '14px', fontWeight: 600 }}>
                    Active (Shown on homepage)
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn ghost sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary sm">
                  Save Metric
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Statistic"
        message={`Delete statistic "${selectedStat?.value} - ${selectedStat?.label}"?`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default StatsManager;
