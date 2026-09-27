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
        String feeDisplay = "₹" + Money.formatRupees(b.getVisitFeePaise());
        String message;
        if (b.getItemsTotalPaise() == null) {
            // No priced items at all (a plain site-visit booking, or a
            // consultation-only plumbing booking) — nothing to itemise.
            message = "Your booking is reserved. Pay the " + feeDisplay
                    + " home visit fee to confirm it — it will be adjusted into your final bill if you proceed.";
        } else if (!isHomeVisitFeeOnly(b)) {
            // visitFeePaise IS the itemised total (plumbing's actual-pricing
            // case, itemsTotalPaise <= the ₹5,000 threshold) — the fee being
            // paid already equals the real charge, nothing more to add.
            message = "Your booking is reserved. Pay for your selected services to confirm it.";
        } else {
            // visitFeePaise is a flat fee SEPARATE from the itemised total —
            // plumbing over the ₹5,000 threshold, or any category (painting)
            // whose visit fee is never tied to its items total by design.
            String itemsDisplay = "₹" + Money.formatRupees(b.getItemsTotalPaise());
            message = "Your booking is reserved. Pay the " + feeDisplay + " home visit fee to confirm it — your "
                    + itemsDisplay + " estimate will be confirmed after inspection, and the fee will be adjusted "
                    + "into your final bill if you proceed.";
        }
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
