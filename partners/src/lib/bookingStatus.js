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

/**
 * The five steps a partner's job goes through, for the progress bar on each
 * job card. Every BookingStatus maps to the step it is on; a status before the
 * site visit counts as "Assigned".
 */
export const JOB_STEPS = ['Assigned', 'Site visit', 'Quotation', 'Work', 'Done'];

const STEP_OF = {
  PAYMENT_PENDING: 0,
  BOOKING_REQUESTED: 0,
  CONFIRMED: 0,
  ASSIGNMENT_PENDING: 0,
  PROFESSIONAL_ASSIGNED: 0,
  SITE_VISIT_SCHEDULED: 1,
  SITE_VISIT_COMPLETED: 2,
  QUOTATION_CREATED: 2,
  QUOTATION_SENT: 2,
  CUSTOMER_APPROVED: 3,
  WORK_SCHEDULED: 3,
  WORK_IN_PROGRESS: 3,
  WORK_COMPLETED: 4,
};

/** Index into JOB_STEPS; null for a cancelled job, which has no place on the bar. */
export const jobStep = (status) => (status in STEP_OF ? STEP_OF[status] : null);

/**
 * "What do I do now?" for each status, in plain words. `you` is true when the
 * partner has something to do; otherwise they are waiting on Supplybase or
 * the customer, and the card says so rather than leaving them guessing.
 * `{on date}` is replaced with `when` — "today", "tomorrow" or "on Thu, 15 Oct".
 */
const GUIDE = {
  PROFESSIONAL_ASSIGNED: { you: false, text: 'Supplybase will fix the site visit time with the customer. It will show here.' },
  ASSIGNMENT_PENDING: { you: false, text: 'Supplybase is confirming this job with you. Nothing to do yet.' },
  CONFIRMED: { you: false, text: 'Supplybase will fix the site visit time with the customer. It will show here.' },
  BOOKING_REQUESTED: { you: false, text: 'The customer is still confirming this booking. Nothing to do yet.' },
  PAYMENT_PENDING: { you: false, text: 'The customer is still confirming this booking. Nothing to do yet.' },
  SITE_VISIT_SCHEDULED: { you: true, text: 'Visit the site{on date}. After the visit, tap “Mark site visit done”.' },
  SITE_VISIT_COMPLETED: { you: false, text: 'Supplybase is preparing the quotation from your visit.' },
  QUOTATION_CREATED: { you: false, text: 'The quotation is ready and going to the customer.' },
  QUOTATION_SENT: { you: false, text: 'The customer is looking at the quotation. We will tell you when they approve.' },
  CUSTOMER_APPROVED: { you: false, text: 'The customer approved the quotation. Supplybase will schedule the work with you.' },
  WORK_SCHEDULED: { you: true, text: 'Go to the site{on date} and tap “Start work” when you begin.' },
  WORK_IN_PROGRESS: { you: true, text: 'When the work is fully finished, tap “Mark work completed”.' },
  WORK_COMPLETED: { you: false, text: 'Job done. Your payout for it shows under Earnings.' },
  CANCELLED: { you: false, text: 'This job was cancelled. Nothing more to do.' },
};

export const jobGuide = (status, when) => {
  const guide = GUIDE[status] || { you: false, text: 'Waiting on Supplybase for the next step.' };
  return { you: guide.you, text: guide.text.replace('{on date}', when ? ` ${when}` : '') };
};
