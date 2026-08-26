package in.supplybase.backend.booking;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingAnswerRepository extends JpaRepository<BookingAnswer, Long> {

    List<BookingAnswer> findByBookingId(Long bookingId);
}
