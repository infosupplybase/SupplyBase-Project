package in.supplybase.backend.booking;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingAnswerRepository extends JpaRepository<BookingAnswer, Long> {

    List<BookingAnswer> findByBookingId(Long bookingId);

    /** Answers for many bookings at once, in the order they were given — one query instead of one per job. */
    List<BookingAnswer> findByBookingIdInOrderByIdAsc(Collection<Long> bookingIds);
}
