import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEdit, FiTrash2, FiTrendingUp, FiActivity, FiCalendar, FiTarget, FiFileText } from 'react-icons/fi';
import progressService from '../services/progressService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { EASE } from '../components/Transitions';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/format';
import useWeightUnit from '../hooks/useWeightUnit';
import { extractError } from '../services/api';

const MEASUREMENT_FIELDS = ['chest', 'waist', 'hips', 'arms', 'thighs'];

function ProgressDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const wu = useWeightUnit();
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await progressService.get(id);
      setEntry(res.data);
    } catch (err) {
      setError(extractError(err, 'Could not load this entry'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    await progressService.remove(id);
    toast.success('Entry deleted', 'The progress entry was removed.');
    navigate('/progress');
  };

  if (loading) return <LoadingSpinner label="Loading entry…" />;
  if (error || !entry) return <ErrorState message={error} onRetry={load} />;

  const measurements = entry.measurements || {};
  const performance = entry.performance || [];
  const hasMeasurements = MEASUREMENT_FIELDS.some((f) => measurements[f] !== undefined && measurements[f] !== null);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Progress entry</h1>
          <p className="muted">
            <Link to="/progress">← Back to progress</Link>
          </p>
        </div>
        <div className="btn-row">
          <Link to={`/progress?edit=${entry._id}`} className="btn">
            <FiEdit /> Edit
          </Link>
          <button type="button" className="btn btn-danger" onClick={() => setConfirmOpen(true)}>
            <FiTrash2 /> Delete
          </button>
        </div>
      </div>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <div className="card-head">
          <h2>{formatDate(entry.date)}</h2>
          <span className="chip accent">
            <FiCalendar size={13} /> Date
          </span>
        </div>
        <div className="stats-grid">
          <StatCard
            index={0}
            label="Weight"
            value={entry.weight !== null && entry.weight !== undefined ? wu.amount(entry.weight) : '—'}
            unit={entry.weight !== null && entry.weight !== undefined ? wu.unit : ''}
            decimals={1}
            icon={<FiTrendingUp />}
          />
          {MEASUREMENT_FIELDS.map((f, i) => (
            <StatCard
              key={f}
              index={i + 1}
              label={f}
              value={
                measurements[f] !== undefined && measurements[f] !== null ? measurements[f] : '—'
              }
              unit={measurements[f] !== undefined && measurements[f] !== null ? 'cm' : ''}
              icon={<FiActivity />}
            />
          ))}
        </div>
        {!hasMeasurements && entry.weight === null && (
          <p className="muted">No weight or measurement data logged for this entry.</p>
        )}
      </motion.div>

      <div className="grid-2">
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: EASE }}
        >
          <div className="card-head">
            <h2>Performance</h2>
            <span className="muted">{performance.length} metrics</span>
          </div>
          {performance.length ? (
            <div className="btn-row">
              {performance.map((perf, i) => (
                <Badge key={i} tone="accent">
                  <FiTarget size={12} /> {perf.metric}: {perf.value}
                  {perf.unit ? ` ${perf.unit}` : ''}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="muted">No performance metrics for this entry.</p>
          )}
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease: EASE }}
        >
          <div className="card-head">
            <h2>Notes</h2>
            <span className="muted">
              <FiFileText size={13} />
            </span>
          </div>
          {entry.notes ? <p className="muted">{entry.notes}</p> : <p className="muted">No notes for this entry.</p>}
        </motion.div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete progress entry?"
        message="This entry will be permanently removed."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default ProgressDetails;
