package in.supplybase.backend.payment;

public enum PaymentStatus {
    /** Raised and payable, no Razorpay order yet or order not completed. */
    PENDING,
    /** Money captured and signature verified. */
    PAID,
    FAILED,
    REFUNDED,
    CANCELLED
}
