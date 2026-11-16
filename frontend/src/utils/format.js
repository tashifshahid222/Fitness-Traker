export function toISODate(date) {
  if (!date) return new Date().toISOString().slice(0, 10);
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${formatDate(d)} · ${formatTime(d)}`;
}

export function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return '—';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

export const LB_PER_KG = 2.20462;

export function fromKg(kg, unit = 'kg') {
  const value = Number(kg);
  if (!Number.isFinite(value)) return kg;
  return unit === 'lb' ? value * LB_PER_KG : value;
}

export function toKg(value, unit = 'kg') {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return unit === 'lb' ? n / LB_PER_KG : n;
}

export function formatWeight(kg, unit = 'kg') {
  if (kg === null || kg === undefined || kg === '') return '—';
  const converted = fromKg(kg, unit);
  const rounded = Math.round(Number(converted) * 10) / 10;
  return `${rounded} ${unit}`;
}

export function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}