package in.supplybase.backend.booking.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import in.supplybase.backend.appointment.AppointmentSlot;
import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingStatus;
import in.supplybase.backend.booking.TimeSlot;

/** What customers and staff are shown about when a visit is and what it costs. */
class BookingResponseTest {

    @Test
    @DisplayName("a booking made with a picked time carries that time, the visit fee and the items total")
    void carriesAppointmentTimeAndAmounts() {
        Booking booking = Booking.builder().id(1L).status(BookingStatus.PAYMENT_PENDING)
                .preferredDate(LocalDate.of(2026, 10, 5))
                .appointmentSlot(AppointmentSlot.builder()
                        .slotDate(LocalDate.of(2026, 10, 5)).slotTime(LocalTime.of(18, 0)).build())
                .visitFeePaise(9900L).itemsTotalPaise(199600L)
                .build();

        BookingResponse response = BookingResponse.from(booking);

        assertThat(response.appointmentTime()).isEqualTo(LocalTime.of(18, 0));
        assertThat(response.preferredSlot()).isNull();
        assertThat(response.visitFeePaise()).isEqualTo(9900L);
        assertThat(response.itemsTotalPaise()).isEqualTo(199600L);
    }

    @Test
    @DisplayName("an old two-lane booking keeps its slot label and has no picked time")
    void legacyBookingKeepsSlotLabel() {
        Booking booking = Booking.builder().id(1L).status(BookingStatus.CONFIRMED)
                .preferredSlot(TimeSlot.values()[0])
                .build();

        BookingResponse response = BookingResponse.from(booking);

        assertThat(response.appointmentTime()).isNull();
        assertThat(response.preferredSlot()).isEqualTo(TimeSlot.values()[0].label());
        assertThat(response.itemsTotalPaise()).isNull();
    }
}
