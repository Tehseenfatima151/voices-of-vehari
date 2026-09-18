import React, { useState, useEffect } from 'react';
import api from '../services/api';

const CATEGORIES = ['All', 'Education', 'Community', 'Culture', 'Nature', 'Daily Life', 'Academic', 'Communication'];
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const PARTS_OF_SPEECH = ['noun', 'verb', 'adjective', 'adverb', 'phrase'];

const emptyForm = {
  word: '',
  part_of_speech: 'noun',
  meaning: '',
  example_sentence: '',
  category: 'Education',
  level: 'Intermediate',
  display_order: 0,
  is_published: true,
};

export const VocabularyManager = () => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterLevel, setFilterLevel] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const loadWords = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminVocabulary();
      setWords(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('Failed to load vocabulary words', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWords();
  }, []);

  const openAdd = () => {
    setEditingWord(null);
    setForm({ ...emptyForm, display_order: words.length + 1 });
    setModalOpen(true);
  };

  const openEdit = (w) => {
    setEditingWord(w);
    setForm({
      word: w.word || '',
      part_of_speech: w.part_of_speech || 'noun',
      meaning: w.meaning || '',
      example_sentence: w.example_sentence || '',
      category: w.category || 'Education',
      level: w.level || 'Intermediate',
      display_order: w.display_order ?? 0,
      is_published: w.is_published !== false,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingWord(null);
    setForm(emptyForm);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.word.trim()) { showToast('Word is required', 'error'); return; }
    if (!form.meaning.trim()) { showToast('Meaning is required', 'error'); return; }
    setSaving(true);
    try {
      if (editingWord) {
        await api.updateVocabularyWord(editingWord.id, form);
        showToast('Word updated successfully');
      } else {
        await api.createVocabularyWord(form);
        showToast('Word added successfully');
      }
      closeModal();
      await loadWords();
    } catch {
      showToast('Failed to save word', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (w) => {
    try {
      await api.toggleVocabularyPublish(w.id);
      showToast(w.is_published ? 'Word unpublished' : 'Word published');
      await loadWords();
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteVocabularyWord(id);
      showToast('Word deleted');
      setDeleteConfirm(null);
      await loadWords();
    } catch {
      showToast('Failed to delete word', 'error');
    }
  };

  const filtered = words.filter((w) => {
    const matchSearch = !search ||
      w.word?.toLowerCase().includes(search.toLowerCase()) ||
      w.meaning?.toLowerCase().includes(search.toLowerCase()) ||
      w.category?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'All' || w.category === filterCategory;
    const matchLevel = filterLevel === 'All' || w.level === filterLevel;
    return matchSearch && matchCat && matchLevel;
  });

  const levelColor = (level) => {
    if (level === 'Beginner') return { background: '#e8f5e9', color: '#2e7d32' };
    if (level === 'Advanced') return { background: '#fce4ec', color: '#c62828' };
    return { background: '#e3f2fd', color: '#1565c0' };
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          padding: '12px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
          background: toast.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: toast.type === 'error' ? '#991b1b' : '#065f46',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 4px' }}>📖 Vocabulary Manager</h2>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '14px' }}>
            Manage vocabulary words shown on the public Vocabulary page · {words.length} words total
          </p>
        </div>
        <button className="btn primary" onClick={openAdd}>+ Add Word</button>
      </div>

      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="admin-input"
            placeholder="🔍 Search words, meanings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: '1', minWidth: '200px' }}
          />
          <select className="admin-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ width: 'auto' }}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="admin-input" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} style={{ width: 'auto' }}>
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
          {(search || filterCategory !== 'All' || filterLevel !== 'All') && (
            <button className="btn ghost sm" onClick={() => { setSearch(''); setFilterCategory('All'); setFilterLevel('All'); }}>
              Clear Filters
            </button>
          )}
        </div>
        <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--muted)' }}>
          Showing {filtered.length} of {words.length} words
        </div>
      </div>

      {/* Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Loading vocabulary words...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            No words found.{' '}
            {(search || filterCategory !== 'All' || filterLevel !== 'All')
              ? <button className="btn ghost sm" onClick={() => { setSearch(''); setFilterCategory('All'); setFilterLevel('All'); }}>Clear Filters</button>
              : <button className="btn primary sm" onClick={openAdd}>Add First Word</button>
            }
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--line)' }}>
                  {['#', 'Word', 'Part of Speech', 'Category', 'Level', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((w, i) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid var(--line)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '13px' }}>{i + 1}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '15px' }}>{w.word}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.meaning}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--ink)', fontStyle: 'italic' }}>{w.part_of_speech}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: '#f0f4ff', color: 'var(--navy)', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{w.category}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ ...levelColor(w.level), padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{w.level}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        className={`badge ${w.is_published ? 'published' : 'draft'}`}
                        style={{ cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}
                        title="Click to toggle publish"
                        onClick={() => handleTogglePublish(w)}
                      >
                        {w.is_published ? '● Published' : '○ Draft'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn ghost sm" onClick={() => openEdit(w)}>Edit</button>
                        <button className="btn danger sm" onClick={() => setDeleteConfirm(w)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ maxWidth: '600px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--navy)', fontWeight: 800 }}>
                {editingWord ? '✏️ Edit Word' : '➕ Add New Word'}
              </h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '24px', display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="admin-label">Word *</label>
                  <input className="admin-input" required placeholder="e.g. Resilience"
                    value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} />
                </div>
                <div>
                  <label className="admin-label">Part of Speech *</label>
                  <select className="admin-input" value={form.part_of_speech} onChange={(e) => setForm({ ...form, part_of_speech: e.target.value })}>
                    {PARTS_OF_SPEECH.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="admin-label">Meaning / Definition *</label>
                <textarea className="admin-input" required rows={3} placeholder="A clear, student-friendly definition..."
                  value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                  style={{ resize: 'vertical' }} />
              </div>

              <div>
                <label className="admin-label">Example Sentence</label>
                <textarea className="admin-input" rows={2} placeholder="Use the word in a sentence from a local context..."
                  value={form.example_sentence} onChange={(e) => setForm({ ...form, example_sentence: e.target.value })}
                  style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="admin-label">Category</label>
                  <select className="admin-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="admin-label">Level</label>
                  <select className="admin-input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                    {LEVELS.filter((l) => l !== 'All').map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="admin-label">Display Order</label>
                  <input className="admin-input" type="number" min="0"
                    value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id="vocab-published" checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
                <label htmlFor="vocab-published" style={{ fontSize: '14px', color: 'var(--ink)', cursor: 'pointer' }}>
                  Publish immediately (visible on public site)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                <button type="button" className="btn ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingWord ? 'Save Changes' : 'Add Word')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: '420px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: '#dc2626', fontSize: '18px', fontWeight: 800 }}>🗑️ Delete Word</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ marginTop: 0, color: 'var(--ink)' }}>
                Are you sure you want to delete <strong>"{deleteConfirm.word}"</strong>? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn danger" onClick={() => handleDelete(deleteConfirm.id)}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyManager;
