function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || !payload.length) return null;
  const swatch = (c) => (!c || c.startsWith('url(') ? 'var(--accent)' : c);
  return (
    <div className="chart-tooltip">
      {label != null && <p className="chart-tooltip-label">{label}</p>}
      {payload.map((entry) => (
        <div className="chart-tooltip-row" key={entry.dataKey || entry.name}>
          <span className="chart-tooltip-dot" style={{ background: swatch(entry.color || entry.fill) }} />
          <span>{entry.name}</span>
          <strong>{formatter ? formatter(entry.value, entry) : entry.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default ChartTooltip;
