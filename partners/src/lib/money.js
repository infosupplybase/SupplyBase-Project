/**
 * Money arrives from the API in paise (whole numbers) and is only turned into
 * rupees here, at the edge, for display.
 */

/** 150000 -> "₹1,500"; 150050 -> "₹1,500.50" (never "₹1,500.5"); null -> "—". */
export const formatRupees = (paise) => {
  if (paise == null) return '—';
  const decimals = paise % 100 === 0 ? 0 : 2;
  return `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};
