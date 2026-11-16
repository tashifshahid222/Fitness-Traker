import { FiAlertTriangle } from 'react-icons/fi';

function ErrorState({ message = 'Something went wrong.', onRetry, title = 'Something went wrong' }) {
  return (
    <div className="empty-state error-state" role="alert">
      <span className="empty-icon" aria-hidden="true">
        <FiAlertTriangle />
      </span>
      <h3>{title}</h3>
      <p className="muted">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={() => onRetry()}>
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorState;
