package in.supplybase.backend.booking.dto;

import java.time.Instant;
import java.time.LocalDate;

import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingStatus;
import in.supplybase.backend.booking.BookingType;

/**
 * What a PROFESSIONAL sees for a job assigned to them.
 *
 * Deliberately trimmed: no budgetRange, no visit fee or payment info. Per
 * Role.PROFESSIONAL, they do the work and never see the commercial side of
 * a booking.
 */
public record ProfessionalBookingResponse(
        Long id, String reference, String bookingNumber,
        BookingType bookingType, BookingStatus status,
        String serviceLabel, String propertyType, Integer areaSqft,
        String workNature, String workOption, String workDetail,
        LocalDate preferredDate, String preferredSlot,
        String name, String phone, String whatsapp,
        String address, String location,
        boolean attachmentsPending, Instant createdAt) {

    public static ProfessionalBookingResponse from(Booking b) {
        return new ProfessionalBookingResponse(
                b.getId(), b.getReference(), b.getBookingNumber(),
                b.getBookingType(), b.getStatus(),
                b.getServiceLabel(), b.getPropertyType(), b.getAreaSqft(),
                b.getWorkNature(), b.getWorkOption(), b.getWorkDetail(),
                b.getPreferredDate(),
                b.getPreferredSlot() == null ? null : b.getPreferredSlot().label(),
                b.getName(), b.getPhone(), b.getWhatsapp(),
                b.getAddress(), b.getLocation(),
                b.isAttachmentsPending(), b.getCreatedAt());
    }
}
