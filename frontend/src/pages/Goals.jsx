import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiCheck, FiClock, FiTarget, FiCheckCircle } from 'react-icons/fi';
import goalService from '../services/goalService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import { Stagger, StaggerItem, EASE } from '../components/Transitions';
import { formatDate, toISODate } from '../utils/format';
import useWeightUnit from '../hooks/useWeightUnit';
import { extractError, extractFieldErrors } from '../services/api';
import '../styles/pages/goals.css';

const EMPTY_FORM = { title: '', description: '', targetValue: '', currentValue: '', unit: '', deadline: '' };

const WEIGHT_UNITS = ['kg', 'lb'];
const isWeightUnit = (unit) => WEIGHT_UNITS.includes(String(unit || '').trim().toLowerCase());

const RING_R = 34;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;
const PAGE_SIZE = 5;

function daysLeft(deadline) {
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

function GoalRing({ pct }) {
  const done = pct >= 100;
  return (
    <div className="ring-wrap">
      <svg width="84" height="84" aria-hidden="true">
        <circle className="ring-track" cx="42" cy="42" r={RING_R} fill="none" strokeWidth="8" />
        <circle
          className="ring-fill"
          cx="42"
          cy="42"
          r={RING_R}
          fill="none"
          strokeWidth="8"
          stroke={done ? 'var(--ok)' : 'var(--accent)'}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - Math.min(1, pct / 100))}
        />
      </svg>
      <span className="ring-label">
        {Math.round(pct)}%<small>done</small>
      </span>
    </div>
  );
}

