package in.supplybase.backend.booking.dto;

import java.time.Instant;
import java.time.LocalDate;

import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingStatus;
import in.supplybase.backend.booking.BookingType;
import in.supplybase.backend.booking.MaterialSupplier;

public record BookingResponse(
        Long id, String reference, String bookingNumber,
        BookingType bookingType, BookingStatus status,
        String serviceSlug, String serviceLabel, String propertyType, Integer areaSqft,
        String workNature, String workOption, String workDetail,
        MaterialSupplier materialSupplier, String budgetRange,
        LocalDate preferredDate, String preferredSlot,
        String name, String phone, String whatsapp, String email,
        String address, String location,
        boolean attachmentsPending, String adminNotes, Instant createdAt) {

    public static BookingResponse from(Booking b) {
        return new BookingResponse(
                b.getId(), b.getReference(), b.getBookingNumber(),
                b.getBookingType(), b.getStatus(),
                b.getServiceSlug(), b.getServiceLabel(), b.getPropertyType(), b.getAreaSqft(),
                b.getWorkNature(), b.getWorkOption(), b.getWorkDetail(),
                b.getMaterialSupplier(), b.getBudgetRange(),
                b.getPreferredDate(),
                b.getPreferredSlot() == null ? null : b.getPreferredSlot().label(),
                b.getName(), b.getPhone(), b.getWhatsapp(), b.getEmail(),
                b.getAddress(), b.getLocation(),
                b.isAttachmentsPending(), b.getAdminNotes(), b.getCreatedAt());
    }

}
