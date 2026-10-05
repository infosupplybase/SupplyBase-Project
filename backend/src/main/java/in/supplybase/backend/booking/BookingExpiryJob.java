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
 * Auto-cancels bookings whose online payment was started and never finished.
 *
 * A PAYMENT_PENDING or BOOKING_REQUESTED booking whose customer opened online
 * checkout more than app.booking.expiry-hours ago and still has not paid is
 * not going anywhere, so this frees the appointment seat it is holding.
 *
 * A booking whose customer never opened checkout is left alone: the site
 * tells them they can pay our team on the day of the visit, so it is not
 * "unpaid" until then. Staff cancel those by hand if they need to.
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

    @Scheduled(fixedDelayString = "${app.booking.expiry-check-interval-ms:900000}") // 15 min default
    @Transactional
    public void expireStaleBookings() {
        Instant cutoff = Instant.now().minus(Duration.ofHours(props.booking().expiryHours()));
        List<Booking> stale = bookings.findByStatusInAndPaidAtIsNullAndOnlineCheckoutAtBefore(EXPIRABLE, cutoff);
        if (stale.isEmpty()) {
            return;
        }

        for (Booking booking : stale) {
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setCancelledReason(
                    "Automatically cancelled — payment was not completed in time.");
            if (booking.getAppointmentSlot() != null) {
                appointments.release(booking.getAppointmentSlot());
            }
        }
        bookings.saveAll(stale);
        log.info("Expired {} booking(s) with online payment unfinished after {} hour(s)",
                stale.size(), props.booking().expiryHours());
    }
}
