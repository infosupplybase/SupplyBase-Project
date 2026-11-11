package in.supplybase.backend.notification;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipient_IdOrderByCreatedAtDesc(Long userId);

    long countByRecipient_IdAndReadFalse(Long userId);

    /**
     * Marks a booking's "pay the visiting fee to confirm" prompt as read, so
     * the bell stops asking for a payment once the booking is paid or cancelled.
     */
    @Modifying
    @Query("update Notification n set n.read = true"
            + " where n.relatedBookingId = :bookingId"
            + " and n.notificationType = 'BOOKING_RECEIVED' and n.read = false")
    int markPaymentPromptRead(@Param("bookingId") Long bookingId);

}
