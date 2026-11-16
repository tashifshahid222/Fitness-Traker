import '../styles/pages/support.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiSend, FiLock, FiMessageSquare } from 'react-icons/fi';
import supportService from '../services/supportService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { Stagger, StaggerItem } from '../components/Transitions';
import { useToast } from '../context/ToastContext';
import { formatDateTime } from '../utils/format';
import { extractError, extractFieldErrors } from '../services/api';

const TYPES = [
  { key: 'problem', label: 'Problem', tone: 'error' },
  { key: 'feedback', label: 'Feedback', tone: 'info' },
  { key: 'question', label: 'Question', tone: 'warn' },
];

const TONE = { problem: 'error', feedback: 'info', question: 'warn', open: 'success', closed: 'neutral' };

function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ type: 'problem', subject: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const detailRequestId = useRef(0);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await supportService.list({ limit: 50 });
      setTickets(res.data);
    } catch (err) {
      setError(extractError(err, 'Could not load support tickets'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openTicket = async (ticket) => {
    const requestId = detailRequestId.current + 1;
    detailRequestId.current = requestId;
    setDetailError('');
    setSelected(ticket);
    setDetailLoading(true);

    try {
      const res = await supportService.get(ticket._id);
      if (detailRequestId.current === requestId) setSelected(res.data);
    } catch (err) {
      if (detailRequestId.current === requestId) {
        setDetailError(extractError(err, 'Could not load ticket'));
      }
    } finally {
      if (detailRequestId.current === requestId) setDetailLoading(false);
    }
  };

  const closeTicketDetails = () => {
    detailRequestId.current += 1;
    setSelected(null);
    setDetailLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    setFieldErrors({});
    try {
      await supportService.create(form);
      setFormOpen(false);
      setForm({ type: 'problem', subject: '', message: '' });
      load();
      toast.success('Ticket created', 'Thanks — our team will get back to you soon.');
    } catch (err) {
      setFormError(extractError(err, 'Could not submit ticket'));
      setFieldErrors(extractFieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (!selected) return undefined;
    await supportService.close(selected._id);
    const updated = { ...selected, status: 'closed' };
    setSelected(updated);
    setTickets((ts) => ts.map((t) => (t._id === updated._id ? updated : t)));
    toast.success('Ticket closed', 'This ticket is now marked as closed.');
    return undefined;
  };

  if (loading) return <LoadingSpinner label="Loading support…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Support</h1>
          <p className="muted">Problems, feedback, and questions</p>
        </div>
        <button type="button" className="btn" onClick={() => setFormOpen(true)}>
          <FiSend /> New ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={<FiMessageSquare />}
          title="No tickets yet"
          message="Found a bug or want a feature? Open a ticket."
          action={
            <button type="button" className="btn" onClick={() => setFormOpen(true)}>
              <FiSend /> New ticket
            </button>
          }
        />
      ) : (
        <Stagger className="ticket-grid" as="div">
          {tickets.map((t) => (
            <StaggerItem as="div" hover key={t._id}>
              <div className="card ticket-card">
                <div className="card-head">
                  <button type="button" className="link-btn ticket-subject" onClick={() => openTicket(t)}>
                    {t.subject}
                  </button>
                  <span className="btn-row">
                    <Badge tone={TONE[t.type] || 'neutral'}>{t.type}</Badge>
                    <Badge tone={TONE[t.status] || 'neutral'}>{t.status}</Badge>
                  </span>
                </div>
                <div className="ticket-foot">
                  <span className="list-meta">{formatDateTime(t.createdAt)}</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => openTicket(t)}>
                    View
                  </button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Modal open={formOpen} title="New support ticket" onClose={() => setFormOpen(false)}>
        {formError && <div className="alert alert-error">{formError}</div>}
        <form onSubmit={handleCreate} noValidate className="form-stack">
          <div className="form-group">
            <label htmlFor="ticket-type">Type</label>
            <Select
              id="ticket-type"
              ariaLabel="Type"
              value={form.type}
              onChange={(v) => setForm((f) => ({ ...f, type: v }))}
              options={TYPES.map((t) => ({ value: t.key, label: t.label }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="ticket-subject">Subject</label>
            <input id="ticket-subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} aria-invalid={!!fieldErrors.subject} />
            {fieldErrors.subject && <p className="field-error">{fieldErrors.subject}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="ticket-message">Message</label>
            <textarea
              id="ticket-message"
              rows="5"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              aria-invalid={!!fieldErrors.message}
            />
            {fieldErrors.message && <p className="field-error">{fieldErrors.message}</p>}
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Submitting…' : 'Submit ticket'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!selected} title={selected?.subject} onClose={closeTicketDetails} footer={selected?.status === 'open' ? (
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            <FiLock /> Close ticket
          </button>
        ) : null}
      >
        {detailError && <div className="alert alert-error">{detailError}</div>}
        {detailLoading && <LoadingSpinner label="Loading ticket details…" compact />}
        {selected && (
          <div className="ticket-detail">
            <dl className="detail-list">
              <div className="detail-row">
                <dt>Type</dt>
                <dd>
                  <Badge tone={TONE[selected.type] || 'neutral'}>{selected.type}</Badge>
                </dd>
              </div>
              <div className="detail-row">
                <dt>Status</dt>
                <dd>
                  <Badge tone={TONE[selected.status] || 'neutral'}>{selected.status}</Badge>
                </dd>
              </div>
              <div className="detail-row">
                <dt>Created</dt>
                <dd>{formatDateTime(selected.createdAt)}</dd>
              </div>
            </dl>
            <p>{selected.message || 'No message.'}</p>
            <div className="reply-bubble">
              <FiMessageSquare />
              <p className="muted">Our team responds here. Sit tight — replies outside the app are a future enhancement.</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Support;
