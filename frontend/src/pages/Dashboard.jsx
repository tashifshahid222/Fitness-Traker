import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  FiActivity,
  FiCoffee,
  FiTarget,
  FiTrendingUp,
  FiPlus,
  FiChevronRight,
  FiCalendar,
} from 'react-icons/fi';
import dashboardService from '../services/dashboardService';
import StatCard from '../components/StatCard';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import ProgressBar from '../components/ProgressBar';
import ChartTooltip from '../components/ChartTooltip';
import Skeleton, { SkeletonStat, SkeletonChart } from '../components/Skeleton';
import { Stagger, StaggerItem, EASE } from '../components/Transitions';
import { useAuth } from '../hooks/useAuth';
import useChartPalette from '../hooks/useChartPalette';
import useWeightUnit from '../hooks/useWeightUnit';
import { formatDate } from '../utils/format';
import { extractError } from '../services/api';

function Welcome() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';
  const slogan =
    hour < 12
      ? 'Morning momentum counts — log your first session before the day gets away.'
      : hour < 18
        ? 'Halfway through the day. Keep the streak alive with a quick log.'
        : 'Wrap up the day right — record what you did and plan tomorrow’s win.';

  return (
    <section className="welcome">
      <div className="welcome-body">
        <p className="welcome-eyebrow">{formatDate(new Date())}</p>
        <h1>
          {timeOfDay}, {firstName}
        </h1>
        <p>{slogan}</p>
      </div>
      <div className="welcome-actions">
        <Link to="/workouts/new" className="btn btn-white">
          <FiPlus /> Log workout
        </Link>
        <Link to="/nutrition/new" className="btn btn-ghost">
          <FiCoffee /> Add meal
        </Link>
        <Link to="/goals" className="btn btn-ghost">
          <FiTarget /> Goals
        </Link>
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="stats-grid">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonStat key={i} />
        ))}
      </div>
      <div className="charts-grid">
        {[0, 1].map((i) => (
          <div className="skeleton-card" key={i} style={{ padding: '1.3rem 1.45rem' }}>
            <Skeleton width="40%" height="1rem" />
            <SkeletonChart />
          </div>
        ))}
      </div>
    </>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const requestRef = useRef(null);
  const chart = useChartPalette();
  const wu = useWeightUnit();

  const load = useCallback(async () => {
    // Cancel any request still in flight before starting a fresh one.
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setLoading(true);
    setError('');
    try {
      const res = await dashboardService.getSummary(controller.signal);
      if (controller.signal.aborted) return;
      setData(res.data);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(extractError(err, 'Could not load your dashboard'));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => requestRef.current?.abort();
  }, [load]);

  if (loading) {
    return (
      <div className="page">
        <Welcome />
        <DashboardSkeleton />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="page">
        <Welcome />
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  const { summary, weeklyWorkouts, weightTrend, recentWorkouts, recentNutrition, recentProgress, activeGoals } = data;
  const weightData = weightTrend.map((p) => ({ ...p, weight: wu.raw(p.weight) }));
  const formatChartWeight = (v) => `${Math.round(Number(v) * 10) / 10} ${wu.unit}`;

  return (
    <div className="page">
      <Welcome />

      <section className="stats-grid">
        <StatCard
          index={0}
          label="Workouts · 7 days"
          value={summary.workoutsLast7Days}
          icon={<FiActivity />}
          hint={weeklyWorkouts.some((d) => d.count > 0) ? 'Keep the streak going' : 'Let’s get moving'}
        />
        <StatCard
          index={1}
          label="Calories · today"
          value={summary.caloriesToday}
          unit="kcal"
          icon={<FiCoffee />}
          hint={`P ${summary.macrosToday.protein}g · C ${summary.macrosToday.carbohydrates}g · F ${summary.macrosToday.fats}g`}
        />
        <StatCard
          index={2}
          label="Current weight"
          value={summary.currentWeight ? wu.amount(summary.currentWeight) : 0}
          unit={wu.unit}
          decimals={1}
          icon={<FiTrendingUp />}
          hint={summary.currentWeightDate ? `Logged ${formatDate(summary.currentWeightDate)}` : 'No weigh-ins yet'}
        />
        <StatCard
          index={3}
          label="Active goals"
          value={summary.activeGoalsCount}
          icon={<FiTarget />}
          hint={activeGoals.length ? 'Stay on track' : 'Set a goal to begin'}
        />
      </section>

      <section className="charts-grid">
        <motion.div
          className="card chart-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.28 }}
        >
          <div className="card-head">
            <h2>Workouts this week</h2>
            <span className="chip">
              <FiCalendar size={12} /> 7 days
            </span>
          </div>
          {weeklyWorkouts.every((d) => d.count === 0) ? (
            <EmptyState
              icon={<FiActivity />}
              title="No workouts this week"
              message="Log your first workout to see your weekly rhythm."
            />
          ) : (
            <div className="chart-fade-in">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weeklyWorkouts} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chart.accentHover} />
                      <stop offset="100%" stopColor={chart.c1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} width={32} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'var(--chart-hover)' }} content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Workouts" fill="url(#barGrad)" radius={[7, 7, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        <motion.div
          className="card chart-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.36 }}
        >
          <div className="card-head">
            <h2>Weight trend</h2>
            <span className="chip accent">
              <FiTrendingUp size={12} /> {weightTrend.length} points
            </span>
          </div>
          {weightTrend.length === 0 ? (
            <EmptyState
              icon={<FiTrendingUp />}
              title="No weigh-ins yet"
              message="Track your weight in Progress to chart the trend."
            />
          ) : (
            <div className="chart-fade-in">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={weightData} margin={{ top: 6, right: 6, bottom: 0, left: -14 }}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chart.c5} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={chart.c5} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--muted)', fontSize: 11 }} width={40} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip formatter={formatChartWeight} />} />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    name={`Weight (${wu.unit})`}
                    stroke={chart.c5}
                    strokeWidth={2.5}
                    fill="url(#weightGrad)"
                    dot={{ r: 3, fill: chart.c5, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </section>

      <section>
        <Stagger className="dash-lists" as="div">
          {recentWorkouts.length > 0 && (
            <StaggerItem as="div" hover>
              <div className="card hover">
                <div className="card-head">
                  <h2>Recent workouts</h2>
                  <Link to="/workouts" className="card-link">
                    View all <FiChevronRight />
                  </Link>
                </div>
                <ul className="dash-list">
                  {recentWorkouts.map((w) => (
                    <li key={w._id}>
                      <div>
                        <strong>{w.exerciseName}</strong>
                        <span className="muted">
                          {formatDate(w.date)} · {w.category}
                        </span>
                      </div>
                      <span className="list-meta">
                        {w.sets}×{w.reps}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          )}

          {recentNutrition.length > 0 && (
            <StaggerItem as="div" hover>
              <div className="card hover">
                <div className="card-head">
                  <h2>Recent meals</h2>
                  <Link to="/nutrition" className="card-link">
                    View all <FiChevronRight />
                  </Link>
                </div>
                <ul className="dash-list">
                  {recentNutrition.map((m) => (
                    <li key={m._id}>
                      <div>
                        <strong style={{ textTransform: 'capitalize' }}>{m.mealType}</strong>
                        <span className="muted capped">{(m.foodItems || []).join(', ')}</span>
                      </div>
                      <span className="list-meta">{m.calories} kcal</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          )}

          <StaggerItem as="div" hover>
            <div className="card hover">
              <div className="card-head">
                <h2>Active goals</h2>
                <Link to="/goals" className="card-link">
                  Manage <FiChevronRight />
                </Link>
              </div>
              {activeGoals.length === 0 ? (
                <EmptyState
                  icon={<FiTarget />}
                  title="No active goals"
                  message="Goals keep you honest — create one now."
                />
              ) : (
                <div className="goal-mini-list">
                  {activeGoals.map((g) => (
                    <div key={g._id} className="goal-mini">
                      <div className="goal-mini-top">
                        <strong>{g.title}</strong>
                        <span className="muted">{Math.round(Number(g.progressPercent) || 0)}%</span>
                      </div>
                      <ProgressBar value={Number(g.progressPercent) || 0} showLabel={false} />
                      {g.deadline && <p className="muted">{formatDate(g.deadline)} deadline</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </StaggerItem>

          {recentProgress.length > 0 && (
            <StaggerItem as="div" hover>
              <div className="card hover">
                <div className="card-head">
                  <h2>Latest progress log</h2>
                  <Link to="/progress" className="card-link">
                    View all <FiChevronRight />
                  </Link>
                </div>
                <ul className="dash-list">
                  {recentProgress.map((p) => (
                    <li key={p._id}>
                      <div>
                        <strong>{formatDate(p.date)}</strong>
                        <span className="muted">{p.notes || 'No notes'}</span>
                      </div>
                      <span className="list-meta">
                        {p.weight !== null && p.weight !== undefined ? wu.display(p.weight) : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          )}
        </Stagger>
      </section>
    </div>
  );
}

export default Dashboard;
