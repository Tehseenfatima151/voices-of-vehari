import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

export const MediaLibrary = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const { addToast } = useToast();

  const loadMedia = async () => {
    try {
      setLoading(true);
      const res = await api.getMediaList(filterType === 'all' ? null : filterType);
      setFiles(res);
    } catch {
      addToast('Failed to load media files', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [filterType]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await api.uploadMedia(file, file.name);
      if (res.success) {
        addToast(`Uploaded ${file.name} successfully!`, 'success');
        loadMedia();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    addToast('URL copied to clipboard!', 'info');
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFile) return;
    try {
      await api.deleteMedia(selectedFile.id);
      addToast('File deleted', 'success');
      setDeleteModalOpen(false);
      setSelectedFile(null);
      loadMedia();
    } catch {
      addToast('Failed to delete media file', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
            Media & Asset Library
          </h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Upload and manage images, podcast audio files, posters and project documentation assets.
          </p>
        </div>

        <label className="btn primary sm" style={{ cursor: 'pointer' }}>
          {uploading ? 'Uploading...' : '📁 Upload New File'}
          <input
            type="file"
            accept="image/*,audio/*"
            style={{ display: 'none' }}
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="filters">
        {['all', 'image', 'audio'].map((t) => (
          <button
            key={t}
            className={`filter ${filterType === t ? 'active' : ''}`}
            onClick={() => setFilterType(t)}
          >
            {t === 'all' ? 'All Files' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', padding: '20px' }}>Loading media files...</div>
      ) : files.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📂</div>
          <h3 style={{ color: 'var(--navy)', margin: '0 0 8px' }}>No media uploaded yet</h3>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Use the upload button above to upload podcast audio or pictures.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          {files.map((f) => (
            <div key={f.id} className="admin-card" style={{ padding: '14px' }}>
              {f.file_type === 'image' ? (
                <img
                  src={f.public_url}
                  alt={f.alt_text || f.original_name}
                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px', marginBottom: '10px' }}
                />
              ) : (
                <div style={{ height: '140px', background: '#eef6fb', borderRadius: '10px', display: 'grid', placeItems: 'center', marginBottom: '10px', color: 'var(--teal)', fontSize: '32px' }}>
                  🎵
                </div>
              )}
              <strong style={{ fontSize: '13px', color: 'var(--navy)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.original_name}
              </strong>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                {(f.file_size / 1024).toFixed(1)} KB · {f.file_type}
              </div>

              <div style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn ghost sm"
                  style={{ flex: 1, fontSize: '11px', padding: '5px' }}
                  onClick={() => handleCopyUrl(f.public_url)}
                >
                  Copy URL
                </button>
                <button
                  type="button"
                  className="btn danger sm"
                  style={{ fontSize: '11px', padding: '5px 8px' }}
                  onClick={() => {
                    setSelectedFile(f);
                    setDeleteModalOpen(true);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Media File"
        message={`Delete "${selectedFile?.original_name}"? This file will be permanently removed.`}
        confirmText="Delete File"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default MediaLibrary;
