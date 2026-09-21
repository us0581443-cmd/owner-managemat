import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        {type === 'success' ? (
          <CheckCircle2 size={18} color="var(--color-mint)" />
        ) : (
          <AlertCircle size={18} color="var(--color-coral)" />
        )}
        <span>{message}</span>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: '6px' }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
