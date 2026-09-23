package in.supplybase.backend.booking.dto;

import java.time.LocalDate;

import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingStatus;
import in.supplybase.backend.booking.TimeSlot;
import in.supplybase.backend.common.Money;

/**
 * Full booking payload for the customer's own details page
 * (GET /api/bookings/{id}). Unlike BookingReceipt, which is a thin
 * confirmation screen after checkout, this exposes every field the
 * customer is allowed to see on their booking — including the ones
 * they can edit.
 */
public record BookingDetailResponse(
        Long id,
        String reference,
        String bookingNumber,
        BookingStatus status,
        String serviceSlug,
        String serviceLabel,
        LocalDate preferredDate,
        TimeSlot preferredSlot,
        String location,
        String address,
        String city,
        String pincode,
        String name,
        String phone,
        String email,
        String assignedProfessionalName,
        String assignedProfessionalPhone,
        long visitFeePaise,
        String visitFeeDisplay,
        String createdAt
) {
    public static BookingDetailResponse from(Booking b) {
        String profName = null;
        String profPhone = null;
        if (b.getAssignedProfessional() != null) {
            profName = b.getAssignedProfessional().getFullName();
            profPhone = b.getAssignedProfessional().getPhone();
        }
        return new BookingDetailResponse(
                b.getId(),
                b.getReference(),
                b.getBookingNumber(),
                b.getStatus(),
                b.getServiceSlug(),
                b.getServiceLabel(),
                b.getPreferredDate(),
                b.getPreferredSlot(),
                b.getLocation(),
                b.getAddress(),
                b.getCity(),
                b.getPincode(),
                b.getName(),
                b.getPhone(),
                b.getEmail(),
                profName,
                profPhone,
                b.getVisitFeePaise(),
                "₹" + Money.formatRupees(b.getVisitFeePaise()),
                b.getCreatedAt() == null ? null : b.getCreatedAt().toString()
        );
    }
}