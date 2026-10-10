package in.supplybase.backend.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingStatus;
import in.supplybase.backend.common.Money;

/**
 * What the form gets back after submitting, before payment.
 *
 * Thin on purpose: the endpoint is reachable without signing in, so echoing
 * the whole record would let anyone read back somebody else's booking.
 */
public record BookingReceipt(
        String bookingNumber,
        BookingStatus status,
        String serviceName,
        LocalDate date,
        LocalTime time,
        BigDecimal visitFee,
        String visitFeeDisplay,
        /** Sum of the cart's line items, shown for transparency — null when this booking has none. */
        BigDecimal itemsTotal,
        String itemsTotalDisplay,
        /**
         * True when visitFee is the flat visiting fee rather than the items
         * total. Always true now that every booking pays the same ₹99 upfront;
         * kept so older pages reading it still label the amount correctly.
         */
        boolean homeVisitFeeOnly,
        String message) {

    /** The receipt the booking form gets back: the booking waits for its visiting fee. */
    public static BookingReceipt from(Booking b) {
        String feeDisplay = "₹" + Money.formatRupees(b.getVisitFeePaise());
        String message = "Pay the " + feeDisplay + " visiting fee now to confirm your booking. Your time slot is"
                + " held while you pay, and the booking is cancelled if it is not paid. The " + feeDisplay
                + " is adjusted into your final bill" + estimateNote(b) + ".";
        return new BookingReceipt(
                b.getBookingNumber(), b.getStatus(),
                b.getServiceLabel(), b.getPreferredDate(),
                b.getAppointmentSlot() == null ? null : b.getAppointmentSlot().getSlotTime(),
                Money.paiseToRupees(b.getVisitFeePaise()),
                feeDisplay,
                b.getItemsTotalPaise() == null ? null : Money.paiseToRupees(b.getItemsTotalPaise()),
                b.getItemsTotalPaise() == null ? null : "₹" + Money.formatRupees(b.getItemsTotalPaise()),
                true,
                message);
    }

    /** What the confirmation email says once the visiting fee is paid. */
    public static String paidMessage(Booking b) {
        String feeDisplay = "₹" + Money.formatRupees(b.getVisitFeePaise());
        return "Your " + feeDisplay + " visiting fee is paid and your booking is confirmed. Our team will contact"
                + " you before the visit. The " + feeDisplay + " is adjusted into your final bill"
                + estimateNote(b) + ".";
    }

    private static String estimateNote(Booking b) {
        return b.getItemsTotalPaise() == null ? ""
                : "; your ₹" + Money.formatRupees(b.getItemsTotalPaise())
                        + " estimate is confirmed after the visit and paid to our team";
    }
}
