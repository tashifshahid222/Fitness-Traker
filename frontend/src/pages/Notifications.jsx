import { useCallback, useEffect, useState } from 'react';
import { FiBell, FiCheck, FiCheckCircle, FiTrash2, FiTarget, FiAlertTriangle, FiInfo, FiActivity } from 'react-icons/fi';
import notificationService from '../services/notificationService';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import ConfirmDialog from '../components/ConfirmDialog';
import { Stagger, StaggerItem } from '../components/Transitions';
import { formatDateTime } from '../utils/format';
import { extractError } from '../services/api';

function Notifications() {
  const [query, setQuery] = useState({ page: 1, limit: 12, unreadOnly: false });
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await notificationService.list({ page: query.page, limit: query.limit, ...(query.unreadOnly ? { unread: 'true' } : {}) });
      setItems(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(extractError(err, 'Could not load notifications'));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id) => {
    await notificationService.markRead(id);
    window.dispatchEvent(new Event('notifications:changed'));
    load();
  };

  const markAllRead = async () => {
    await notificationService.markAllRead();
    window.dispatchEvent(new Event('notifications:changed'));
    load();
  };

  const handleDelete = async () => {
    if (!pendingDelete) return undefined;
    setPendingDelete(null);
    await notificationService.remove(pendingDelete);
    if (items.length === 1 && query.page > 1) setQuery((q) => ({ ...q, page: q.page - 1 }));
    else load();
    return undefined;
  };

  const TYPE_META = {
    goal: { icon: <FiTarget />, tone: 'success', label: 'Goal achieved' },
    reminder: { icon: <FiAlertTriangle />, tone: 'warn', label: 'Reminder' },
    workout: { icon: <FiActivity />, tone: 'accent', label: 'Workout' },
    system: { icon: <FiInfo />, tone: 'info', label: 'System' },
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Notifications</h1>
          <p className="muted">{meta?.unreadCount != null ? `${meta.unreadCount} unread` : 'Stay in the loop'}</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={markAllRead}>
          <FiCheckCircle /> Mark all read
        </button>
      </div>

      <div className="toolbar">
        <label className="checkbox-label">
          <input type="checkbox" checked={query.unreadOnly} onChange={(e) => setQuery((q) => ({ ...q, unreadOnly: e.target.checked, page: 1 }))} />
          Unread only
        </label>
      </div>

      {loading && !items.length ? (
        <LoadingSpinner label="Loading notifications…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState icon={<FiBell />} title="No notifications" message="Break a goal and you'll get pinged here." />
      ) : (
        <>
          <Stagger className="notif-list" as="ul">
            {items.map((n) => {
              const metaInfo = TYPE_META[n.type] || TYPE_META.system;
              return (
                <StaggerItem
                  as="li"
                  hover
                  key={n._id}
                  className={`notif-item card ${n.isRead ? '' : 'unread'}`}
                >
                  <span className={`notif-icon ${metaInfo.tone}`}>{metaInfo.icon}</span>
                  <div className="notif-body">
                    <div className="notif-top">
                      <strong>{n.title}</strong>
                      <Badge tone={metaInfo.tone}>{metaInfo.label}</Badge>
                    </div>
                    <p className="muted">{n.message}</p>
                    <span className="notif-time">{formatDateTime(n.createdAt)}</span>
                  </div>
                  <div className="btn-row">
                    {!n.isRead && (
                      <button type="button" className="icon-btn" title="Mark read" onClick={() => markRead(n._id)}>
                        <FiCheck />
                      </button>
                    )}
                    <button type="button" className="icon-btn danger" title="Delete" onClick={() => setPendingDelete(n._id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
          <Pagination page={query.page} totalPages={meta?.totalPages || 1} onChange={(page) => setQuery((q) => ({ ...q, page }))} />
        </>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete notification?"
        message="This notification will be permanently removed."
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default Notifications;
