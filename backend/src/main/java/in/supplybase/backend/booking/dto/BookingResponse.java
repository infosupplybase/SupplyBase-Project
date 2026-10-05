package in.supplybase.backend.booking.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

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
        // The visit time the customer picked (appointment_slots). preferredSlot
        // is only set on the old two-lane bookings, so new ones need this.
        LocalTime appointmentTime,
        // What the customer pays on the day, and their cart's total (null
        // when nothing in the booking was priced). See BookingReceipt.
        long visitFeePaise, Long itemsTotalPaise,
        String name, String phone, String whatsapp, String email,
        String address, String location, String pincode,
        boolean attachmentsPending, String adminNotes, Instant createdAt,
        Long assignedProfessionalId, String assignedProfessionalName, String assignedProfessionalPhone,
        // Empty for the /mine list (no reason to pay for the extra query for
        // every row when nobody's looking at it yet) — populated only by
        // BookingService.get(), the single-booking detail fetch. workNature/
        // workOption/workDetail above are never actually set by the current
        // wizard flow (it writes per-question BookingAnswer rows instead, see
        // BookingService.storeAnswers) — this is the real "what did they
        // actually ask for" data.
        List<BookingAnswerResponse> answers,
        // When the fee was paid online through Razorpay; null while unpaid.
        Instant paidAt,
        // When the customer first opened online checkout; null if they never
        // did. Only such a booking can be auto-cancelled (BookingExpiryJob).
        Instant onlineCheckoutAt) {

    public static BookingResponse from(Booking b) {
        return from(b, List.of());
    }

    public static BookingResponse from(Booking b, List<BookingAnswerResponse> answers) {
        return new BookingResponse(
                b.getId(), b.getReference(), b.getBookingNumber(),
                b.getBookingType(), b.getStatus(),
                b.getServiceSlug(), b.getServiceLabel(), b.getPropertyType(), b.getAreaSqft(),
                b.getWorkNature(), b.getWorkOption(), b.getWorkDetail(),
                b.getMaterialSupplier(), b.getBudgetRange(),
                b.getPreferredDate(),
                b.getPreferredSlot() == null ? null : b.getPreferredSlot().label(),
                b.getAppointmentSlot() == null ? null : b.getAppointmentSlot().getSlotTime(),
                b.getVisitFeePaise(), b.getItemsTotalPaise(),
                b.getName(), b.getPhone(), b.getWhatsapp(), b.getEmail(),
                b.getAddress(), b.getLocation(), b.getPincode(),
                b.isAttachmentsPending(), b.getAdminNotes(), b.getCreatedAt(),
                b.getAssignedProfessional() == null ? null : b.getAssignedProfessional().getId(),
                b.getAssignedProfessional() == null ? null : b.getAssignedProfessional().getFullName(),
                b.getAssignedProfessional() == null ? null : b.getAssignedProfessional().getPhone(),
                answers,
                b.getPaidAt(),
                b.getOnlineCheckoutAt());
    }

}
