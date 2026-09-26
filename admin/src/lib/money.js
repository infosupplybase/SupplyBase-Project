/**
 * Money is kept in paise (whole numbers) everywhere it is stored or sent, and
 * only turned into rupees to show or to type. Never do arithmetic on the
 * rupee value — convert once, at the edge.
 */

/** 150000 -> "₹1,500"; 150050 -> "₹1,500.50" (never "₹1,500.5"). Whole rupees drop the ".00". */
export const formatRupees = (paise) => {
  if (paise == null) return '—';
  const decimals = paise % 100 === 0 ? 0 : 2;
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

/** 150000 -> "1500" (for an input's value). null -> "". */
export const paiseToInput = (paise) => (paise == null ? '' : String(paise / 100));

/**
 * What an admin typed ("1500", "1,500.50") -> paise, or null if it is empty.
 * Returns NaN for anything that isn't a plain non-negative amount with at most
 * two decimals, so the caller can refuse it instead of guessing.
 */
export const inputToPaise = (text) => {
  const clean = String(text ?? '').replace(/[,\s₹]/g, '');
  if (clean === '') return null;
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return Number.NaN;
  return Math.round(Number(clean) * 100);
};
