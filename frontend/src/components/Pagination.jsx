function Pagination({ page = 1, totalPages = 1, onChange }) {
  if (totalPages <= 1) return null;

  const candidates = new Set([1, totalPages]);
  for (let p = page - 1; p <= page + 1; p += 1) {
    if (p >= 1 && p <= totalPages) candidates.add(p);
  }
  const unique = [...candidates].sort((a, b) => a - b);

  const items = [];
  let prev = 0;
  unique.forEach((p) => {
    if (p - prev > 1) items.push('ellipsis');
    items.push(p);
    prev = p;
  });

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="page-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Prev
      </button>
      {items.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e${i}`} className="page-ellipsis">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={p === page ? 'page-btn active' : 'page-btn'}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button type="button" className="page-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}

export default Pagination;