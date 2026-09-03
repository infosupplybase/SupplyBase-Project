package in.supplybase.backend.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Staff-initiated refund. Omitting amountPaise means a full refund — Razorpay
 * refunds the entire captured amount when no amount is given, so this field
 * must stay optional rather than required.
 */
public record RefundRequest(
        @Positive(message = "The refund amount must be positive") Long amountPaise,
        @NotBlank(message = "A reason is required") @Size(max = 300) String reason) {
}
