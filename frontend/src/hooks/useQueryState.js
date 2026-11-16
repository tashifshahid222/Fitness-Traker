import { useState } from 'react';
import { useMemo } from 'react';

export function useQueryState(initial) {
  const [state, setState] = useState(initial);
  const setters = useMemo(
    () => ({
      setPage: (page) => setState((s) => ({ ...s, page })),
      setSearch: (search) => setState((s) => ({ ...s, search, page: 1 })),
      setFilter: (filter) => setState((s) => ({ ...s, ...filter, page: 1 })),
      setPageSize: (pageSize) => setState((s) => ({ ...s, pageSize, page: 1 })),
      reset: () => setState(initial),
    }),
    [initial]
  );
  return [state, setters];
}