package in.supplybase.backend.payment.dto;

/**
 * Everything Razorpay's browser checkout needs to open.
 *
 * keyId is the PUBLIC key and is safe to send. The secret never leaves the
 * server — it is only ever used to sign and to verify.
 */
public record RazorpayOrderResponse(
        String orderId,
        String keyId,
        long amountPaise,
        String currency,
        String paymentReference,
        String description,
        String customerName,
        String customerEmail,
        String customerPhone) {
}
