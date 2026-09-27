package in.supplybase.backend.partner.dto;

import java.time.Instant;
import java.time.LocalDate;

import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingStatus;

/**
 * A job assigned to a partner, as the admin sees it on the partner's detail —
 * with what that job pays them and whether it has been paid out.
 */
public record PartnerJobResponse(
        Long bookingId, String bookingNumber, String serviceLabel, BookingStatus status,
        String customerName, String location, LocalDate preferredDate, Instant createdAt,
        Long payoutPaise, Instant paidAt, Instant completedAt) {

    public static PartnerJobResponse from(Booking b) {
        return new PartnerJobResponse(
                b.getId(), b.getBookingNumber(), b.getServiceLabel(), b.getStatus(),
                b.getName(), b.getLocation(), b.getPreferredDate(), b.getCreatedAt(),
                b.getPartnerPayoutPaise(), b.getPartnerPaidAt(), b.getCompletedAt());
    }
}
