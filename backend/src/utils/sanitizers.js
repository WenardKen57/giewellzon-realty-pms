const DANGEROUS_KEYS = ['$','__proto__','constructor','prototype'];

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (DANGEROUS_KEYS.some(d => key.startsWith(d)) || key.includes('.')) {
      delete obj[key];
      continue;
    }
    if (typeof obj[key] === 'object') sanitizeObject(obj[key]);
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/[\u0000-\u001F\u007F<>$]/g, '').trim();
    }
  }
  return obj;
}

module.exports = { sanitizeObject };