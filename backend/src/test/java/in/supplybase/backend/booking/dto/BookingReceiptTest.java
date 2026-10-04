package in.supplybase.backend.booking.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingStatus;

/**
 * The message a customer reads after booking. There is no online payment on
 * the website, so it must never ask them to pay now to confirm; the visit fee
 * goes to the team on the day of the visit.
 */
class BookingReceiptTest {

    private static Booking.BookingBuilder booking() {
        return Booking.builder().id(1L).bookingNumber("SB-20261003-000001").serviceLabel("Painting")
                .status(BookingStatus.PAYMENT_PENDING).preferredDate(LocalDate.of(2026, 10, 10));
    }

    @Test
    @DisplayName("a plain site visit: the visit fee is paid to the team on the day")
    void plainVisit() {
        BookingReceipt r = BookingReceipt.from(booking().visitFeePaise(9900L).build());

        assertThat(r.message())
                .contains("contact you to confirm")
                .contains("₹99.00 home visit fee is paid to our team on the day of the visit")
                .contains("adjusted into your final bill")
                .doesNotContain("Pay the")
                .doesNotContain("fee to confirm");
    }

    @Test
    @DisplayName("priced items within the threshold: the services are paid for on the day")
    void itemisedWithinThreshold() {
        BookingReceipt r = BookingReceipt.from(booking().visitFeePaise(250000L).itemsTotalPaise(250000L).build());

        assertThat(r.homeVisitFeeOnly()).isFalse();
        assertThat(r.message())
                .contains("pay for your selected services to our team on the day of the visit")
                .doesNotContain("Pay for your")
                .doesNotContain("services to confirm");
    }

    @Test
    @DisplayName("priced items above the threshold: the flat visit fee is paid on the day, the estimate follows inspection")
    void itemisedAboveThreshold() {
        BookingReceipt r = BookingReceipt.from(booking().visitFeePaise(9900L).itemsTotalPaise(1119960L).build());

        assertThat(r.homeVisitFeeOnly()).isTrue();
        assertThat(r.message())
                .contains("₹99.00 home visit fee is paid to our team on the day of the visit")
                .contains("estimate will be confirmed after inspection")
                .doesNotContain("Pay the")
                .doesNotContain("fee to confirm");
    }
}
