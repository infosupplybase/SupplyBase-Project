package in.supplybase.backend.booking;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import in.supplybase.backend.appointment.AppointmentService;
import in.supplybase.backend.config.AppProperties;

/**
 * Auto-cancels bookings whose visiting fee was not paid in time.
 *
 * Every booking must pay its visiting fee online to be confirmed, and its
 * payment window (app.booking.payment-window-minutes) starts when it is made
 * (onlineCheckoutAt). A PAYMENT_PENDING or BOOKING_REQUESTED booking still
 * unpaid after that is not going anywhere, so this cancels it and frees the
 * appointment seat it is holding.
 *
 * Bookings made before the fee was compulsory, whose customer was told they
 * could pay on the day and never opened checkout, have no onlineCheckoutAt
 * and are left alone. Staff cancel those by hand if they need to.
 */
@Component
public class BookingExpiryJob {

    private static final Logger log = LoggerFactory.getLogger(BookingExpiryJob.class);

    private static final List<BookingStatus> EXPIRABLE =
            List.of(BookingStatus.PAYMENT_PENDING, BookingStatus.BOOKING_REQUESTED);

    private final BookingRepository bookings;
    private final AppointmentService appointments;
    private final AppProperties props;

    public BookingExpiryJob(BookingRepository bookings, AppointmentService appointments,
                            AppProperties props) {
        this.bookings = bookings;
        this.appointments = appointments;
        this.props = props;
    }

    @Scheduled(fixedDelayString = "${app.booking.expiry-check-interval-ms:300000}") // 5 min default
    @Transactional
    public void expireStaleBookings() {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(props.booking().paymentWindowMinutes()));
        List<Booking> stale = bookings.findByStatusInAndPaidAtIsNullAndOnlineCheckoutAtBefore(EXPIRABLE, cutoff);
        if (stale.isEmpty()) {
            return;
        }

        for (Booking booking : stale) {
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setCancelledReason(
                    "Automatically cancelled — the visiting fee was not paid in time.");
            if (booking.getAppointmentSlot() != null) {
                appointments.release(booking.getAppointmentSlot());
            }
        }
        bookings.saveAll(stale);
        log.info("Expired {} booking(s) with the visiting fee unpaid after {} minute(s)",
                stale.size(), props.booking().paymentWindowMinutes());
    }
}
