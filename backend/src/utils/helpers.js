// Helper function to pick allowed fields from an object
function pick(obj, keys) {
  const out = {};
  if (!obj) return out;
  keys.forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}

// Helper function to ensure a value is an array of strings
function ensureArrayStrings(a) {
  if (!a) return [];
  if (Array.isArray(a)) return a.map((x) => String(x)).filter(Boolean);
  return [String(a)].filter(Boolean);
}

module.exports = { pick, ensureArrayStrings };
