import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiActivity } from 'react-icons/fi';
import workoutService from '../services/workoutService';
import SearchBar from '../components/SearchBar';
import Select from '../components/Select';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import ConfirmDialog from '../components/ConfirmDialog';
import { Stagger, StaggerItem } from '../components/Transitions';
import { formatDate } from '../utils/format';
import useWeightUnit from '../hooks/useWeightUnit';
import { extractError } from '../services/api';

const CATEGORIES = ['strength', 'cardio', 'flexibility', 'balance', 'sports', 'other'];
const CATEGORY_TONES = {
  strength: 'accent',
  cardio: 'warn',
  flexibility: 'info',
  balance: 'balance',
  sports: 'sports',
  other: 'neutral',
};

function Workouts() {
  const [query, setRawQuery] = useState({ page: 1, limit: 10, search: '', category: '', sort: '-date' });
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const wu = useWeightUnit();

  const activeQuery = { ...query };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(
        Object.entries(activeQuery).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      );
      const res = await workoutService.list(params);
      setItems(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(extractError(err, 'Could not load workouts'));
    } finally {
      setLoading(false);
    }
  }, [activeQuery.search, activeQuery.category, activeQuery.page, activeQuery.limit, activeQuery.sort]);

  useEffect(() => {
    load();
  }, [load]);

  const setQuery = (patch) => setRawQuery((q) => ({ ...q, ...patch, page: patch.page ?? 1 }));

  const handleDelete = async () => {
    if (!pendingDelete) return undefined;
    setPendingDelete(null);
    await workoutService.remove(pendingDelete);
    if (items.length === 1 && query.page > 1) setQuery({ page: query.page - 1 });
    else load();
    return undefined;
  };

  if (loading && !items.length) return <LoadingSpinner label="Loading workouts…" />;
  if (error && !items.length) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Workouts</h1>
          <p className="muted">{meta?.total != null ? `${meta.total} logged` : 'Every rep counts'}</p>
        </div>
        <Link to="/workouts/new" className="btn">
          <FiPlus /> Log workout
        </Link>
      </div>

      <div className="toolbar">
        <SearchBar value={query.search} onChange={(v) => setQuery({ search: v })} placeholder="Search by exercise…" />
        <Select
          ariaLabel="Filter by category"
          value={query.category}
          onChange={(v) => setQuery({ category: v })}
          options={[{ value: '', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
        />
      </div>

      {loading && items.length > 0 ? <LoadingSpinner compact label="Refreshing…" /> : null}
      {error && <ErrorState message={error} onRetry={load} />}

      {items.length === 0 && !loading ? (
        <EmptyState
          icon={<FiActivity />}
          title="No workouts found"
          message="Log your first workout to start building your history."
          action={
            <Link to="/workouts/new" className="btn">
              <FiPlus /> Log workout
            </Link>
          }
        />
      ) : (
        <>
          <div className="table-wrap card">
            <table className="table">
              <thead>
                <tr>
                  <th>Exercise</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Sets × Reps</th>
                  <th>Weight ({wu.unit})</th>
                  <th aria-label="Actions" className="col-actions" />
                </tr>
              </thead>
              <Stagger as="tbody">
                {items.map((w) => (
                  <StaggerItem as="tr" key={w._id}>
                    <td data-label="Exercise">
                      <Link to={`/workouts/${w._id}`} className="table-title">
                        {w.exerciseName}
                      </Link>
                    </td>
                    <td data-label="Category">
                      <Badge tone={CATEGORY_TONES[w.category] || 'neutral'}>{w.category || 'strength'}</Badge>
                    </td>
                    <td data-label="Date">{formatDate(w.date)}</td>
                    <td data-label="Sets × Reps">
                      {w.sets} × {w.reps}
                    </td>
                    <td data-label="Weight">{w.weight ? wu.display(w.weight) : '—'}</td>
                    <td data-label="Actions" className="col-actions">
                      <Link to={`/workouts/${w._id}`} className="icon-btn" aria-label="View">
                        <FiEye />
                      </Link>
                      <Link to={`/workouts/${w._id}/edit`} className="icon-btn" aria-label="Edit">
                        <FiEdit2 />
                      </Link>
                      <button
                        type="button"
                        className="icon-btn danger"
                        aria-label="Delete"
                        onClick={() => setPendingDelete(w._id)}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </StaggerItem>
                ))}
              </Stagger>
            </table>
          </div>
          <Pagination page={query.page} totalPages={meta?.totalPages || 1} onChange={(p) => setQuery({ page: p })} />
        </>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete workout?"
        message="This workout will be permanently removed."
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default Workouts;
