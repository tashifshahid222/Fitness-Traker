import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function useCountUp(target, { duration = 900, decimals = 0 } = {}) {
  const isNumber = typeof target === 'number' && Number.isFinite(target);
  const [value, setValue] = useState(isNumber && !prefersReducedMotion() ? 0 : target);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!isNumber || prefersReducedMotion()) {
      setValue(target);
      return undefined;
    }
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = from + (target - from) * eased;
      setValue(decimals ? Number(next.toFixed(decimals)) : Math.round(next));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, decimals, isNumber]);

  if (!isNumber) return target;
  return decimals ? Number(value).toFixed(decimals) : Math.round(value);
}
