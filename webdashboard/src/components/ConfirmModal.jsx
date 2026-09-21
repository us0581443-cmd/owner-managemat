import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  confirmVariant = 'coral',
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: confirmVariant === 'coral' ? 'var(--color-coral-light)' : 'var(--color-blue-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: confirmVariant === 'coral' ? 'var(--color-coral)' : 'var(--color-blue)'
            }}>
              <AlertTriangle size={18} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-navy)' }}>{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
          {message}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn btn-${confirmVariant} btn-sm`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
