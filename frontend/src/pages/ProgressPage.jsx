import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit2, FiTrendingUp, FiEye } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import progressService from '../services/progressService';
import dashboardService from '../services/dashboardService';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import ConfirmDialog from '../components/ConfirmDialog';
import ChartTooltip from '../components/ChartTooltip';
import { Stagger, StaggerItem, EASE } from '../components/Transitions';
import { useToast } from '../context/ToastContext';
import useChartPalette from '../hooks/useChartPalette';
import useWeightUnit from '../hooks/useWeightUnit';
import { toISODate, formatDate } from '../utils/format';
import { extractError, extractFieldErrors } from '../services/api';

const MEASUREMENT_FIELDS = ['chest', 'waist', 'hips', 'arms', 'thighs'];

function Progress() {
  const toast = useToast();
  const chart = useChartPalette();
  const wu = useWeightUnit();
  const MEASUREMENT_COLORS = [chart.c1, chart.c2, chart.c3, chart.c4, chart.c5];
  const [query, setQuery] = useState({ page: 1, limit: 10, sort: '-date' });
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [measurementRange, setMeasurementRange] = useState(30);

  const [form, setForm] = useState({ date: toISODate(new Date()), weight: '', chest: '', waist: '', hips: '', arms: '', thighs: '', notes: '' });
  const [performanceRows, setPerformanceRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [listRes, analyticsRes] = await Promise.all([
        progressService.list(query),
        dashboardService.progressAnalytics(30),
      ]);
      setItems(listRes.data);
      setMeta(listRes.meta);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError(extractError(err, 'Could not load progress'));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const setM = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({
      date: toISODate(item.date),
      weight: item.weight === null || item.weight === undefined ? '' : wu.raw(item.weight),
      chest: item.measurements?.chest ?? '',
      waist: item.measurements?.waist ?? '',
      hips: item.measurements?.hips ?? '',
      arms: item.measurements?.arms ?? '',
      thighs: item.measurements?.thighs ?? '',
      notes: item.notes ?? '',
    });
    setPerformanceRows(
      (item.performance || []).map((p) => ({ metric: p.metric, value: p.value, unit: p.unit || '' }))
    );
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return undefined;
    let cancelled = false;
    progressService
      .get(editId)
      .then((res) => {
        if (!cancelled && res?.data) {
          startEdit(res.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ date: toISODate(new Date()), weight: '', chest: '', waist: '', hips: '', arms: '', thighs: '', notes: '' });
    setPerformanceRows([]);
    setFieldErrors({});
    setFormError('');
  };

  const updatePerfRow = (i, key, value) =>
    setPerformanceRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    setFieldErrors({});
    const measurements = {};
    MEASUREMENT_FIELDS.forEach((f) => {
      if (form[f] !== '') measurements[f] = Number(form[f]);
    });
    const performance = performanceRows
      .filter((r) => r.metric.trim() !== '')
      .map((r) => ({ metric: r.metric.trim(), value: Number(r.value), unit: r.unit.trim() }));
    const payload = {
      date: form.date,
      weight: form.weight === '' ? undefined : wu.toKg(Number(form.weight)),
      measurements: Object.keys(measurements).length ? measurements : undefined,
      performance,
      notes: form.notes,
    };
    try {
      if (editingId) {
        await progressService.update(editingId, payload);
        toast.success('Entry updated', 'Your changes have been saved.');
      } else {
        await progressService.create(payload);
        toast.success('Entry saved', 'Progress logged.');
      }
      resetForm();
      load();
    } catch (err) {
      setFormError(extractError(err, 'Could not save entry'));
      setFieldErrors(extractFieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return undefined;
    setPendingDelete(null);
    await progressService.remove(pendingDelete);
    toast.success('Entry deleted', 'The progress entry was removed.');
    if (editingId === pendingDelete) resetForm();
    setQuery((q) => ({ ...q, page: 1 }));
    load();
    return undefined;
  };

  const weightSeries = withinDays(
    ((analytics?.weightSeries) || []).map((p) => ({ ...p, date: toISODate(p.date), weight: wu.raw(p.weight) })),
    30
  );
  const formatChartWeight = (v) => `${Math.round(Number(v) * 10) / 10} ${wu.unit}`;
  const measurementSeries = analytics?.measurementSeries || {};
  const measurementData = withinDays(mergeSeries(measurementSeries), measurementRange);
  const hasChartData = weightSeries.length > 0 || Object.values(measurementSeries).some((s) => s.length > 0);

  const weightTrend =
    weightSeries.length > 1
      ? Number((weightSeries[weightSeries.length - 1].weight - weightSeries[0].weight).toFixed(1))
      : null;

  const weightScale = niceScale(weightSeries.map((p) => p.weight), 5);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Progress</h1>
          <p className="muted">Log weigh-ins, measurements, and performance</p>
        </div>
        {meta?.total != null ? <span className="chip accent">{meta.total} entries</span> : null}
      </div>

      <div className="split-grid">
        <motion.div
          className="card form-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <div className="card-head">
            <h2>{editingId ? 'Edit entry' : 'New entry'}</h2>
            <Badge tone={editingId ? 'warn' : 'accent'}>{editingId ? 'Editing' : 'New'}</Badge>
          </div>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row grid-2">
              <div className="form-group">
                <label htmlFor="progress-date">Date *</label>
                <input
                  id="progress-date"
                  type="date"
                  value={form.date}
                  onChange={setM('date')}
                  aria-invalid={!!fieldErrors.date}
                />
                {fieldErrors.date && <p className="field-error">{fieldErrors.date}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="weight">Weight ({wu.unit})</label>
                <input
                  id="weight"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.weight}
                  onChange={setM('weight')}
                  aria-invalid={!!fieldErrors.weight}
                />
                {fieldErrors.weight && <p className="field-error">{fieldErrors.weight}</p>}
              </div>
            </div>

            <fieldset className="fieldset">
              <legend>Body measurements (cm)</legend>
              <div className="form-row grid-5">
                {MEASUREMENT_FIELDS.map((f) => (
                  <div className="form-group" key={f}>
                    <label htmlFor={f}>{f}</label>
                    <input id={f} type="number" min="0" step="0.1" value={form[f]} onChange={setM(f)} />
                  </div>
                ))}
              </div>
            </fieldset>

            <div className="fieldset">
              <div className="legend-row">
                <legend>Performance (e.g. push-up max)</legend>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPerformanceRows((r) => [...r, { metric: '', value: '', unit: '' }])}
                >
                  <FiPlus /> Add metric
                </button>
              </div>
              {performanceRows.map((row, i) => (
                <div className="form-row grid-3 perf-row" key={i}>
                  <input
                    placeholder="Metric"
                    value={row.metric}
                    onChange={(e) => updatePerfRow(i, 'metric', e.target.value)}
                  />
                  <input
                    placeholder="Value"
                    type="number"
                    value={row.value}
                    onChange={(e) => updatePerfRow(i, 'value', e.target.value)}
                  />
                  <div className="perf-unit">
                    <input
                      placeholder="Unit"
                      value={row.unit}
                      onChange={(e) => updatePerfRow(i, 'unit', e.target.value)}
                    />
                    <button
                      type="button"
                      className="icon-btn danger"
                      aria-label="Remove metric"
                      onClick={() => setPerformanceRows((r) => r.filter((_, idx) => idx !== i))}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                rows="2"
                value={form.notes}
                onChange={setM('notes')}
                placeholder="Felt recovered today..."
              />
            </div>

            <div className="form-actions">
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel edit
                </button>
              )}
              <button type="submit" className="btn" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add entry'}
              </button>
            </div>
          </form>
        </motion.div>

        <motion.div
          className="card chart-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: EASE }}
        >
          <div className="card-head">
            <h2>Weight trend</h2>
            {weightTrend !== null ? (
              <span className="chip accent">
                <FiTrendingUp /> {weightTrend > 0 ? `+${weightTrend}` : weightTrend} {wu.unit}
              </span>
            ) : null}
          </div>
          {weightSeries.length === 0 ? (
            <EmptyState
              icon={<FiTrendingUp />}
              title="No weigh-ins yet"
              message="Your weight chart will appear here."
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={weightSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={chart.c5} />
                    <stop offset="100%" stopColor={chart.c1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 12 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis domain={weightScale.domain} ticks={weightScale.ticks} tick={{ fill: 'var(--muted)', fontSize: 12 }} width={44} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip formatter={formatChartWeight} />} cursor={{ stroke: 'var(--border)' }} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name={`Weight (${wu.unit})`}
                  stroke="url(#weightLine)"
                  strokeWidth={3}
                  dot={{ r: 3, fill: chart.c5, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  animationDuration={900}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {hasChartData && Object.values(measurementSeries).some((s) => s.length > 1) && (
        <motion.div
          className="card chart-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease: EASE }}
        >
          <div className="card-head">
            <h2>Measurements over time</h2>
            <div className="range-toggle" role="group" aria-label="Date range">
              {[7, 30].map((range) => (
                <button
                  key={range}
                  type="button"
                  className={`range-chip${measurementRange === range ? ' active' : ''}`}
                  aria-pressed={measurementRange === range}
                  onClick={() => setMeasurementRange(range)}
                >
                  {range}d
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={measurementData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 12 }} tickFormatter={formatAxisDate} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis domain={['dataMin - 3', 'dataMax + 3']} tick={{ fill: 'var(--muted)', fontSize: 12 }} width={44} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v} cm`} />} cursor={{ stroke: 'var(--border)' }} />
              <Legend wrapperStyle={{ color: 'var(--muted)', fontSize: 13 }} />
              {MEASUREMENT_FIELDS.filter((site) => measurementSeries[site]?.length).map((site, i) => (
                <Line
                  key={site}
                  type="monotone"
                  dataKey={site}
                  name={site}
                  stroke={MEASUREMENT_COLORS[i % MEASUREMENT_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  animationDuration={900}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <div className="table-wrap card">
        <div className="card-head">
          <h2>History</h2>
          {meta?.total != null ? <span className="muted">{meta.total} entries</span> : null}
        </div>
        {loading && !items.length ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FiTrendingUp />}
            title="No entries yet"
            message="Add your first weigh-in above."
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight ({wu.unit})</th>
                <th>Measurements</th>
                <th>Notes</th>
                <th aria-label="Actions" className="col-actions" />
              </tr>
            </thead>
            <Stagger as="tbody">
              {items.map((p) => (
                <StaggerItem as="tr" key={p._id}>
                  <td data-label="Date" className="strong">{formatDate(p.date)}</td>
                  <td data-label="Weight">{p.weight !== null && p.weight !== undefined ? wu.display(p.weight) : '—'}</td>
                  <td data-label="Measurements" className="muted">
                    {p.measurements && Object.keys(p.measurements).length
                      ? Object.entries(p.measurements)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ')
                      : '—'}
                  </td>
                  <td data-label="Notes">
                    <span className="muted capped">{p.notes || '—'}</span>
                  </td>
                  <td data-label="Actions" className="col-actions">
                    <Link to={`/progress/${p._id}`} className="icon-btn" aria-label="View entry">
                      <FiEye />
                    </Link>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Edit entry"
                      onClick={() => startEdit(p)}
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      aria-label="Delete"
                      onClick={() => setPendingDelete(p._id)}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </StaggerItem>
              ))}
            </Stagger>
          </table>
        )}
        <Pagination
          page={query.page}
          totalPages={meta?.totalPages || 1}
          onChange={(page) => setQuery((q) => ({ ...q, page }))}
        />
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete progress entry?"
        message="This entry will be permanently removed."
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function mergeSeries(series) {
  const byDate = {};
  for (const [site, points] of Object.entries(series)) {
    for (const p of points) {
      const date = toISODate(p.date);
      if (!byDate[date]) byDate[date] = { date };
      byDate[date][site] = p.value;
    }
  }
  return Object.values(byDate).sort((a, b) => (a.date < b.date ? -1 : 1));
}

function withinDays(rows, days) {
  if (!rows.length) return rows;
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffIso = toISODate(cutoff);
  return rows.filter((row) => row.date >= cutoffIso);
}

function formatAxisDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function niceScale(values, tickCount = 5) {
  const nums = (values || []).filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (!nums.length) return { domain: ['auto', 'auto'], ticks: undefined };

  let min = Math.min(...nums);
  let max = Math.max(...nums);
  if (min === max) {
    min -= 1;
    max += 1;
  }

  const rawStep = (max - min) / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const stepMultiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = stepMultiplier * magnitude;

  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) {
    ticks.push(Number(v.toFixed(6)));
  }
  return { domain: [niceMin, niceMax], ticks };
}

export default Progress;
