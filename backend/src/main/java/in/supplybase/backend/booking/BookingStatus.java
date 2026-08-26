package in.supplybase.backend.booking;

/**
 * The booking lifecycle, in the order it actually happens.
 *
 * PAYMENT_PENDING is the entry point, not CONFIRMED: a booking exists the
 * moment the form is submitted, but it is not a promise to visit anyone until
 * the ₹25 has been verified server-side (RULE 7).
 */
public enum BookingStatus {
    PAYMENT_PENDING,
    BOOKING_REQUESTED,
    CONFIRMED,
    ASSIGNMENT_PENDING,
    PROFESSIONAL_ASSIGNED,
    SITE_VISIT_SCHEDULED,
    SITE_VISIT_COMPLETED,
    QUOTATION_CREATED,
    QUOTATION_SENT,
    CUSTOMER_APPROVED,
    WORK_SCHEDULED,
    WORK_IN_PROGRESS,
    WORK_COMPLETED,
    CANCELLED;

    /** Everything that has to happen before the customer sees a quotation. */
    public boolean isBeforeVisit() {
        return this == PAYMENT_PENDING || this == BOOKING_REQUESTED || this == CONFIRMED
                || this == ASSIGNMENT_PENDING || this == PROFESSIONAL_ASSIGNED
                || this == SITE_VISIT_SCHEDULED;
    }

    /** A cancelled booking is finished; nothing may move it on. */
    public boolean isFinal() {
        return this == CANCELLED || this == WORK_COMPLETED;
    }
}
