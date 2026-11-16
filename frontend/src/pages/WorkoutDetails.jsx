import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEdit, FiTrash2, FiLayers, FiRepeat, FiBox, FiCalendar } from 'react-icons/fi';
import workoutService from '../services/workoutService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import Badge from '../components/Badge';
import ConfirmDialog from '../components/ConfirmDialog';
import { Stagger, StaggerItem, EASE } from '../components/Transitions';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/format';
import useWeightUnit from '../hooks/useWeightUnit';
import { extractError } from '../services/api';

const CATEGORY_TONES = {
  strength: 'accent',
  cardio: 'warn',
  flexibility: 'info',
  balance: 'balance',
  sports: 'sports',
  other: 'neutral',
};

function WorkoutDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const wu = useWeightUnit();
  const [workout, setWorkout] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await workoutService.get(id);
      setWorkout(res.data);
    } catch (err) {
      setError(extractError(err, 'Could not load this workout'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSpinner label="Loading workout…" />;
  if (error || !workout) return <ErrorState message={error} onRetry={load} />;

  const handleDelete = async () => {
    await workoutService.remove(id);
    toast.success('Deleted', 'Workout removed from your log.');
    navigate('/workouts');
  };

  const metrics = [
    { label: 'Sets', value: workout.sets ?? '�?"', icon: <FiLayers /> },
    { label: 'Reps', value: workout.reps ?? '�?"', icon: <FiRepeat /> },
    { label: 'Weight', value: workout.weight ? wu.amount(workout.weight) : '—', icon: <FiBox />, unit: workout.weight ? wu.unit : '' },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{workout.exerciseName}</h1>
          <p className="muted">
            <Link to="/workouts">← Back to workouts</Link>
          </p>
        </div>
        <div className="btn-row">
          <Link to={`/workouts/${id}/edit`} className="btn">
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
          <h2>Summary</h2>
          <div className="btn-row">
            <Badge tone={CATEGORY_TONES[workout.category] || 'neutral'}>{workout.category || 'strength'}</Badge>
            <span className="chip">
              <FiCalendar size={13} /> {formatDate(workout.date)}
            </span>
          </div>
        </div>
        <Stagger as="div" className="stats-grid">
          {metrics.map((m) => (
            <StaggerItem as="div" className="stat-card" hover key={m.label}>
              <div className="stat-card-head">
                <span className="stat-label">{m.label}</span>
                <span className="stat-icon">{m.icon}</span>
              </div>
              <div className="stat-values">
                <span className="stat-value">
                  {m.value}
                  {m.unit ? <em>{m.unit}</em> : null}
                </span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </motion.div>

      {workout.notes && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.12 }}
        >
          <div className="card-head">
            <h2>Notes</h2>
          </div>
          <p className="muted">{workout.notes}</p>
        </motion.div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete workout?"
        message={`"${workout.exerciseName}" will be permanently removed.`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default WorkoutDetails;
