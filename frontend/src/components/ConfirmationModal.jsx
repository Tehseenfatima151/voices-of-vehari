import React from 'react';

export const ConfirmationModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--navy)' }}>{title}</h3>
          <button
            onClick={onCancel}
            style={{ border: 0, background: 'transparent', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p style={{ margin: 0, color: '#4d6078', fontSize: '15px' }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn ghost sm" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn sm ${confirmVariant === 'danger' ? 'danger' : 'primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
