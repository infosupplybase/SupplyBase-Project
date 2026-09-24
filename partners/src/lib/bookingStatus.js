/**
 * Wording and colour for BookingStatus (backend/.../booking/BookingStatus.java),
 * as a partner reads it. Copied from the customer site's bookingStatus.js with
 * one change: PROFESSIONAL_ASSIGNED reads "Assigned to you" here.
 */
const LABELS = {
  PAYMENT_PENDING: 'Payment Pending',
  BOOKING_REQUESTED: 'Booking Requested',
  CONFIRMED: 'Confirmed',
  ASSIGNMENT_PENDING: 'Assigning a Professional',
  PROFESSIONAL_ASSIGNED: 'Assigned to you',
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

export const jobStatusLabel = (status) => LABELS[status] || status;

export const jobStatusTone = (status) => {
  if (status === 'CANCELLED') return 'danger';
  if (status === 'WORK_COMPLETED') return 'success';
  if (['PAYMENT_PENDING', 'BOOKING_REQUESTED', 'ASSIGNMENT_PENDING'].includes(status)) return 'warning';
  return 'accent';
};

export const isFinished = (status) => status === 'WORK_COMPLETED' || status === 'CANCELLED';

/**
 * The one step a partner can take on their own job from each status — these
 * mirror the server's allow-list (BookingService.SELF_SERVICE_TRANSITIONS), so
 * a status not listed here means "waiting on Supplybase", not a missing button.
 */
export const NEXT_STEP = {
  SITE_VISIT_SCHEDULED: {
    status: 'SITE_VISIT_COMPLETED',
    label: 'Mark site visit done',
  },
  WORK_SCHEDULED: {
    status: 'WORK_IN_PROGRESS',
    label: 'Start work',
  },
  WORK_IN_PROGRESS: {
    status: 'WORK_COMPLETED',
    label: 'Mark work completed',
    confirm: 'Mark this job as completed? This tells Supplybase the work is finished.',
  },
};
