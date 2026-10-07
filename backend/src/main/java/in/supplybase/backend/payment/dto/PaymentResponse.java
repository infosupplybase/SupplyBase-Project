package in.supplybase.backend.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import in.supplybase.backend.booking.BookingStatus;
import in.supplybase.backend.common.Money;
import in.supplybase.backend.payment.Payment;
import in.supplybase.backend.payment.PaymentStatus;
import in.supplybase.backend.payment.PaymentType;

public record PaymentResponse(
        Long id, String reference, PaymentType paymentType, String description,
        BigDecimal amount, String amountDisplay, String currency, PaymentStatus status,
        LocalDate dueDate, String projectName, String razorpayOrderId,
        Instant paidAt, Instant createdAt,
        // Who pays it, and the booking it is the fee for (null when it is
        // not a booking fee), so staff can find a booking's payment without
        // searching descriptions, and see a paid fee on a cancelled booking.
        Long clientId, String clientName, String clientPhone,
        Long bookingId, String bookingNumber, BookingStatus bookingStatus,
        // True when staff can ask Razorpay to refund it: paid online, with a
        // Razorpay payment id on record. See PaymentService.initiateRefund.
        boolean refundable) {

    public static PaymentResponse from(Payment p) {
        return new PaymentResponse(
                p.getId(), p.getReference(), p.getPaymentType(), p.getDescription(),
                Money.paiseToRupees(p.getAmountPaise()),
                "₹" + Money.formatRupees(p.getAmountPaise()),
                p.getCurrency(), p.getStatus(), p.getDueDate(),
                p.getProject() == null ? null : p.getProject().getName(),
                p.getRazorpayOrderId(), p.getPaidAt(), p.getCreatedAt(),
                p.getUser() == null ? null : p.getUser().getId(),
                p.getUser() == null ? null : p.getUser().getFullName(),
                p.getUser() == null ? null : p.getUser().getPhone(),
                p.getBooking() == null ? null : p.getBooking().getId(),
                p.getBooking() == null ? null : p.getBooking().getBookingNumber(),
                p.getBooking() == null ? null : p.getBooking().getStatus(),
                p.getStatus() == PaymentStatus.PAID && p.getRazorpayPaymentId() != null);
    }
}
