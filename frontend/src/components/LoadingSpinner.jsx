function LoadingSpinner({ label = 'Loading…', compact = false }) {
  return (
    <div className={compact ? 'spinner-compact' : 'spinner-wrap'}>
      <span className="spinner" aria-hidden="true" />
      <span className="muted">{label}</span>
    </div>
  );
}

export default LoadingSpinner;