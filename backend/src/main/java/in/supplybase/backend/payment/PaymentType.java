package in.supplybase.backend.payment;

public enum PaymentType {
    /** Booking amount that starts a project. */
    ADVANCE,
    /** Tied to a project stage. */
    MILESTONE,
    /** Ad-hoc amount raised against a client. */
    INVOICE
}
