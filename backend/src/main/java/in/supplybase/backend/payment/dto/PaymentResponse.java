package in.supplybase.backend.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import in.supplybase.backend.common.Money;
import in.supplybase.backend.payment.Payment;
import in.supplybase.backend.payment.PaymentStatus;
import in.supplybase.backend.payment.PaymentType;

public record PaymentResponse(
        Long id, String reference, PaymentType paymentType, String description,
        BigDecimal amount, String amountDisplay, String currency, PaymentStatus status,
        LocalDate dueDate, String projectName, String razorpayOrderId,
        Instant paidAt, Instant createdAt) {

    public static PaymentResponse from(Payment p) {
        return new PaymentResponse(
                p.getId(), p.getReference(), p.getPaymentType(), p.getDescription(),
                Money.paiseToRupees(p.getAmountPaise()),
                "₹" + Money.formatRupees(p.getAmountPaise()),
                p.getCurrency(), p.getStatus(), p.getDueDate(),
                p.getProject() == null ? null : p.getProject().getName(),
                p.getRazorpayOrderId(), p.getPaidAt(), p.getCreatedAt());
    }
}
