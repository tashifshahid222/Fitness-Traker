import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';
import workoutService from '../services/workoutService';
import Select from '../components/Select';
import { extractError, extractFieldErrors } from '../services/api';
import { toISODate } from '../utils/format';
import useWeightUnit from '../hooks/useWeightUnit';
import { Stagger, StaggerItem, EASE } from '../components/Transitions';
import { useToast } from '../context/ToastContext';

const CATEGORIES = ['strength', 'cardio', 'flexibility', 'balance', 'sports', 'other'];

const EMPTY = {
  exerciseName: '',
  category: 'strength',
  sets: '',
  reps: '',
  weight: '',
  date: toISODate(new Date()),
  notes: '',
};

function WorkoutForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const wu = useWeightUnit();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await workoutService.get(id);
      const { exerciseName, category, sets, reps, weight, date, notes } = res.data;
      setForm({
        exerciseName,
        category,
        sets: sets ?? '',
        reps: reps ?? '',
        weight: weight === null || weight === undefined ? '' : wu.raw(weight),
        date: toISODate(date),
        notes: notes ?? '',
      });
    } catch (err) {
      setServerError(extractError(err, 'Could not load this workout'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) load();
  }, [isEdit, load]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setServerError('');
    setErrors({});
    const payload = {
      ...form,
      sets: form.sets === '' ? undefined : Number(form.sets),
      reps: form.reps === '' ? undefined : Number(form.reps),
      weight: form.weight === '' ? undefined : wu.toKg(Number(form.weight)),
    };
    try {
      if (isEdit) await workoutService.update(id, payload);
      else await workoutService.create(payload);
      toast.success('Saved', isEdit ? 'Your changes to this workout were saved.' : 'Workout logged.');
      navigate('/workouts');
    } catch (err) {
      setServerError(extractError(err, 'Could not save workout'));
      setErrors(extractFieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{isEdit ? 'Edit workout' : 'Log a workout'}</h1>
          <p className="muted">Keep the streak alive — a session is only real once it is logged.</p>
        </div>
        <Link to="/workouts" className="btn btn-secondary">
          <FiArrowLeft /> Back to workouts
        </Link>
      </div>

      <motion.div
        className="card form-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        {serverError && <div className="alert alert-error">{serverError}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <Stagger as="div" className="form-row">
            <StaggerItem as="div" className="form-group">
              <label htmlFor="exerciseName">Exercise *</label>
              <input id="exerciseName" value={form.exerciseName} onChange={set('exerciseName')} placeholder="Bench press" aria-invalid={!!errors.exerciseName} />
              {errors.exerciseName && <p className="field-error">{errors.exerciseName}</p>}
            </StaggerItem>
            <StaggerItem as="div" className="form-group">
              <label htmlFor="category">Category</label>
              <Select id="category" ariaLabel="Category" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} options={CATEGORIES} />
            </StaggerItem>
          </Stagger>

          <div className="fieldset">
            <legend>Performance</legend>
            <Stagger as="div" className="form-row grid-3">
              <StaggerItem as="div" className="form-group">
                <label htmlFor="sets">Sets</label>
                <input id="sets" type="number" min="0" value={form.sets} onChange={set('sets')} />
              </StaggerItem>
              <StaggerItem as="div" className="form-group">
                <label htmlFor="reps">Reps</label>
                <input id="reps" type="number" min="0" value={form.reps} onChange={set('reps')} />
              </StaggerItem>
              <StaggerItem as="div" className="form-group">
                <label htmlFor="weight">Weight ({wu.unit})</label>
                <input id="weight" type="number" min="0" step="0.1" value={form.weight} onChange={set('weight')} />
              </StaggerItem>
            </Stagger>
          </div>

          <div className="fieldset">
            <legend>Details</legend>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input id="date" type="date" value={form.date} onChange={set('date')} aria-invalid={!!errors.date} />
                {errors.date && <p className="field-error">{errors.date}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <input id="notes" value={form.notes} onChange={set('notes')} placeholder="Felt strong, PR attempt…" />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Link to="/workouts" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Log workout'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default WorkoutForm;
