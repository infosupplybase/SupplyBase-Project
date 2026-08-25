package in.supplybase.backend.booking.dto;

import java.time.Instant;
import java.time.LocalDate;

import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingStatus;
import in.supplybase.backend.booking.BookingType;
import in.supplybase.backend.booking.MaterialSupplier;

public record BookingResponse(
        Long id, String reference, BookingType bookingType, BookingStatus status,
        String serviceSlug, String serviceLabel, String propertyType, Integer areaSqft,
        String workNature, String workOption, String workDetail,
        MaterialSupplier materialSupplier, String budgetRange,
        LocalDate preferredDate, String preferredSlot,
        String name, String phone, String whatsapp, String email,
        String address, String location,
        boolean attachmentsPending, String adminNotes, Instant createdAt) {

    public static BookingResponse from(Booking b) {
        return new BookingResponse(
                b.getId(), b.getReference(), b.getBookingType(), b.getStatus(),
                b.getServiceSlug(), b.getServiceLabel(), b.getPropertyType(), b.getAreaSqft(),
                b.getWorkNature(), b.getWorkOption(), b.getWorkDetail(),
                b.getMaterialSupplier(), b.getBudgetRange(),
                b.getPreferredDate(),
                b.getPreferredSlot() == null ? null : b.getPreferredSlot().label(),
                b.getName(), b.getPhone(), b.getWhatsapp(), b.getEmail(),
                b.getAddress(), b.getLocation(),
                b.isAttachmentsPending(), b.getAdminNotes(), b.getCreatedAt());
    }

    /**
     * What the public form gets back. Deliberately thin: the POST is
     * unauthenticated, so echoing the whole record would let anyone read back
     * what was stored about somebody else's booking.
     */
    public record Receipt(String reference, BookingType bookingType, String message,
                          boolean sendAttachments) {

        public static Receipt of(Booking b) {
            String message = b.getBookingType() == BookingType.PROJECT
                    ? "Your site visit has been requested. We will contact you on WhatsApp or "
                      + "phone to confirm the appointment, and follow up with a quotation."
                    : "Your site visit has been requested. We will contact you on WhatsApp or "
                      + "phone to confirm the appointment.";
            return new Receipt(b.getReference(), b.getBookingType(), message,
                    b.isAttachmentsPending());
        }
    }
}
