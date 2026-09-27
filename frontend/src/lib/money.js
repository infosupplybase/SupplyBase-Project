/** ₹1,199 — the catalogue's `price`/`estimateMin` etc. fields are already
    rupees (converted from paise server-side), always whole numbers here. */
export const formatRupees = (value) => `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;
