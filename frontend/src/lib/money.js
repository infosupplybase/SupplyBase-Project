/** ₹1,199 — the catalogue's `price`/`estimateMin` etc. fields are already
    rupees (converted from paise server-side), always whole numbers here. */
export const formatRupees = (value) => `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;

/** A line item's price. ₹0 marks work priced on site (an inspection), so it
    says that instead of showing "₹0". */
export const formatItemPrice = (value) =>
  Number(value) > 0 ? formatRupees(value) : 'Priced after inspection';
