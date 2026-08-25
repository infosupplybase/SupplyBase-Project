package in.supplybase.backend.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import in.supplybase.backend.payment.PaymentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Staff raise a payable against a client. */
public record CreatePaymentRequest(
        @NotNull(message = "A client is required") Long userId,
        Long projectId,
        Long stageId,
        @NotNull(message = "A payment type is required") PaymentType paymentType,
        @NotBlank(message = "A description is required") @Size(max = 255) String description,
        @NotNull(message = "An amount is required")
        @DecimalMin(value = "1.00", message = "The amount must be at least ₹1")
        BigDecimal amount,
        LocalDate dueDate) {
}
