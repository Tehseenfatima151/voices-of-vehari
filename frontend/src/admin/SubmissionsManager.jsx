import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

export const SubmissionsManager = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);

  const { addToast } = useToast();

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminSubmissions();
      setSubmissions(res);
    } catch {
      addToast('Failed to load inquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateSubmissionStatus(id, newStatus);
      addToast(`Status updated to ${newStatus}`, 'success');
      loadSubmissions();
    } catch {
      addToast('Failed to update status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSub) return;
    try {
      await api.deleteSubmission(selectedSub.id);
      addToast('Inquiry deleted', 'success');
      setDeleteModalOpen(false);
      setSelectedSub(null);
      loadSubmissions();
    } catch {
      addToast('Failed to delete inquiry', 'error');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
          Contact Messages & Inquiries
        </h2>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Review guest suggestions, story submissions, and collaboration proposals from the community.
        </p>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Sender</th>
              <th>Intent / Topic</th>
              <th>Message Content</th>
              <th>Received</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Loading inquiries...</td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No messages received yet.</td>
              </tr>
            ) : (
              submissions.map((s) => (
                <tr key={s.id} style={{ background: s.status === 'unread' ? '#fafcff' : 'white' }}>
                  <td>
                    <strong style={{ color: 'var(--navy)', display: 'block' }}>{s.name}</strong>
                    <a href={`mailto:${s.email}`} style={{ fontSize: '13px', color: 'var(--teal)' }}>
                      {s.email}
                    </a>
                  </td>
                  <td>
                    <span className="tag" style={{ margin: 0 }}>{s.intent}</span>
                  </td>
                  <td style={{ maxWidth: '350px' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
                      {s.message}
                    </p>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recent'}
                  </td>
                  <td>
                    <select
                      value={s.status}
                      onChange={(e) => handleStatusChange(s.id, e.target.value)}
                      className="form-control"
                      style={{ padding: '4px 8px', fontSize: '12px', width: '100px' }}
                    >
                      <option value="unread">Unread</option>
                      <option value="read">Read</option>
                      <option value="replied">Replied</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn danger sm"
                      onClick={() => {
                        setSelectedSub(s);
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

      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Inquiry"
        message={`Delete message from "${selectedSub?.name}"?`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default SubmissionsManager;
