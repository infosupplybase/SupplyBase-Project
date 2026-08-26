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
        String message) {

    public static BookingReceipt from(Booking b) {
        return new BookingReceipt(
                b.getBookingNumber(), b.getStatus(),
                b.getServiceLabel(), b.getPreferredDate(),
                b.getAppointmentSlot() == null ? null : b.getAppointmentSlot().getSlotTime(),
                Money.paiseToRupees(b.getVisitFeePaise()),
                "₹" + Money.formatRupees(b.getVisitFeePaise()),
                "Your booking is reserved. Pay the site visit fee to confirm it.");
    }
}
