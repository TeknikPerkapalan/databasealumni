// ============================================================================
// VALIDATORS
// ============================================================================

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? '').trim());

export const minLength = (v, n) => String(v ?? '').trim().length >= n;

export const required = (v) => v !== undefined && v !== null && String(v).trim() !== '';

export const isURL = (v) => {
  if (!v) return true; // optional
  try { new URL(v); return true; } catch { return false; }
};

export const isPhone = (v) => /^[+0-9\s\-()]{7,20}$/.test(String(v ?? '').trim());

export const isYear = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1960 && n <= new Date().getFullYear() + 1;
};

// Validate against a schema map: { field: [validators...] }
export const validate = (data, schema) => {
  const errors = {};
  for (const [field, rules] of Object.entries(schema)) {
    for (const rule of rules) {
      const { fn, msg } = rule;
      if (!fn(data[field])) {
        errors[field] = msg;
        break;
      }
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
};
