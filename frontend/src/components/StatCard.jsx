import { useMemo } from 'react';
import { motion } from 'framer-motion';
import useCountUp from '../hooks/useCountUp';
import { EASE } from './Transitions';

const PALETTE = [
  'stat-accent-green',
  'stat-accent-blue',
  'stat-accent-orange',
  'stat-accent-purple',
  'stat-accent-cyan',
  'stat-accent-red',
];

function AnimatedValue({ value, unit, decimals = 0 }) {
  const animated = useCountUp(value, { duration: 950, decimals });
  return (
    <span className="stat-value">
      {typeof animated === 'number' ? animated.toLocaleString() : animated}
      {unit && <em>{unit}</em>}
    </span>
  );
}

function StatCard({ label, value, hint, icon, index = 0, unit, trend, decimals = 0 }) {
  const accent = useMemo(() => PALETTE[index % PALETTE.length], [index]);
  const renderValue = Array.isArray(value) ? value : [value];
  return (
    <motion.div
      className={`stat-card ${accent}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: EASE } }}
      transition={{ duration: 0.45, ease: EASE, delay: index * 0.07 }}
    >
      <div className="stat-card-head">
        <span className="stat-label">{label}</span>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <div className="stat-values">
        {renderValue.map((v, i) => (
          <AnimatedValue key={i} value={v} unit={unit} decimals={decimals} />
        ))}
        {trend && (
          <span className={`stat-trend ${trend.dir === 'down' ? 'down' : 'up'}`}>
            {trend.dir === 'down' ? '↓' : '↑'} {trend.value}
          </span>
        )}
      </div>
      {hint && <span className="stat-hint">{hint}</span>}
    </motion.div>
  );
}

export default StatCard;
