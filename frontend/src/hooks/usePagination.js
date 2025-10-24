import { useState } from 'react';
export default function usePagination(initial=1) {
  const [page, setPage] = useState(initial);
  const next = () => setPage(p => p + 1);
  const prev = () => setPage(p => Math.max(1, p - 1));
  const go = (p) => setPage(p);
  return { page, next, prev, go };
}