export const formatPHP = v =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v ?? 0);

export const shortDate = d => {
  if (!d) return '-';
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(new Date(d));
};