import { useEffect } from 'react';
import { useToastStore } from '@/store/toast';
import '../styles/Toast.css';

export function Toast() {
  const { toasts, hideToast } = useToastStore();

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

function ToastItem({ message, type, onClose }: ToastItemProps) {
  useEffect(() => {
    // Auto-close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }[type];

  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="polite">
      <div className="toast-icon">{icon}</div>
      <span className="toast-message">{message}</span>
      <button
        onClick={onClose}
        className="toast-close"
        aria-label="Close notification"
        type="button"
      >
        ×
      </button>
    </div>
  );
}
