package in.supplybase.backend.booking.dto;

import java.time.Instant;

import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingStatus;

/**
 * A job's partner payout, for the admin. Separate from {@code BookingResponse}
 * on purpose: that one is also what the customer receives, and the customer
 * must never see what the partner is paid.
 */
public record PartnerPayoutResponse(
        Long bookingId, String bookingNumber, BookingStatus status,
        Long partnerId, String partnerName,
        Long amountPaise, Instant paidAt, Instant completedAt) {

    public static PartnerPayoutResponse from(Booking b) {
        return new PartnerPayoutResponse(
                b.getId(), b.getBookingNumber(), b.getStatus(),
                b.getAssignedProfessional() == null ? null : b.getAssignedProfessional().getId(),
                b.getAssignedProfessional() == null ? null : b.getAssignedProfessional().getFullName(),
                b.getPartnerPayoutPaise(), b.getPartnerPaidAt(), b.getCompletedAt());
    }
}