function Goals() {
  const wu = useWeightUnit();
  const [active, setActive] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [archivedPage, setArchivedPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [activeRes, archRes] = await Promise.all([goalService.list({ status: 'active', limit: 50 }), goalService.list({ status: 'completed', limit: 50 })]);
      setActive(activeRes.data);
      const abandoned = await goalService.list({ status: 'abandoned', limit: 50 });
      setArchived([...abandoned.data, ...archRes.data]);
    } catch (err) {
      setError(extractError(err, 'Could not load goals'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (goal) => {
    const weightGoal = isWeightUnit(goal.unit);
    setEditing(goal);
    setForm({
      title: goal.title,
      description: goal.description || '',
      targetValue: weightGoal ? wu.raw(goal.targetValue) : goal.targetValue,
      currentValue: goal.currentValue === null || goal.currentValue === undefined ? '' : weightGoal ? wu.raw(goal.currentValue) : goal.currentValue,
      unit: goal.unit || '',
      deadline: goal.deadline ? toISODate(goal.deadline) : '',
    });
    setErrors({});
    setFormError('');
    setModalOpen(true);
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    setErrors({});
    const weightGoal = isWeightUnit(form.unit);
    const payload = {
      title: form.title,
      description: form.description,
      targetValue: weightGoal ? wu.toKg(Number(form.targetValue)) : Number(form.targetValue),
      currentValue: form.currentValue === '' ? undefined : weightGoal ? wu.toKg(Number(form.currentValue)) : Number(form.currentValue),
      unit: form.unit,
      deadline: form.deadline ? form.deadline : undefined,
      status: editing ? editing.status : 'active',
    };
    try {
      if (editing) await goalService.update(editing._id, payload);
      else await goalService.create(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(extractError(err, 'Could not save goal'));
      setErrors(extractFieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return undefined;
    setPendingDelete(null);
    await goalService.remove(pendingDelete);
    load();
    return undefined;
  };

  const handleStatus = async (goal, status) => {
    await goalService.update(goal._id, {
      title: goal.title,
      description: goal.description,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue ?? 0,
      unit: goal.unit,
      deadline: goal.deadline ? toISODate(goal.deadline) : undefined,
      status,
    });
    load();
  };

  if (loading) return <LoadingSpinner label="Loading goals…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const renderGoal = (g, showCompleteAction) => {
    const pct = Math.min(100, Math.max(0, Number(g.progressPercent) || 0));
    const left = g.deadline ? daysLeft(g.deadline) : null;
    const weightGoal = isWeightUnit(g.unit);
    const goalUnit = weightGoal ? wu.unit : g.unit;
    const goalCurrent = weightGoal ? wu.amount(g.currentValue ?? 0) : g.currentValue ?? 0;
    const goalTarget = weightGoal ? wu.amount(g.targetValue) : g.targetValue;
    return (
      <StaggerItem as="div" key={g._id} className={`goal-card ${g.status === 'completed' || pct >= 100 ? 'done' : ''}`} hover>
        <div className="goal-head">
          <div>
            <h3>{g.title}</h3>
            {g.description && <p className="muted">{g.description}</p>}
          </div>
          <div className="goal-badges">
            {pct >= 100 && <Badge tone="success">Achieved</Badge>}
            <Badge tone={g.status === 'active' ? 'success' : g.status === 'completed' ? 'info' : 'neutral'}>{g.status}</Badge>
          </div>
        </div>

        <div className="goal-progress-row">
          <GoalRing pct={pct} />
          <div className="goal-progress-main">
            <ProgressBar value={g.progressPercent} label={`${goalCurrent} / ${goalTarget}${goalUnit ? ` ${goalUnit}` : ''}`} />
            {g.deadline && (
              <p className="muted goal-deadline">
                <FiClock />
                {formatDate(g.deadline)}
                {left !== null && left >= 0 ? ` · ${left} day${left === 1 ? '' : 's'} left` : left !== null ? ' · overdue' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="btn-row">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(g)}>
            <FiEdit /> Edit
          </button>
          {showCompleteAction && g.status === 'active' && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleStatus(g, 'completed')}>
              <FiCheck /> Mark done
            </button>
          )}
          <button type="button" className="icon-btn danger" aria-label="Delete" onClick={() => setPendingDelete(g._id)}>
            <FiTrash2 />
          </button>
        </div>
      </StaggerItem>
    );
  };

  const renderGroup = (goals, label, showCompleteAction, delay, page, setPage) => {
    const totalPages = Math.max(1, Math.ceil(goals.length / PAGE_SIZE));
    const current = Math.min(page, totalPages);
    const rows = goals.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

    return (
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE, delay }}
      >
        <div className="card-head">
          <h2>{label}</h2>
          <span className="chip">{goals.length}</span>
        </div>
        {goals.length === 0 ? (
          <EmptyState
            icon={showCompleteAction ? <FiTarget /> : <FiCheckCircle />}
            title={showCompleteAction ? 'No active goals yet' : 'No finished goals yet'}
            message={showCompleteAction ? 'Set a target and start pushing.' : 'Finished goals land here.'}
          />
        ) : (
          <>
            <Stagger className="goal-list" as="div">
              {rows.map((g) => renderGoal(g, showCompleteAction))}
            </Stagger>
            <Pagination page={current} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </motion.div>
    );
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Goals</h1>
          <p className="muted">Achieved goals notify you the moment you hit them</p>
        </div>
        <button type="button" className="btn" onClick={openCreate}>
          <FiPlus /> New goal
        </button>
      </div>

      <div className="goal-columns">
        {renderGroup(active, 'Active goals', true, 0.05, activePage, setActivePage)}
        {renderGroup(archived, 'Achieved & archived', false, 0.15, archivedPage, setArchivedPage)}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit goal' : 'New goal'}
        onClose={() => setModalOpen(false)}
        size="small"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : 'Save goal'}
            </button>
          </>
        }
      >
        {formError && <div className="alert alert-error">{formError}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="goal-title">Title *</label>
            <input id="goal-title" value={form.title} onChange={set('title')} placeholder="Bench 100 kg" aria-invalid={!!errors.title} />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="goal-description">Description</label>
            <textarea id="goal-description" rows="2" value={form.description} onChange={set('description')} />
          </div>
          <div className="form-row grid-2">
            <div className="form-group">
              <label htmlFor="goal-target">Target *</label>
              <input id="goal-target" type="number" min="0" step="any" value={form.targetValue} onChange={set('targetValue')} aria-invalid={!!errors.targetValue} />
              {errors.targetValue && <p className="field-error">{errors.targetValue}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="goal-current">Current</label>
              <input id="goal-current" type="number" min="0" step="any" value={form.currentValue} onChange={set('currentValue')} />
            </div>
          </div>
          <div className="form-row grid-2">
            <div className="form-group">
              <label htmlFor="goal-unit">Unit</label>
              <input id="goal-unit" value={form.unit} onChange={set('unit')} placeholder="kg, km, reps…" />
            </div>
            <div className="form-group">
              <label htmlFor="goal-deadline">Deadline</label>
              <input id="goal-deadline" type="date" value={form.deadline} onChange={set('deadline')} />
              {errors.deadline && <p className="field-error">{errors.deadline}</p>}
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete goal?"
        message="This goal and its progress will be permanently removed."
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default Goals;
