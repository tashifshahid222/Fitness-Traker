import { useCallback, useEffect, useState } from 'react';
import { FiFileText, FiDownload } from 'react-icons/fi';
import reportService from '../services/reportService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { Stagger, StaggerItem } from '../components/Transitions';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/format';
import useWeightUnit from '../hooks/useWeightUnit';
import { extractError } from '../services/api';

const WEIGHT_SUMMARY_KEYS = ['firstWeight', 'latestWeight', 'weightDelta'];

const TYPES = [
  { key: 'workouts', label: 'Workouts' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'progress', label: 'Progress' },
];

const PAGE_SIZE = 10;

function Reports() {
  const [active, setActive] = useState('workouts');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState('');
  const [page, setPage] = useState(1);
  const toast = useToast();
  const wu = useWeightUnit();

  useEffect(() => {
    setPage(1);
  }, [active]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportService.get(active);
      setData(res.data);
    } catch (err) {
      setError(extractError(err, 'Could not build report'));
    } finally {
      setLoading(false);
    }
  }, [active]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      await reportService.exportFile(active, format);
      toast.success('Export ready', 'Your file is downloading.');
    } catch (err) {
      toast.error('Export failed', extractError(err, `Could not export ${format.toUpperCase()}`));
    } finally {
      setExporting('');
    }
  };

  const summaryCards = data
    ? Object.entries(data.summary || {}).filter(
        ([k, v]) => !Array.isArray(v) && (typeof v !== 'object' || v === null)
      )
    : [];

  const formatSummaryValue = (key, value) => {
    if (value === null || value === undefined || value === false || value === '') return '—';
    if (WEIGHT_SUMMARY_KEYS.includes(key) && typeof value === 'number') return wu.display(value);
    return String(value);
  };

  const columnsByType = {
    workouts: [
      { label: 'Date', value: (r) => formatDate(r.date) },
      { label: 'Exercise', value: (r) => r.exerciseName },
      { label: 'Category', value: (r) => r.category },
      { label: 'Sets × Reps', value: (r) => `${r.sets} × ${r.reps}` },
      { label: `Weight (${wu.unit})`, value: (r) => (r.weight ? wu.display(r.weight) : '—') },
    ],
    nutrition: [
      { label: 'Date', value: (r) => formatDate(r.date) },
      { label: 'Meal', value: (r) => r.mealType },
      { label: 'Food', value: (r) => r.foodItems.join(', ') },
      { label: 'Calories', value: (r) => r.calories },
      { label: 'P / C / F', value: (r) => `${r.protein} / ${r.carbohydrates} / ${r.fats}` },
    ],
    progress: [
      { label: 'Date', value: (r) => formatDate(r.date) },
      { label: `Weight (${wu.unit})`, value: (r) => (r.weight != null ? wu.display(r.weight) : '—') },
      { label: 'Performance', value: (r) => (r.performance || []).map((p) => `${p.metric} ${p.value}${p.unit}`).join(', ') || '—' },
      { label: 'Notes', value: (r) => r.notes || '—', capped: true },
    ],
  };

  const columns = columnsByType[active];
  const rows = data?.rows || [];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeLabel = TYPES.find((t) => t.key === active)?.label || '';

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <p className="muted">Summaries you can export as CSV or PDF</p>
        </div>
        <span className="chip accent">
          <FiFileText size={13} /> {activeLabel} report
        </span>
      </div>

      <div className="tabs" role="tablist">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            className={`tab ${active === t.key ? 'active' : ''}`}
            onClick={() => setActive(t.key)}
          >
            <FiFileText /> {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading || !data || data.type !== active ? (
        <LoadingSpinner label="Building report…" />
      ) : (
        <>
          <Stagger className="stats-grid">
            {summaryCards.map(([key, value]) => (
              <StaggerItem className="stat-card" key={key}>
                <span className="stat-label">{humanize(key)}</span>
                <div className="stat-line">
                  <strong>{formatSummaryValue(key, value)}</strong>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          {data?.summary?.categories && (
            <div className="card">
              <div className="card-head">
                <h2>Category breakdown</h2>
                <span className="chip">{data.summary.categories.length} categories</span>
              </div>
              <ul className="dash-list">
                {data.summary.categories.map((c) => (
                  <li key={c.category}>
                    <strong>{c.category}</strong>
                    <span className="list-meta">{c.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <div className="card-head">
              <h2>Records</h2>
              <span className="btn-row">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={exporting !== ''}
                  aria-busy={exporting === 'csv'}
                  onClick={() => handleExport('csv')}
                >
                  <FiDownload /> {exporting === 'csv' ? 'Preparing…' : 'Export CSV'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={exporting !== ''}
                  aria-busy={exporting === 'pdf'}
                  onClick={() => handleExport('pdf')}
                >
                  <FiDownload /> {exporting === 'pdf' ? 'Preparing…' : 'Export PDF'}
                </button>
              </span>
            </div>
            {rows.length === 0 ? (
              <EmptyState
                icon={<FiFileText />}
                title="No records to export"
                message="Your report will fill up as you log data."
              />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      {columns.map((c) => (
                        <th key={c.label}>{c.label}</th>
                      ))}
                      {active === 'workouts' && <th>Notes</th>}
                    </tr>
                  </thead>
                  <Stagger as="tbody">
                    {pageRows.map((r) => (
                      <StaggerItem as="tr" key={r._id}>
                        {columns.map((c) => (
                          <td key={c.label} data-label={c.label}>
                            {c.capped ? (
                              <span className="muted capped">{c.value(r)}</span>
                            ) : (
                              c.value(r)
                            )}
                          </td>
                        ))}
                        {active === 'workouts' && (
                          <td data-label="Notes">
                            <span className="muted capped">{r.notes || '—'}</span>
                          </td>
                        )}
                      </StaggerItem>
                    ))}
                  </Stagger>
                </table>
                <p className="muted table-more">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, rows.length)} of {rows.length} records
                </p>
                <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function humanize(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export default Reports;
