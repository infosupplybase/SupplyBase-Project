package in.supplybase.backend.payment.dto;

import jakarta.validation.constraints.NotBlank;

/** The three values Razorpay's checkout hands back to the browser on success. */
public record VerifyPaymentRequest(
        @NotBlank String razorpayOrderId,
        @NotBlank String razorpayPaymentId,
        @NotBlank String razorpaySignature) {
}
