const pad = (n) => String(n).padStart(2, '0');

export function formatDateTime(iso) {
  if (!iso) return 'None';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

export function formatMoney(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return 'None';
  return Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPct(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return 'None';
  return `${Number(n).toFixed(1)}%`;
}

export function formatValue(v) {
  if (v === null || v === undefined) return 'None';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

export function humanize(s) {
  const t = String(s ?? '').replace(/_/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
