import { FiInbox } from 'react-icons/fi';

function EmptyState({ title = 'Nothing here yet', message, action, icon }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        {icon || <FiInbox />}
      </span>
      <h3>{title}</h3>
      {message && <p className="muted">{message}</p>}
      {action}
    </div>
  );
}

export default EmptyState;
