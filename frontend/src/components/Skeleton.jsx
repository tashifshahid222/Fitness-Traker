function Skeleton({ width = '100%', height = '1rem', radius, style, className = '' }) {
  return (
    <span
      className={`skeleton ${className}`}
      aria-hidden="true"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonStat() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="42%" height="0.65rem" />
        <Skeleton width="34px" height="34px" radius="8px" />
      </div>
      <Skeleton width="55%" height="1.8rem" />
      <Skeleton width="70%" height="0.7rem" />
    </div>
  );
}

export function SkeletonRows({ rows = 4 }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          <Skeleton width="36px" height="36px" radius="10px" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Skeleton width={`${45 + ((i * 13) % 35)}%`} height="0.8rem" />
            <Skeleton width={`${30 + ((i * 17) % 30)}%`} height="0.6rem" />
          </div>
          <Skeleton width="64px" height="0.8rem" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 240 }) {
  return (
    <div aria-hidden="true" style={{ height, display: 'flex', alignItems: 'flex-end', gap: '4%', padding: '0.5rem 0' }}>
      {[46, 72, 38, 88, 60, 78, 52].map((h, i) => (
        <Skeleton key={i} width="10%" height={`${h}%`} radius="6px" />
      ))}
    </div>
  );
}

export default Skeleton;
