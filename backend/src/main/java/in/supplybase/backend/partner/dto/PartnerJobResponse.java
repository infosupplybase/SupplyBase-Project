package in.supplybase.backend.partner.dto;

import java.time.Instant;
import java.time.LocalDate;

import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingStatus;

/** A job assigned to a partner, as the admin sees it on the partner's detail. */
public record PartnerJobResponse(
        Long bookingId, String bookingNumber, String serviceLabel, BookingStatus status,
        String customerName, String location, LocalDate preferredDate, Instant createdAt) {

    public static PartnerJobResponse from(Booking b) {
        return new PartnerJobResponse(
                b.getId(), b.getBookingNumber(), b.getServiceLabel(), b.getStatus(),
                b.getName(), b.getLocation(), b.getPreferredDate(), b.getCreatedAt());
    }
}
