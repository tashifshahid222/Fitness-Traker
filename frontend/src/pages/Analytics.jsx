import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { FiActivity, FiCoffee, FiTrendingUp, FiCalendar, FiFileText, FiZap } from 'react-icons/fi';
import dashboardService from '../services/dashboardService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import ChartTooltip from '../components/ChartTooltip';
import { Stagger, StaggerItem, EASE } from '../components/Transitions';
import useChartPalette from '../hooks/useChartPalette';
import useWeightUnit from '../hooks/useWeightUnit';
import { toISODate, formatNumber } from '../utils/format';
import { extractError } from '../services/api';

const CATEGORY_TONES = {
  strength: 'accent',
  cardio: 'warn',
  flexibility: 'info',
  balance: 'neutral',
  sports: 'success',
  other: 'neutral',
};

const TONE_FILLS = {
  accent: 'var(--accent)',
  success: 'var(--accent)',
  warn: 'var(--warn)',
  info: 'var(--info)',
  neutral: 'var(--muted)',
};

const CATEGORY_FILLS = {
  ...TONE_FILLS,
  sports: 'var(--c-4)',
  balance: 'var(--c-5)',
};

function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const chart = useChartPalette();
  const wu = useWeightUnit();
  const COLORS = [chart.c1, chart.c2, chart.c3, chart.c4, chart.c5, chart.c6];

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [w, n, p] = await Promise.all([
        dashboardService.workoutAnalytics(),
        dashboardService.nutritionAnalytics(),
        dashboardService.progressAnalytics(),
      ]);
      setData({ workout: w.data, nutrition: n.data, progress: p.data });
    } catch (err) {
      setError(extractError(err, 'Could not load analytics'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSpinner label="Crunching numbers…" />;
  if (error || !data) return <ErrorState message={error} onRetry={load} />;

  const { workout, nutrition, progress } = data;
  const hasWorkouts = workout.frequency?.length > 0;
  const hasNutrition = nutrition.daily?.length > 0;
  const hasProgress = progress.weightSeries?.length > 0;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Analytics</h1>
          <p className="muted">Workout, nutrition, and progress insights</p>
        </div>
        <span className="chip accent">
          <FiActivity size={13} /> Workout · nutrition · progress
        </span>
      </div>

      <section>
        <h2 className="section-title">Workouts</h2>
        {!hasWorkouts ? (
          <EmptyState
            icon={<FiActivity />}
            title="No workout data"
            message="Log workouts to reveal insights."
          />
        ) : (
          <Stagger className="charts-grid">
            <StaggerItem className="card chart-card">
              <div className="card-head">
                <h2>Workouts per day</h2>
                <span className="chip">
                  <FiCalendar size={12} /> 30 days
                </span>
              </div>
              <div className="chart-fade-in">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={workout.frequency.map((f) => ({ ...f, date: f._id }))} margin={{ top: 6, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="freqBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chart.accentHover} />
                        <stop offset="100%" stopColor={chart.c1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} width={32} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'var(--chart-hover)' }} content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Workouts" fill="url(#freqBarGrad)" radius={[7, 7, 0, 0]} maxBarSize={38} animationDuration={900} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </StaggerItem>

            <StaggerItem className="card chart-card">
              <div className="card-head">
                <h2>By category</h2>
                <span className="chip">{workout.categoryDistribution.length} types</span>
              </div>
              <div className="chart-fade-in">
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={workout.categoryDistribution} dataKey="count" nameKey="_id" innerRadius={50} outerRadius={85} paddingAngle={2} label>
                      {workout.categoryDistribution.map((c, i) => (
                        <Cell key={i} fill={CATEGORY_FILLS[c._id] || CATEGORY_FILLS[CATEGORY_TONES[c._id]] || 'var(--muted)'} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </StaggerItem>
          </Stagger>
        )}

        {hasWorkouts && workout.topExercises?.length > 0 && (
          <div className="card">
            <div className="card-head">
              <h2>Top exercises</h2>
              <span className="chip accent">
                <FiTrendingUp size={12} /> {workout.topExercises.length} exercises
              </span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Exercise</th>
                    <th>Sessions</th>
                    <th>Avg sets</th>
                    <th>Avg reps</th>
                  </tr>
                </thead>
                <Stagger as="tbody">
                  {workout.topExercises.map((e) => (
                    <StaggerItem as="tr" key={e._id}>
                      <td data-label="Exercise" className="strong">
                        {e._id}
                      </td>
                      <td data-label="Sessions">{e.count}</td>
                      <td data-label="Avg sets">{formatNumber(e.avgSets, 1)}</td>
                      <td data-label="Avg reps">{formatNumber(e.avgReps, 1)}</td>
                    </StaggerItem>
                  ))}
                </Stagger>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="section-title">Nutrition</h2>
        {!hasNutrition ? (
          <EmptyState
            icon={<FiCoffee />}
            title="No nutrition data"
            message="Log meals to reveal insights."
          />
        ) : (
          <Stagger className="charts-grid">
            <StaggerItem className="card chart-card">
              <div className="card-head">
                <h2>Calories per day</h2>
                <span className="chip">
                  <FiCalendar size={12} /> 30 days
                </span>
              </div>
              <div className="chart-fade-in">
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={nutrition.daily.map((d) => ({ ...d, date: d._id }))} margin={{ top: 6, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chart.c2} stopOpacity={0.5} />
                        <stop offset="95%" stopColor={chart.c2} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} width={44} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ stroke: 'var(--border)' }} content={<ChartTooltip formatter={(v) => `${formatNumber(v)} kcal`} />} />
                    <Area type="monotone" dataKey="calories" name="kcal" stroke={chart.c2} strokeWidth={2.5} fill="url(#calGrad)" dot={{ r: 3, fill: chart.c2, strokeWidth: 0 }} activeDot={{ r: 5 }} animationDuration={900} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </StaggerItem>

            <StaggerItem className="card chart-card">
              <div className="card-head">
                <h2>Macros · all time</h2>
                <span className="chip">{nutrition.totals.macroBreakdown.length} macros</span>
              </div>
              <div className="chart-fade-in">
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={nutrition.totals.macroBreakdown} dataKey="grams" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2} label>
                      {nutrition.totals.macroBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={(v) => `${v} g`} />} />
                    <Legend wrapperStyle={{ color: 'var(--muted)', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </StaggerItem>
          </Stagger>
        )}

        {hasNutrition && (
          <Stagger className="stats-grid">
            <StaggerItem className="stat-card stat-accent-orange">
              <div className="stat-card-head">
                <span className="stat-label">Total entries</span>
                <span className="stat-icon">
                  <FiFileText />
                </span>
              </div>
              <div className="stat-line">
                <strong>{formatNumber(nutrition.totals.entries)}</strong>
              </div>
            </StaggerItem>
            <StaggerItem className="stat-card stat-accent-red">
              <div className="stat-card-head">
                <span className="stat-label">Total calories</span>
                <span className="stat-icon">
                  <FiCoffee />
                </span>
              </div>
              <div className="stat-line">
                <strong>{formatNumber(nutrition.totals.totalCalories)} kcal</strong>
              </div>
            </StaggerItem>
            <StaggerItem className="stat-card stat-accent-green">
              <div className="stat-card-head">
                <span className="stat-label">Total protein</span>
                <span className="stat-icon">
                  <FiZap />
                </span>
              </div>
              <div className="stat-line">
                <strong>{formatNumber(nutrition.totals.totalProtein)} g</strong>
              </div>
            </StaggerItem>
          </Stagger>
        )}
      </section>

      <section>
        <h2 className="section-title">Progress</h2>
        {!hasProgress ? (
          <EmptyState
            icon={<FiTrendingUp />}
            title="No progress data"
            message="Track your weight to reveal insights."
          />
        ) : (
          <motion.div
            className="card chart-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.12 }}
          >
            <div className="card-head">
              <h2>Weight trend</h2>
              <span className="chip accent">
                <FiTrendingUp size={12} /> {progress.weightSeries.length} points
              </span>
            </div>
            <div className="chart-fade-in">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={progress.weightSeries.map((p) => ({ ...p, date: toISODate(p.date), weight: wu.raw(p.weight) }))} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--muted)', fontSize: 11 }} width={44} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${Math.round(Number(v) * 10) / 10} ${wu.unit}`} />} />
                  <Line type="monotone" dataKey="weight" name={`Weight (${wu.unit})`} stroke={chart.c5} strokeWidth={2.5} dot={{ r: 3, fill: chart.c5, strokeWidth: 0 }} activeDot={{ r: 5 }} animationDuration={900} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}

export default Analytics;
