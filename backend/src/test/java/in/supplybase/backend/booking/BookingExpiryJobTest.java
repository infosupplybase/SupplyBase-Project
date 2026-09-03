package in.supplybase.backend.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import in.supplybase.backend.appointment.AppointmentService;
import in.supplybase.backend.appointment.AppointmentSlot;
import in.supplybase.backend.config.AppProperties;

@ExtendWith(MockitoExtension.class)
class BookingExpiryJobTest {

    @Mock private BookingRepository bookings;
    @Mock private AppointmentService appointments;

    private BookingExpiryJob job;

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties(
                List.of("*"), null, null, null, null, null, null,
                new AppProperties.Booking(24), null);
        job = new BookingExpiryJob(bookings, appointments, props);
    }

    @Test
    @DisplayName("stale bookings are cancelled and their held slots are released")
    void cancelsStaleBookingsAndReleasesSlots() {
        AppointmentSlot slot = AppointmentSlot.builder().id(5L).capacity(1).bookedCount(1).build();
        Booking withSlot = Booking.builder().id(1L).status(BookingStatus.PAYMENT_PENDING)
                .appointmentSlot(slot).build();
        Booking withoutSlot = Booking.builder().id(2L).status(BookingStatus.BOOKING_REQUESTED).build();

        when(bookings.findByStatusInAndCreatedAtBefore(anyList(), any(Instant.class)))
                .thenReturn(List.of(withSlot, withoutSlot));

        job.expireStaleBookings();

        assertThat(withSlot.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        assertThat(withSlot.getCancelledReason()).isNotBlank();
        assertThat(withoutSlot.getStatus()).isEqualTo(BookingStatus.CANCELLED);

        verify(appointments, times(1)).release(any());
        verify(appointments).release(slot);
        verify(bookings).saveAll(List.of(withSlot, withoutSlot));
    }

    @Test
    @DisplayName("an empty query result does nothing")
    void doesNothingWhenNoStaleBookings() {
        when(bookings.findByStatusInAndCreatedAtBefore(anyList(), any(Instant.class)))
                .thenReturn(List.of());

        job.expireStaleBookings();

        verifyNoInteractions(appointments);
        verify(bookings, never()).saveAll(any());
    }
}
