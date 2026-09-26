package in.supplybase.backend.booking.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingAnswer;
import in.supplybase.backend.booking.BookingStatus;
import in.supplybase.backend.booking.BookingType;

/**
 * What a PROFESSIONAL sees for a job assigned to them.
 *
 * Deliberately trimmed: no budgetRange, no visit fee or customer payment
 * info. Per Role.PROFESSIONAL, they do the work and never see the commercial
 * side of a booking. The one money field is their own: what they earn for
 * this job ({@code partnerPayoutPaise}) and when it was paid out.
 *
 * {@code requirements} is what the customer asked for in the booking wizard
 * (which service, which rooms, which material…) — the scope of the job, which
 * the partner needs in order to do it. Question and answer only: the prices
 * the customer was quoted for those answers are left out.
 */
public record ProfessionalBookingResponse(
        Long id, String reference, String bookingNumber,
        BookingType bookingType, BookingStatus status,
        String serviceLabel, String propertyType, Integer areaSqft,
        String workNature, String workOption, String workDetail,
        LocalDate preferredDate, String preferredSlot,
        String name, String phone, String whatsapp,
        String address, String location,
        boolean attachmentsPending, Instant createdAt,
        Long partnerPayoutPaise, Instant partnerPaidAt, Instant completedAt,
        List<Requirement> requirements) {

    /** One thing the customer asked for. No price. */
    public record Requirement(String question, String answer, int quantity) {

        public static Requirement from(BookingAnswer a) {
            return new Requirement(
                    a.getQuestionText() != null ? a.getQuestionText() : a.getQuestionKey(),
                    a.getAnswerLabel() != null ? a.getAnswerLabel() : a.getAnswerValue(),
                    a.getQuantity());
        }
    }

    public static ProfessionalBookingResponse from(Booking b) {
        return from(b, List.of());
    }

    /**
     * The customer's phone, WhatsApp and street address are shared only while
     * the partner still has work to do. Once the job is completed or
     * cancelled they are withheld (the area in {@code location} stays, so the
     * job still reads sensibly in the partner's history): a partner keeps no
     * standing list of customers' numbers and home addresses, and a later
     * question about a finished job goes through Supplybase.
     */
    public static ProfessionalBookingResponse from(Booking b, List<Requirement> requirements) {
        boolean closed = b.getStatus() == BookingStatus.WORK_COMPLETED
                || b.getStatus() == BookingStatus.CANCELLED;
        return new ProfessionalBookingResponse(
                b.getId(), b.getReference(), b.getBookingNumber(),
                b.getBookingType(), b.getStatus(),
                b.getServiceLabel(), b.getPropertyType(), b.getAreaSqft(),
                b.getWorkNature(), b.getWorkOption(), b.getWorkDetail(),
                b.getPreferredDate(),
                b.getPreferredSlot() == null ? null : b.getPreferredSlot().label(),
                b.getName(),
                closed ? null : b.getPhone(),
                closed ? null : b.getWhatsapp(),
                closed ? null : b.getAddress(),
                b.getLocation(),
                b.isAttachmentsPending(), b.getCreatedAt(),
                b.getPartnerPayoutPaise(), b.getPartnerPaidAt(), b.getCompletedAt(),
                requirements);
    }
}
