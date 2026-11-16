import { useEffect, useState } from 'react';

const readVar = (name, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return v.trim() || fallback;
};

const compute = () => ({
  c1: readVar('--c-1', '#c6f432'),
  c2: readVar('--c-2', '#fbbf24'),
  c3: readVar('--c-3', '#38bdf8'),
  c4: readVar('--c-4', '#fb7185'),
  c5: readVar('--c-5', '#34d399'),
  c6: readVar('--c-6', '#8d8c83'),
  accent: readVar('--accent', '#c6f432'),
  accentHover: readVar('--accent-hover', '#d4ff4a'),
  grid: readVar('--border', '#2a2b26'),
  text: readVar('--muted', '#8d8c83'),
});

export default function useChartPalette() {
  const [palette, setPalette] = useState(compute);

  useEffect(() => {
    const refresh = () => setPalette(compute());
    refresh();
    const mo = new MutationObserver(refresh);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  return palette;
}
