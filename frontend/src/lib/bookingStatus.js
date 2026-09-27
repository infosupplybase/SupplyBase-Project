/**
 * Customer-facing wording for BookingStatus (backend/.../booking/BookingStatus.java).
 * Kept separate from the admin app's own internal labels — a client sees
 * "Assigning a Professional", staff see "ASSIGNMENT_PENDING".
 */
const LABELS = {
  PAYMENT_PENDING: 'Payment Pending',
  BOOKING_REQUESTED: 'Booking Requested',
  CONFIRMED: 'Confirmed',
  ASSIGNMENT_PENDING: 'Assigning a Professional',
  PROFESSIONAL_ASSIGNED: 'Professional Assigned',
  SITE_VISIT_SCHEDULED: 'Site Visit Scheduled',
  SITE_VISIT_COMPLETED: 'Site Visit Completed',
  QUOTATION_CREATED: 'Quotation Ready',
  QUOTATION_SENT: 'Quotation Sent',
  CUSTOMER_APPROVED: 'Quotation Approved',
  WORK_SCHEDULED: 'Work Scheduled',
  WORK_IN_PROGRESS: 'Work In Progress',
  WORK_COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const bookingStatusLabel = (status) => LABELS[status] || status;

/** Same three-tone split as the admin app's toneFor(), for one visual language. */
export const bookingStatusTone = (status) => {
  if (status === 'CANCELLED') return 'danger';
  if (status === 'WORK_COMPLETED') return 'success';
  if (['PAYMENT_PENDING', 'BOOKING_REQUESTED', 'ASSIGNMENT_PENDING'].includes(status)) return 'warning';
  return 'accent';
};
