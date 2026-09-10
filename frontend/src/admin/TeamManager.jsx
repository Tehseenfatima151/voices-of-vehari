import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

export const TeamManager = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    role_category: 'student',
    designation: 'Student Team',
    initials: '',
    bio: '',
    sort_order: 0,
    is_active: true,
  });

  const { addToast } = useToast();

  const loadTeam = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminTeam();
      setTeam(res);
    } catch {
      addToast('Failed to load team members', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      role_category: 'student',
      designation: 'Student Team',
      initials: '',
      bio: '',
      sort_order: team.length + 1,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (m) => {
    setEditingId(m.id);
    setFormData({
      name: m.name || '',
      role_category: m.role_category || 'student',
      designation: m.designation || '',
      initials: m.initials || '',
      bio: m.bio || '',
      sort_order: m.sort_order || 0,
      is_active: m.is_active,
    });
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMember) return;
    try {
      await api.deleteTeamMember(selectedMember.id);
      addToast('Team member removed', 'success');
      setDeleteModalOpen(false);
      setSelectedMember(null);
      loadTeam();
    } catch {
      addToast('Failed to delete team member', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateTeamMember(editingId, formData);
        addToast('Team member updated', 'success');
      } else {
        await api.createTeamMember(formData);
        addToast('Team member added', 'success');
      }
      setModalOpen(false);
      loadTeam();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving team member', 'error');
    }
  };

  const filteredTeam = team.filter((m) => {
    if (selectedRole === 'all') return true;
    return m.role_category === selectedRole;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
            Team & Contributors
          </h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Manage project leadership, mentors, student contributors and podcast guests.
          </p>
        </div>
        <button className="btn primary sm" onClick={openCreateModal}>
          + Add Team Member
        </button>
      </div>

      <div className="filters">
        {['all', 'leadership', 'mentor', 'student', 'contributor'].map((r) => (
          <button
            key={r}
            className={`filter ${selectedRole === r ? 'active' : ''}`}
            onClick={() => setSelectedRole(r)}
          >
            {r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Member</th>
              <th>Category</th>
              <th>Designation</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>Loading members...</td>
              </tr>
            ) : filteredTeam.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>No members in this category.</td>
              </tr>
            ) : (
              filteredTeam.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="avatar" style={{ width: '42px', height: '42px', fontSize: '14px' }}>
                        {m.initials || 'IS'}
                      </div>
                      <strong style={{ color: 'var(--navy)' }}>{m.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="tag" style={{ textTransform: 'capitalize', margin: 0 }}>{m.role_category}</span>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '13px' }}>{m.designation}</td>
                  <td>
                    <span className={`badge ${m.is_active ? 'active' : 'inactive'}`}>
                      {m.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn ghost sm" style={{ marginRight: '6px' }} onClick={() => openEditModal(m)}>
                      Edit
                    </button>
                    <button
                      className="btn danger sm"
                      onClick={() => {
                        setSelectedMember(m);
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

      {/* Edit / Add Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--navy)' }}>
                {editingId ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <button style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: '20px' }} onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="two-col" style={{ gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Role Category</label>
                    <select
                      className="form-control"
                      value={formData.role_category}
                      onChange={(e) => setFormData({ ...formData, role_category: e.target.value })}
                    >
                      <option value="leadership">Leadership</option>
                      <option value="mentor">Mentor</option>
                      <option value="student">Student Team</option>
                      <option value="contributor">Contributor / Host</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Initials (for Avatar)</label>
                    <input
                      className="form-control"
                      value={formData.initials}
                      onChange={(e) => setFormData({ ...formData, initials: e.target.value })}
                      placeholder="e.g. IS"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Designation / Project Role</label>
                  <input
                    className="form-control"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Principal Investigator · Principal Author"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bio (Optional)</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="member_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <label htmlFor="member_active" style={{ fontSize: '14px', fontWeight: 600 }}>
                    Active (Displayed on public website)
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn ghost sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary sm">
                  {editingId ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Remove Member"
        message={`Are you sure you want to remove "${selectedMember?.name}" from the team list?`}
        confirmText="Remove"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default TeamManager;
