package in.supplybase.backend.booking;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    Optional<Booking> findByReference(String reference);

    Optional<Booking> findByBookingNumber(String bookingNumber);

    Page<Booking> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status, Pageable pageable);

    Page<Booking> findByBookingTypeOrderByCreatedAtDesc(BookingType type, Pageable pageable);

    /** The office's morning list: everything booked for one day, in slot order. */
    List<Booking> findByPreferredDateOrderByPreferredSlotAsc(LocalDate date);

    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** A professional's own job list. Naturally small, so a plain list is fine. */
    List<Booking> findByAssignedProfessionalIdOrderByCreatedAtDesc(Long professionalId);

    /** Backs BookingExpiryJob: unpaid or unconfirmed bookings nobody followed up on. */
    List<Booking> findByStatusInAndCreatedAtBefore(List<BookingStatus> statuses, Instant cutoff);

    /** Backs the flood check in BookingService. */
    long countByPhoneAndCreatedAtAfter(String phone, Instant since);
}
