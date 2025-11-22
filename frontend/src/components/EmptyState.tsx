import '../styles/theme.css';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = '📭', title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorState({ title = 'Error', message, retry }: ErrorStateProps) {
  return (
    <div className="error-state">
      <div className="error-state-title">{title}</div>
      <div className="error-state-message">{message}</div>
      {retry && (
        <button
          onClick={retry}
          className="btn-secondary"
          style={{ marginTop: 'var(--spacing-md)' }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
