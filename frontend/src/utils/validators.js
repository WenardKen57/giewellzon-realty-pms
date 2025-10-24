export function validateEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
export function required(v) {
  return v !== undefined && v !== null && (typeof v !== 'string' || v.trim() !== '');
}