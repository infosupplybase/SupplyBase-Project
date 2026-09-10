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
         * True when visitFee is the flat ₹99 home-visit/assessment fee rather
         * than the real items total — i.e. the cart total exceeded ₹5,000, or
         * this was a pure consultation booking with no priced items.
         */
        boolean homeVisitFeeOnly,
        String message) {

    public static BookingReceipt from(Booking b) {
        String message = b.getItemsTotalPaise() != null && !isHomeVisitFeeOnly(b)
                ? "Your booking is reserved. Pay for your selected services to confirm it."
                : "Your booking is reserved. Pay the ₹99 home visit fee to confirm it — it will be adjusted into your final bill if you proceed.";
        return new BookingReceipt(
                b.getBookingNumber(), b.getStatus(),
                b.getServiceLabel(), b.getPreferredDate(),
                b.getAppointmentSlot() == null ? null : b.getAppointmentSlot().getSlotTime(),
                Money.paiseToRupees(b.getVisitFeePaise()),
                "₹" + Money.formatRupees(b.getVisitFeePaise()),
                b.getItemsTotalPaise() == null ? null : Money.paiseToRupees(b.getItemsTotalPaise()),
                b.getItemsTotalPaise() == null ? null : "₹" + Money.formatRupees(b.getItemsTotalPaise()),
                isHomeVisitFeeOnly(b),
                message);
    }

    private static boolean isHomeVisitFeeOnly(Booking b) {
        return b.getItemsTotalPaise() == null || b.getVisitFeePaise() != b.getItemsTotalPaise();
    }
}
