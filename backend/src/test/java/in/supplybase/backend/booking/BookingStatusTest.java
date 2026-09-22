package in.supplybase.backend.booking;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import jakarta.persistence.Column;

/**
 * Guards against a status name outgrowing its column.
 *
 * PROFESSIONAL_ASSIGNED is 21 characters and bookings.status was VARCHAR(20),
 * so on MySQL in strict mode every attempt to assign a professional failed
 * with "Data too long for column 'status'" (see V22__widen_booking_status.sql).
 * Nothing caught it because no test here talks to a real database.
 *
 * This checks the entity's declared length, which V22 and any later widening
 * are meant to match — when a status is added, this fails until Booking.status
 * (and a migration) are widened too, instead of the first assignment failing
 * in production.
 */
class BookingStatusTest {

    @Test
    @DisplayName("every BookingStatus name fits the length Booking.status declares")
    void everyStatusFitsTheColumn() throws NoSuchFieldException {
        int columnLength = Booking.class.getDeclaredField("status").getAnnotation(Column.class).length();

        for (BookingStatus status : BookingStatus.values()) {
            assertThat(status.name().length())
                    .as("%s must fit in bookings.status (VARCHAR(%d))", status, columnLength)
                    .isLessThanOrEqualTo(columnLength);
        }
    }
}
