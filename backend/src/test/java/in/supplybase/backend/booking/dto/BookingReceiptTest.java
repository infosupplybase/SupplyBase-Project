package in.supplybase.backend.booking.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingStatus;

/**
 * The message a customer reads after booking. Every booking must pay its
 * visiting fee online to be confirmed, so the receipt asks for it; the email
 * sent once it is paid says it is confirmed.
 */
class BookingReceiptTest {

    private static Booking.BookingBuilder booking() {
        return Booking.builder().id(1L).bookingNumber("SB-20261003-000001").serviceLabel("Painting")
                .status(BookingStatus.PAYMENT_PENDING).preferredDate(LocalDate.of(2026, 10, 10));
    }

    @Test
    @DisplayName("a plain site visit: pay the visiting fee now to confirm")
    void plainVisit() {
        BookingReceipt r = BookingReceipt.from(booking().visitFeePaise(9900L).build());

        assertThat(r.homeVisitFeeOnly()).isTrue();
        assertThat(r.message())
                .contains("Pay the ₹99.00 visiting fee to confirm your booking")
                .doesNotContain("on the day of the visit")
                .doesNotContain("estimate");
    }

    @Test
    @DisplayName("priced items: the fee is paid now, the estimate is settled after the visit")
    void itemised() {
        BookingReceipt r = BookingReceipt.from(booking().visitFeePaise(9900L).itemsTotalPaise(250000L).build());

        assertThat(r.homeVisitFeeOnly()).isTrue();
        assertThat(r.visitFeeDisplay()).isEqualTo("₹99.00");
        assertThat(r.message())
                .contains("Pay the ₹99.00 visiting fee to confirm")
                .contains("₹2,500.00 estimate is confirmed after the visit");
    }

    @Test
    @DisplayName("once paid, the email message says the booking is confirmed")
    void paid() {
        assertThat(BookingReceipt.paidMessage(booking().visitFeePaise(9900L).build()))
                .contains("₹99.00 visiting fee is paid and your booking is confirmed")
                .doesNotContain("Pay the");
    }
}
