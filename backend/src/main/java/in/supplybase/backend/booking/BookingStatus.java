package in.supplybase.backend.booking;

public enum BookingStatus {
    /** Just requested. Nobody has spoken to the customer yet. */
    NEW,
    /** Team has agreed a real date and time with them. */
    CONFIRMED,
    VISIT_DONE,
    /** A quotation has gone out — the usual next step for a PROJECT. */
    QUOTED,
    WON,
    LOST,
    CANCELLED
}
