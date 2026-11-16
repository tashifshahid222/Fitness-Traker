import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEdit, FiTrash2, FiCoffee, FiCalendar, FiZap, FiActivity, FiBox, FiFileText } from 'react-icons/fi';
import nutritionService from '../services/nutritionService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { EASE } from '../components/Transitions';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/format';
import { extractError } from '../services/api';
import '../styles/pages/nutrition.css';

function NutritionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [meal, setMeal] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await nutritionService.get(id);
      setMeal(res.data);
    } catch (err) {
      setError(extractError(err, 'Could not load this meal'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    await nutritionService.remove(id);
    toast.success('Deleted', 'Meal entry removed from your log.');
    navigate('/nutrition');
  };

  if (loading) return <LoadingSpinner label="Loading meal…" />;
  if (error || !meal) return <ErrorState message={error} onRetry={load} />;

  const macros = [
    { label: 'Protein', value: meal.protein ?? '—', unit: meal.protein != null ? 'g' : '', icon: <FiActivity /> },
    { label: 'Carbs', value: meal.carbohydrates ?? '—', unit: meal.carbohydrates != null ? 'g' : '', icon: <FiBox /> },
    { label: 'Fats', value: meal.fats ?? '—', unit: meal.fats != null ? 'g' : '', icon: <FiActivity /> },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{meal.foodItems?.join(', ') || 'Meal entry'}</h1>
          <p className="muted">
            <Link to="/nutrition">← Back to nutrition</Link>
          </p>
        </div>
        <div className="btn-row">
          <Link to={`/nutrition/${id}/edit`} className="btn">
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
            <Badge tone="warn">{meal.mealType}</Badge>
            <span className="chip">
              <FiCalendar size={13} /> {formatDate(meal.date)}
            </span>
          </div>
        </div>
        <div className="stats-grid">
          <StatCard
            index={0}
            label="Calories"
            value={meal.calories ?? '—'}
            unit={meal.calories != null ? 'kcal' : ''}
            icon={<FiZap />}
          />
          {macros.map((m, i) => (
            <StatCard key={m.label} index={i + 1} label={m.label} value={m.value} unit={m.unit} icon={m.icon} />
          ))}
        </div>
        <div className="meal-facts">
          <span className="chip accent">
            <FiCoffee size={13} /> {meal.foodItems?.length || 0} food items
          </span>
          {meal.quantity ? <span className="chip">Quantity: {meal.quantity}</span> : null}
        </div>
        <ul className="meal-list">
          {(meal.foodItems || []).map((item, i) => (
            <li key={`${item}-${i}`}>{item}</li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.12 }}
      >
        <div className="card-head">
          <h2>Notes</h2>
          <span className="muted">
            <FiFileText size={13} />
          </span>
        </div>
        {meal.notes ? <p className="muted">{meal.notes}</p> : <p className="muted">No notes for this meal.</p>}
      </motion.div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete meal entry?"
        message="This entry will be permanently removed."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default NutritionDetails;
