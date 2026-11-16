import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';
import nutritionService from '../services/nutritionService';
import Select from '../components/Select';
import { extractError, extractFieldErrors } from '../services/api';
import { toISODate } from '../utils/format';
import { Stagger, StaggerItem, EASE } from '../components/Transitions';
import { useToast } from '../context/ToastContext';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

function NutritionForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ mealType: 'breakfast', foodItems: '', quantity: '', calories: '', protein: '', carbohydrates: '', fats: '', date: toISODate(new Date()), notes: '' });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await nutritionService.get(id);
      const { mealType, foodItems, quantity, calories, protein, carbohydrates, fats, date, notes } = res.data;
      setForm({
        mealType,
        foodItems: foodItems ? foodItems.join(', ') : '',
        quantity: quantity ?? '',
        calories: calories ?? '',
        protein: protein ?? '',
        carbohydrates: carbohydrates ?? '',
        fats: fats ?? '',
        date: toISODate(date),
        notes: notes ?? '',
      });
    } catch (err) {
      setServerError(extractError(err, 'Could not load this meal'));
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
      mealType: form.mealType,
      foodItems: form.foodItems
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      quantity: form.quantity,
      calories: form.calories === '' ? undefined : Number(form.calories),
      protein: form.protein === '' ? undefined : Number(form.protein),
      carbohydrates: form.carbohydrates === '' ? undefined : Number(form.carbohydrates),
      fats: form.fats === '' ? undefined : Number(form.fats),
      date: form.date,
      notes: form.notes,
    };
    try {
      if (isEdit) await nutritionService.update(id, payload);
      else await nutritionService.create(payload);
      toast.success('Saved', isEdit ? 'Your changes to this meal were saved.' : 'Meal added to your log.');
      navigate('/nutrition');
    } catch (err) {
      setServerError(extractError(err, 'Could not save meal'));
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
          <h1>{isEdit ? 'Edit meal' : 'Add a meal'}</h1>
          <p className="muted">
            {isEdit ? 'Update the details of this meal entry.' : 'Log what you ate — calories, macros and notes.'}
          </p>
        </div>
        <Link to="/nutrition" className="btn btn-secondary">
          <FiArrowLeft /> Back to nutrition
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
          <div className="fieldset">
            <legend>Meal details</legend>
            <Stagger as="div" className="form-row grid-3">
              <StaggerItem as="div" className="form-group">
                <label htmlFor="mealType">Meal type</label>
                <Select id="mealType" ariaLabel="Meal type" value={form.mealType} onChange={(v) => setForm((f) => ({ ...f, mealType: v }))} options={MEAL_TYPES} />
              </StaggerItem>
              <StaggerItem as="div" className="form-group">
                <label htmlFor="date">Date</label>
                <input id="date" type="date" value={form.date} onChange={set('date')} aria-invalid={!!errors.date} />
                {errors.date && <p className="field-error">{errors.date}</p>}
              </StaggerItem>
              <StaggerItem as="div" className="form-group">
                <label htmlFor="quantity">Quantity</label>
                <input id="quantity" value={form.quantity} onChange={set('quantity')} placeholder="1 bowl, 250g…" />
              </StaggerItem>
            </Stagger>
          </div>

          <div className="form-group">
            <label htmlFor="foodItems">Food items *</label>
            <input id="foodItems" value={form.foodItems} onChange={set('foodItems')} placeholder="Oats, Banana, Milk" aria-invalid={!!errors.foodItems} />
            {errors.foodItems && <p className="field-error">{errors.foodItems}</p>}
          </div>

          <div className="fieldset">
            <legend>Nutrition facts</legend>
            <Stagger as="div" className="form-row grid-4">
              <StaggerItem as="div" className="form-group">
                <label htmlFor="calories">Calories (kcal)</label>
                <input id="calories" type="number" min="0" value={form.calories} onChange={set('calories')} />
              </StaggerItem>
              <StaggerItem as="div" className="form-group">
                <label htmlFor="protein">Protein (g)</label>
                <input id="protein" type="number" min="0" step="0.1" value={form.protein} onChange={set('protein')} />
              </StaggerItem>
              <StaggerItem as="div" className="form-group">
                <label htmlFor="carbohydrates">Carbs (g)</label>
                <input id="carbohydrates" type="number" min="0" step="0.1" value={form.carbohydrates} onChange={set('carbohydrates')} />
              </StaggerItem>
              <StaggerItem as="div" className="form-group">
                <label htmlFor="fats">Fats (g)</label>
                <input id="fats" type="number" min="0" step="0.1" value={form.fats} onChange={set('fats')} />
              </StaggerItem>
            </Stagger>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" rows="3" value={form.notes} onChange={set('notes')} placeholder="How did it sit? Post-workout shake…" />
          </div>

          <div className="form-actions">
            <Link to="/nutrition" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add meal'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default NutritionForm;
