const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildListOptions = (query, { sortable = ['-createdAt'], defaultSort = '-createdAt', maxLimit = 100 } = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const requestedLimit = parseInt(query.limit, 10) || 10;
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit);

  let sort = defaultSort;
  if (query.sort && sortable.includes(query.sort)) {
    sort = query.sort;
  }

  const search = typeof query.search === 'string' ? query.search.trim() : '';

  let from;
  let to;
  if (query.from) {
    const d = new Date(query.from);
    if (!Number.isNaN(d.getTime())) from = d;
  }
  if (query.to) {
    const d = new Date(query.to);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      to = d;
    }
  }

  return {
    page,
    limit,
    sort,
    search,
    from,
    to,
    skip: (page - 1) * limit,
  };
};

const buildMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

module.exports = { buildListOptions, buildMeta, escapeRegex };
