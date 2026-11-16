import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiCoffee, FiEye, FiEdit2 } from 'react-icons/fi';
import nutritionService from '../services/nutritionService';
import SearchBar from '../components/SearchBar';
import Select from '../components/Select';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import ConfirmDialog from '../components/ConfirmDialog';
import { Stagger, StaggerItem, EASE } from '../components/Transitions';
import { formatDate } from '../utils/format';
import { extractError } from '../services/api';
import '../styles/pages/nutrition.css';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

function Nutrition() {
  const [query, setRawQuery] = useState({ page: 1, limit: 10, search: '', mealType: '', sort: '-date' });
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  const activeQuery = { ...query };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(
        Object.entries(activeQuery).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      );
      const res = await nutritionService.list(params);
      setItems(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(extractError(err, 'Could not load nutrition logs'));
    } finally {
      setLoading(false);
    }
  }, [activeQuery.search, activeQuery.mealType, activeQuery.page, activeQuery.limit, activeQuery.sort]);

  useEffect(() => {
    load();
  }, [load]);

  const setQuery = (patch) => setRawQuery((q) => ({ ...q, ...patch, page: patch.page ?? 1 }));

  const handleDelete = async () => {
    if (!pendingDelete) return undefined;
    setPendingDelete(null);
    await nutritionService.remove(pendingDelete);
    if (items.length === 1 && query.page > 1) setQuery({ page: query.page - 1 });
    else load();
    return undefined;
  };

  if (loading && !items.length) return <LoadingSpinner label="Loading nutrition…" />;
  if (error && !items.length) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Nutrition</h1>
          <p className="muted">{meta?.total != null ? `${meta.total} entries` : 'Fuel your workouts'}</p>
        </div>
        <Link to="/nutrition/new" className="btn">
          <FiPlus /> Add meal
        </Link>
      </div>

      <div className="toolbar">
        <SearchBar value={query.search} onChange={(v) => setQuery({ search: v })} placeholder="Search food…" />
        <Select
          ariaLabel="Filter by meal type"
          value={query.mealType}
          onChange={(v) => setQuery({ mealType: v })}
          options={[{ value: '', label: 'All meals' }, ...MEAL_TYPES.map((m) => ({ value: m, label: m }))]}
        />
      </div>

      {loading && items.length ? <LoadingSpinner compact label="Refreshing…" /> : null}
      {error && <ErrorState message={error} onRetry={load} />}

      {items.length === 0 && !loading ? (
        <EmptyState
          icon={<FiCoffee />}
          title="No meals logged"
          message="Add your first meal to track calories and macros."
          action={
            <Link to="/nutrition/new" className="btn">
              <FiPlus /> Add meal
            </Link>
          }
        />
      ) : (
        <>
          <motion.div
            className="table-wrap card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <table className="table">
              <thead>
                <tr>
                  <th>Meal</th>
                  <th>Food</th>
                  <th>Date</th>
                  <th>Calories</th>
                  <th>P / C / F</th>
                  <th aria-label="Actions" className="col-actions" />
                </tr>
              </thead>
              <Stagger as="tbody">
                {items.map((n) => (
                  <StaggerItem as="tr" key={n._id}>
                    <td data-label="Meal">
                      <Badge tone="warn">{n.mealType}</Badge>
                    </td>
                    <td data-label="Food">
                      <Link to={`/nutrition/${n._id}`} className="table-title">
                        {n.foodItems.join(', ')}
                      </Link>
                    </td>
                    <td data-label="Date">{formatDate(n.date)}</td>
                    <td data-label="Calories">
                      <span className="chip accent">{n.calories} kcal</span>
                    </td>
                    <td data-label="P / C / F">
                      <span className="macros">
                        <span className="macro macro-p">P {n.protein}g</span>
                        <span className="macro macro-c">C {n.carbohydrates}g</span>
                        <span className="macro macro-f">F {n.fats}g</span>
                      </span>
                    </td>
                    <td data-label="Actions" className="col-actions">
                      <Link to={`/nutrition/${n._id}`} className="icon-btn" aria-label="View">
                        <FiEye />
                      </Link>
                      <Link to={`/nutrition/${n._id}/edit`} className="icon-btn" aria-label="Edit">
                        <FiEdit2 />
                      </Link>
                      <button type="button" className="icon-btn danger" aria-label="Delete" onClick={() => setPendingDelete(n._id)}>
                        <FiTrash2 />
                      </button>
                    </td>
                  </StaggerItem>
                ))}
              </Stagger>
            </table>
          </motion.div>
          <Pagination page={query.page} totalPages={meta?.totalPages || 1} onChange={(p) => setQuery({ page: p })} />
        </>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete meal entry?"
        message="This entry will be permanently removed."
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default Nutrition;
