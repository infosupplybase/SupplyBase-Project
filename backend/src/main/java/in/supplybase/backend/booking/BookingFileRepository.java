package in.supplybase.backend.booking;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingFileRepository extends JpaRepository<BookingFile, Long> {

    List<BookingFile> findByBookingIdOrderByCreatedAtDesc(Long bookingId);

    /** How many files of one kind (PHOTO ...) a booking already has - caps customer photo uploads. */
    long countByBookingIdAndKind(Long bookingId, String kind);
}
